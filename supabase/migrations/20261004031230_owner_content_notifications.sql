-- Capture committed CMS changes at the database, with a private inbox/outbox.
-- Recipient configuration is provisioned by a trusted server, never by a role
-- selected in the browser. No administrator/editor gains inbox access by role.
create table private.content_notification_config (
  singleton boolean primary key default true check (singleton),
  recipient_user_id uuid not null references auth.users(id) on delete restrict,
  email_enabled boolean not null default false,
  email_configured boolean not null default false,
  updated_at timestamptz not null default now()
);

create table private.content_change_batches (
  id bigint generated always as identity primary key,
  transaction_id bigint not null default txid_current(),
  entity_table text not null,
  entity_id text not null,
  before_snapshot jsonb,
  actor_id uuid,
  actor_name text,
  actor_role text,
  recipient_user_id uuid,
  occurred_at timestamptz not null default clock_timestamp(),
  unique (transaction_id, entity_table, entity_id)
);

create table private.content_notifications (
  id bigint generated always as identity primary key,
  recipient_user_id uuid,
  occurred_at timestamptz not null,
  entity_table text not null,
  entity_id text not null,
  entity_label text not null,
  action text not null check (action in ('create', 'update', 'delete')),
  actor_id uuid,
  actor_name text,
  actor_role text,
  actor_kind text not null check (actor_kind in ('user', 'system')),
  changed_fields text[] not null,
  before_values jsonb not null,
  after_values jsonb not null
);
create index content_notifications_recipient_cursor_idx
  on private.content_notifications(recipient_user_id, id desc);

create table private.content_notification_receipts (
  notification_id bigint primary key references private.content_notifications(id) on delete cascade,
  recipient_user_id uuid not null,
  read_at timestamptz not null default now()
);

create table private.content_notification_email_outbox (
  notification_id bigint primary key references private.content_notifications(id) on delete cascade,
  status text not null check (status in ('pending', 'sending', 'sent', 'failed', 'disabled')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  claim_token uuid,
  provider_id text,
  last_error text
);
create index content_notification_outbox_ready_idx
  on private.content_notification_email_outbox(available_at, notification_id)
  where status in ('pending', 'failed', 'sending');

alter table private.content_notification_config enable row level security;
alter table private.content_change_batches enable row level security;
alter table private.content_notifications enable row level security;
alter table private.content_notification_receipts enable row level security;
alter table private.content_notification_email_outbox enable row level security;
revoke all on private.content_notification_config, private.content_change_batches,
  private.content_notifications, private.content_notification_receipts,
  private.content_notification_email_outbox from public, anon, authenticated, service_role;
revoke all on sequence private.content_change_batches_id_seq,
  private.content_notifications_id_seq from public, anon, authenticated, service_role;

-- Only fixed CMS table names are accepted. Relationships become fields of the
-- parent snapshot so one atomic save (including category replacement) produces
-- one notification, and a delete/reinsert of identical links produces none.
create function private.content_entity_snapshot(p_table text, p_id text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_snapshot jsonb;
  v_related jsonb;
  v_relation_table text;
  v_parent_column text;
begin
  if p_table not in ('profiles', 'seasons', 'team_members', 'team_areas', 'categories',
    'projects', 'competitions', 'robots', 'achievements', 'galleries', 'posts',
    'sponsors', 'media_assets', 'about_page') then
    raise exception using errcode = '22023', message = 'Unsupported content entity';
  end if;
  if p_table = 'team_areas' then
    select to_jsonb(t) into v_snapshot from public.team_areas t where name = p_id;
  elsif p_table = 'about_page' then
    select to_jsonb(t) into v_snapshot from public.about_page t where id = p_id;
  else
    execute format('select to_jsonb(t) from public.%I t where id = $1::uuid', p_table)
      into v_snapshot using p_id;
  end if;
  if v_snapshot is null then return null; end if;
  v_snapshot := v_snapshot - 'created_at' - 'updated_at';
  if p_table = 'posts' then
    select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name) order by c.id), '[]'::jsonb)
      into v_related from public.post_categories pc join public.categories c on c.id = pc.category_id
      where pc.post_id = p_id::uuid;
    v_snapshot := v_snapshot || jsonb_build_object('categories', v_related);
  elsif p_table = 'galleries' then
    select coalesce(jsonb_agg(to_jsonb(i) - 'created_at' - 'gallery_id' order by i.id), '[]'::jsonb)
      into v_related from public.gallery_images i where i.gallery_id = p_id::uuid;
    v_snapshot := v_snapshot || jsonb_build_object('images', v_related);
  elsif p_table in ('robots', 'projects', 'competitions') then
    v_relation_table := case p_table when 'robots' then 'robot_team_members'
      when 'projects' then 'project_team_members' else 'competition_team_members' end;
    v_parent_column := case p_table when 'robots' then 'robot_id'
      when 'projects' then 'project_id' else 'competition_id' end;
    execute format('select coalesce(jsonb_agg(jsonb_build_object(''id'', m.id, ''name'', m.name) order by m.id), ''[]''::jsonb) from public.%I r join public.team_members m on m.id = r.team_member_id where r.%I = $1::uuid', v_relation_table, v_parent_column)
      into v_related using p_id;
    v_snapshot := v_snapshot || jsonb_build_object('team_members', v_related);
  end if;
  return v_snapshot;
