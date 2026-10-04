-- A plain-text opening, managed separately from delivery credentials so the
-- owner can personalize mail before setting up the provider.
alter table private.content_notification_config
  add column mail_opening text not null default '',
  add constraint content_notification_mail_opening_valid check (
    length(mail_opening) <= 500
    and regexp_replace(mail_opening, E'[\n\t]', '', 'g') !~ '[[:cntrl:]]'
  );

create or replace function private.content_notification_mail_settings()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_config private.content_notification_config%rowtype; v_count bigint; v_error text;
begin
  select * into v_config from private.content_notification_config where singleton;
  select count(*) into v_count from private.content_notification_email_outbox o
    join private.content_notifications n on n.id = o.notification_id
    where n.recipient_user_id = v_config.recipient_user_id and o.status <> 'sent';
  select o.last_error into v_error from private.content_notification_email_outbox o
    join private.content_notifications n on n.id = o.notification_id
    where n.recipient_user_id = v_config.recipient_user_id and o.status = 'failed'
    order by n.id desc limit 1;
  return jsonb_build_object('enabled', coalesce(v_config.email_enabled, false),
    'configured', coalesce(v_config.email_configured, false),
    'sender', coalesce(v_config.mail_sender, 'onboarding@resend.dev'),
    'opening', coalesce(v_config.mail_opening, ''),
    'pending_count', v_count, 'last_error', v_error);
end;
$$;

create or replace function private.content_notification_mail_credentials()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('api_key',
    (select decrypted_secret from vault.decrypted_secrets where name = 'acrux_content_notification_resend_key'),
    'sender', coalesce(c.mail_sender, 'onboarding@resend.dev'),
    'opening', coalesce(c.mail_opening, ''),
    'recipient_email', u.email, 'enabled', coalesce(c.email_enabled, false))
  from (select true as singleton) seed
    left join private.content_notification_config c on c.singleton
    left join auth.users u on u.id = c.recipient_user_id;
$$;

create function private.set_content_notification_mail_opening(p_opening text)
returns jsonb language plpgsql security definer set search_path = '' as $$
begin
  if p_opening is null or length(p_opening) > 500
    or regexp_replace(p_opening, E'[\n\t]', '', 'g') ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'Invalid mail opening';
  end if;
  update private.content_notification_config
    set mail_opening = p_opening, updated_at = now() where singleton;
  if not found then
    raise exception using errcode = '22023', message = 'Notification recipient has not been configured';
  end if;
  return private.content_notification_mail_settings();
end;
$$;

-- The Edge Function checks Auth and pinned ownership before using this RPC.
create function public.set_content_notification_mail_opening(p_opening text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.set_content_notification_mail_opening(p_opening);
$$;
revoke all on function private.set_content_notification_mail_opening(text),
  public.set_content_notification_mail_opening(text) from public, anon, authenticated;
grant execute on function private.set_content_notification_mail_opening(text),
  public.set_content_notification_mail_opening(text) to service_role;
notify pgrst, 'reload schema';