end;
$$;

create function private.stage_content_change(p_table text, p_id text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_actor uuid := auth.uid(); v_name text; v_role text; v_recipient uuid;
begin
  if p_id is null then return; end if;
  -- This transaction's initial snapshot is sufficient; defer its final state
  -- until every row/relationship change and normalizer has completed.
  if exists (select 1 from private.content_change_batches where transaction_id = txid_current()
    and entity_table = p_table and entity_id = p_id) then return; end if;
  select left(display_name, 100), role::text into v_name, v_role
    from public.profiles where id = v_actor;
  select recipient_user_id into v_recipient from private.content_notification_config where singleton;
  insert into private.content_change_batches(entity_table, entity_id, before_snapshot,
    actor_id, actor_name, actor_role, recipient_user_id)
  values (p_table, p_id, private.content_entity_snapshot(p_table, p_id), v_actor, v_name, v_role, v_recipient)
  on conflict (transaction_id, entity_table, entity_id) do nothing;
end;
$$;

create function private.capture_content_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_old jsonb := case when tg_op <> 'INSERT' then to_jsonb(old) else null end;
  v_new jsonb := case when tg_op <> 'DELETE' then to_jsonb(new) else null end;
  v_table text := tg_table_name;
  v_id_column text := 'id';
  v_old_id text;
  v_new_id text;
begin
  if tg_op = 'UPDATE' and (v_old - 'created_at' - 'updated_at') = (v_new - 'created_at' - 'updated_at') then
    return new;
  end if;
  if v_table = 'post_categories' then v_table := 'posts'; v_id_column := 'post_id';
  elsif v_table = 'gallery_images' then v_table := 'galleries'; v_id_column := 'gallery_id';
  elsif v_table = 'robot_team_members' then v_table := 'robots'; v_id_column := 'robot_id';
  elsif v_table = 'project_team_members' then v_table := 'projects'; v_id_column := 'project_id';
  elsif v_table = 'competition_team_members' then v_table := 'competitions'; v_id_column := 'competition_id';
  elsif v_table = 'team_areas' then v_id_column := 'name'; end if;
  v_old_id := v_old ->> v_id_column;
  v_new_id := v_new ->> v_id_column;
  if v_old_id is not null then perform private.stage_content_change(v_table, v_old_id); end if;
  if v_new_id is not null and v_new_id is distinct from v_old_id then
    perform private.stage_content_change(v_table, v_new_id);
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create function private.content_notification_excerpt(p_value jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select case
    when jsonb_typeof(p_value) = 'string' and length(p_value #>> '{}') > 2000
      then to_jsonb(left(p_value #>> '{}', 2000) || '… [trecho]')
    when length(p_value::text) > 6000 then jsonb_build_object('excerpt', left(p_value::text, 6000), 'truncated', true)
    else p_value end;
$$;

create function private.finalize_content_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_after jsonb := private.content_entity_snapshot(new.entity_table, new.entity_id);
  v_before_values jsonb := '{}'::jsonb;
  v_after_values jsonb := '{}'::jsonb;
  v_fields text[];
  v_field text;
  v_label text;
  v_id bigint;
  v_email_ready boolean;
begin
  if new.before_snapshot is not distinct from v_after then
    delete from private.content_change_batches where id = new.id;
    return null;
  end if;
  select array_agg(key order by key) into v_fields from (
    select jsonb_object_keys(coalesce(new.before_snapshot, '{}'::jsonb)) as key
    union select jsonb_object_keys(coalesce(v_after, '{}'::jsonb)) as key
  ) fields where new.before_snapshot -> key is distinct from v_after -> key;
  foreach v_field in array coalesce(v_fields, '{}'::text[]) loop
    if new.before_snapshot ? v_field then
      v_before_values := v_before_values || jsonb_build_object(v_field, private.content_notification_excerpt(new.before_snapshot -> v_field));
    end if;
    if v_after ? v_field then
      v_after_values := v_after_values || jsonb_build_object(v_field, private.content_notification_excerpt(v_after -> v_field));
    end if;
  end loop;
  v_label := coalesce(v_after ->> 'title', v_after ->> 'name', v_after ->> 'label',
    v_after ->> 'event_name', v_after ->> 'headline', v_after ->> 'display_name',
    new.before_snapshot ->> 'title', new.before_snapshot ->> 'name', new.before_snapshot ->> 'label',
    new.before_snapshot ->> 'event_name', new.before_snapshot ->> 'headline',
    new.before_snapshot ->> 'display_name', new.entity_id);
  insert into private.content_notifications(recipient_user_id, occurred_at, entity_table,
    entity_id, entity_label, action, actor_id, actor_name, actor_role, actor_kind,
    changed_fields, before_values, after_values)
  values (new.recipient_user_id, new.occurred_at, new.entity_table, new.entity_id, left(v_label, 240),
    case when new.before_snapshot is null then 'create' when v_after is null then 'delete' else 'update' end,
    new.actor_id, new.actor_name, new.actor_role, case when new.actor_id is null then 'system' else 'user' end,
    coalesce(v_fields, '{}'::text[]), v_before_values, v_after_values)
  returning id into v_id;
  select email_enabled and email_configured and recipient_user_id = new.recipient_user_id into v_email_ready
    from private.content_notification_config where singleton;
  insert into private.content_notification_email_outbox(notification_id, status)
    values (v_id, case when coalesce(v_email_ready, false) then 'pending' else 'disabled' end);
  delete from private.content_change_batches where id = new.id;
  return null;
end;
$$;
create constraint trigger finalize_content_change
  after insert on private.content_change_batches deferrable initially deferred
  for each row execute function private.finalize_content_change();

do $$ declare v_table text; begin
  foreach v_table in array array['profiles', 'seasons', 'team_members', 'team_areas',
    'categories', 'projects', 'competitions', 'robots', 'achievements', 'galleries',
    'gallery_images', 'posts', 'post_categories', 'sponsors', 'media_assets',
    'robot_team_members', 'project_team_members', 'competition_team_members', 'about_page'] loop
    execute format('create trigger content_change_capture before insert or update or delete on public.%I for each row execute function private.capture_content_change()', v_table);
  end loop;
end; $$;

create function private.is_content_notification_owner()
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists (
    select 1 from private.content_notification_config where singleton and recipient_user_id = auth.uid()
  );
$$;

create function private.content_notification_status()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_config private.content_notification_config%rowtype; v_unread bigint; v_error text;
begin
  if not private.is_content_notification_owner() then
    return jsonb_build_object('is_owner', false, 'configured', false, 'unread_count', 0,
      'email_enabled', false, 'email_configured', false, 'last_email_error', null);
  end if;
  select * into v_config from private.content_notification_config where singleton;
  select count(*) into v_unread from private.content_notifications n
    where n.recipient_user_id = auth.uid() and not exists (
      select 1 from private.content_notification_receipts r where r.notification_id = n.id);
  select o.last_error into v_error from private.content_notification_email_outbox o
    join private.content_notifications n on n.id = o.notification_id
    where n.recipient_user_id = auth.uid() and o.status = 'failed'
    order by n.id desc limit 1;
  return jsonb_build_object('is_owner', true, 'configured', true, 'unread_count', v_unread,
    'email_enabled', v_config.email_enabled, 'email_configured', v_config.email_configured,
    'last_email_error', v_error);
end;
$$;

create function private.list_content_notifications(p_limit integer default 30,
  p_before_id bigint default null, p_unread_only boolean default false)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_result jsonb; v_limit integer := least(greatest(coalesce(p_limit, 30), 1), 100);
begin
  if not private.is_content_notification_owner() then
    raise exception using errcode = '42501', message = 'This inbox belongs exclusively to its configured owner';
  end if;
  select jsonb_build_object('items', coalesce(jsonb_agg(item order by id desc), '[]'::jsonb),
    'next_cursor', case when count(*) = v_limit then min(id) else null end)
  into v_result from (
    select n.id, to_jsonb(n) - 'recipient_user_id' || jsonb_build_object(
      'read_at', r.read_at, 'email_status', o.status, 'email_error', o.last_error) as item
    from private.content_notifications n
    left join private.content_notification_receipts r on r.notification_id = n.id
    left join private.content_notification_email_outbox o on o.notification_id = n.id
    where n.recipient_user_id = auth.uid() and (p_before_id is null or n.id < p_before_id)
      and (not coalesce(p_unread_only, false) or r.notification_id is null)
    order by n.id desc limit v_limit
  ) page;
  return v_result;
end;
$$;

create function private.mark_content_notifications_read(p_ids bigint[] default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_count bigint;
begin
  if not private.is_content_notification_owner() then
    raise exception using errcode = '42501', message = 'This inbox belongs exclusively to its configured owner';
  end if;
  insert into private.content_notification_receipts(notification_id, recipient_user_id)
    select id, auth.uid() from private.content_notifications
    where recipient_user_id = auth.uid() and (p_ids is null or id = any(p_ids))
    on conflict (notification_id) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

-- The service worker receives the one trusted recipient from Auth. A row lease
-- plus a stable provider idempotency key prevents concurrent/double delivery.
create function private.claim_content_notification_emails(p_limit integer default 20)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb; v_limit integer := least(greatest(coalesce(p_limit, 20), 1), 50);
begin
  with candidates as (
    select o.notification_id from private.content_notification_email_outbox o
      join private.content_notifications n on n.id = o.notification_id
      join private.content_notification_config c on c.singleton and c.recipient_user_id = n.recipient_user_id
      join auth.users u on u.id = c.recipient_user_id
    where c.email_enabled and c.email_configured and nullif(btrim(u.email), '') is not null
      and o.attempts < 8 and o.available_at <= now()
      and (o.status in ('pending', 'failed') or (o.status = 'sending' and o.claimed_at < now() - interval '10 minutes'))
    order by o.notification_id limit v_limit for update of o skip locked
  ), claimed as (
    update private.content_notification_email_outbox o set status = 'sending',
      attempts = attempts + 1, claimed_at = now(), claim_token = gen_random_uuid()
    from candidates c where o.notification_id = c.notification_id
    returning o.*
  )
  select coalesce(jsonb_agg(to_jsonb(n) - 'recipient_user_id' || jsonb_build_object(
    'claim_token', o.claim_token, 'recipient_email', u.email,
    'idempotency_key', 'acrux-content-notification-' || n.id::text, 'attempts', o.attempts)
    order by n.id), '[]'::jsonb) into v_result
  from claimed o join private.content_notifications n on n.id = o.notification_id
    join auth.users u on u.id = n.recipient_user_id;
  return v_result;
end;
$$;

create function private.finish_content_notification_email(p_notification_id bigint,
  p_claim_token uuid, p_provider_id text default null, p_error text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_count bigint; v_error text;
begin
  if p_error is not null then
    v_error := case when p_error in ('provider_unavailable', 'provider_rejected', 'configuration_missing', 'delivery_failed')
      then p_error else 'delivery_failed' end;
  end if;
  update private.content_notification_email_outbox set
    status = case when v_error is null then 'sent' else 'failed' end,
    provider_id = case when v_error is null then left(p_provider_id, 200) else provider_id end,
    last_error = v_error, claim_token = null, claimed_at = null,
    available_at = now() + least(interval '6 hours', interval '1 minute' * power(2, least(attempts, 8)))
  where notification_id = p_notification_id and status = 'sending' and claim_token = p_claim_token;
  get diagnostics v_count = row_count;
  return v_count = 1;
end;
$$;

-- Public API wrappers remain invokers; their narrow private implementations
-- enforce the configured UUID and expose neither a table nor a recipient setter.
create function public.content_notification_status()
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.content_notification_status();
$$;
create function public.list_content_notifications(p_limit integer default 30,
  p_before_id bigint default null, p_unread_only boolean default false)
returns jsonb language sql stable security invoker set search_path = '' as $$
  select private.list_content_notifications(p_limit, p_before_id, p_unread_only);
$$;
create function public.mark_content_notifications_read(p_ids bigint[] default null)
returns bigint language sql security invoker set search_path = '' as $$
  select private.mark_content_notifications_read(p_ids);
$$;
create function public.claim_content_notification_emails(p_limit integer default 20)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.claim_content_notification_emails(p_limit);
$$;
create function public.finish_content_notification_email(p_notification_id bigint,
  p_claim_token uuid, p_provider_id text default null, p_error text default null)
returns boolean language sql security invoker set search_path = '' as $$
  select private.finish_content_notification_email(p_notification_id, p_claim_token, p_provider_id, p_error);
$$;

revoke all on function private.content_entity_snapshot(text, text), private.stage_content_change(text, text),
  private.capture_content_change(), private.content_notification_excerpt(jsonb), private.finalize_content_change(),
  private.is_content_notification_owner(), private.content_notification_status(),
  private.list_content_notifications(integer, bigint, boolean), private.mark_content_notifications_read(bigint[]),
  private.claim_content_notification_emails(integer), private.finish_content_notification_email(bigint, uuid, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.content_notification_status(), public.list_content_notifications(integer, bigint, boolean),
  public.mark_content_notifications_read(bigint[]), public.claim_content_notification_emails(integer),
  public.finish_content_notification_email(bigint, uuid, text, text) from public, anon, authenticated, service_role;
grant execute on function public.content_notification_status(), public.list_content_notifications(integer, bigint, boolean),
  public.mark_content_notifications_read(bigint[]), private.content_notification_status(),
  private.list_content_notifications(integer, bigint, boolean), private.mark_content_notifications_read(bigint[]) to authenticated;
grant usage on schema private to service_role;
grant execute on function public.claim_content_notification_emails(integer),
  public.finish_content_notification_email(bigint, uuid, text, text),
  private.claim_content_notification_emails(integer), private.finish_content_notification_email(bigint, uuid, text, text) to service_role;
notify pgrst, 'reload schema';
