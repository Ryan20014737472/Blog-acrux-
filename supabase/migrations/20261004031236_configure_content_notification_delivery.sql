-- Deliver the private outbox asynchronously. Mail failures never affect a CMS
-- transaction. Provider credentials and the scheduler token stay in Vault.
create extension if not exists pg_cron version '1.6.4';
create extension if not exists pg_net with schema extensions version '0.20.4';

alter table private.content_notification_config
  add column mail_sender text not null default 'onboarding@resend.dev';

do $$ begin
  if not exists (select 1 from vault.secrets where name = 'acrux_content_notification_dispatch_token') then
    perform vault.create_secret(gen_random_uuid()::text || gen_random_uuid()::text,
      'acrux_content_notification_dispatch_token', 'Internal ACRUX notification scheduler authentication');
  end if;
end; $$;

create function private.content_notification_mail_settings()
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
    'pending_count', v_count, 'last_error', v_error);
end;
$$;

create function private.configure_content_notification_mail(p_api_key text, p_sender text, p_enabled boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_secret_id uuid; v_config private.content_notification_config%rowtype; v_configured boolean;
begin
  select * into v_config from private.content_notification_config where singleton for update;
  if not found then
    raise exception using errcode = '22023', message = 'Notification recipient has not been configured';
  end if;
  if p_sender is null or length(p_sender) > 254 or p_sender !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' then
    raise exception using errcode = '22023', message = 'Invalid sender';
  end if;
  if p_api_key is not null and p_api_key !~ '^re_[A-Za-z0-9_-]{8,253}$' then
    raise exception using errcode = '22023', message = 'Invalid provider credential';
  end if;
  select id into v_secret_id from vault.secrets where name = 'acrux_content_notification_resend_key';
  if p_api_key is not null then
    if v_secret_id is null then
      perform vault.create_secret(p_api_key, 'acrux_content_notification_resend_key', 'ACRUX private notification email provider');
    else
      perform vault.update_secret(v_secret_id, p_api_key);
    end if;
  end if;
  v_configured := p_api_key is not null or v_secret_id is not null;
  if coalesce(p_enabled, false) and not v_configured then
    raise exception using errcode = '22023', message = 'Provider credential required before enabling email';
  end if;
  update private.content_notification_config set email_configured = v_configured,
    email_enabled = coalesce(p_enabled, false), mail_sender = lower(p_sender), updated_at = now()
    where singleton;
  if coalesce(p_enabled, false) then
    update private.content_notification_email_outbox o set status = 'pending',
      available_at = now(), attempts = case when p_api_key is not null then 0 else attempts end,
      last_error = case when p_api_key is not null then null else last_error end
      from private.content_notifications n
      where n.id = o.notification_id and n.recipient_user_id = v_config.recipient_user_id
        and o.status in ('disabled', 'failed');
  else
    update private.content_notification_email_outbox o set status = 'disabled'
      from private.content_notifications n
      where n.id = o.notification_id and n.recipient_user_id = v_config.recipient_user_id
        and o.status in ('pending', 'failed');
  end if;
  return private.content_notification_mail_settings();
end;
$$;

create function private.content_notification_mail_credentials()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('api_key',
    (select decrypted_secret from vault.decrypted_secrets where name = 'acrux_content_notification_resend_key'),
    'sender', coalesce(c.mail_sender, 'onboarding@resend.dev'),
    'recipient_email', u.email, 'enabled', coalesce(c.email_enabled, false))
  from (select true as singleton) seed
    left join private.content_notification_config c on c.singleton
    left join auth.users u on u.id = c.recipient_user_id;
$$;

create function private.verify_content_notification_dispatch_token(p_token text)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_token is not null and length(p_token) between 32 and 128 and exists (
    select 1 from vault.decrypted_secrets
    where name = 'acrux_content_notification_dispatch_token' and decrypted_secret = p_token
  );
$$;

-- Public invoker wrappers are available only to the service-role worker.
create function public.get_content_notification_mail_settings()
returns jsonb language sql security invoker set search_path = '' as $$
  select private.content_notification_mail_settings();
$$;
create function public.configure_content_notification_mail(p_api_key text, p_sender text, p_enabled boolean)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.configure_content_notification_mail(p_api_key, p_sender, p_enabled);
$$;
create function public.get_content_notification_mail_credentials()
returns jsonb language sql security invoker set search_path = '' as $$
  select private.content_notification_mail_credentials();
$$;
create function public.verify_content_notification_dispatch_token(p_token text)
returns boolean language sql security invoker set search_path = '' as $$
  select private.verify_content_notification_dispatch_token(p_token);
$$;

create function private.dispatch_content_notification_emails()
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_token text; v_request_id bigint;
begin
  if not exists (
    select 1 from private.content_notification_email_outbox o
      join private.content_notifications n on n.id = o.notification_id
      join private.content_notification_config c on c.singleton and c.recipient_user_id = n.recipient_user_id
    where c.email_enabled and c.email_configured and o.attempts < 8 and o.available_at <= now()
      and (o.status in ('pending', 'failed') or (o.status = 'sending' and o.claimed_at < now() - interval '10 minutes'))
  ) then return null; end if;
  select decrypted_secret into v_token from vault.decrypted_secrets
    where name = 'acrux_content_notification_dispatch_token';
  if v_token is null then return null; end if;
  select net.http_post(
    url := 'https://gxzpaocmgllycssxlena.supabase.co/functions/v1/content-notification-mail',
    body := jsonb_build_object('action', 'dispatch'),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-acrux-notification-token', v_token),
    timeout_milliseconds := 60000) into v_request_id;
  return v_request_id;
end;
$$;

revoke all on function private.content_notification_mail_settings(),
  private.configure_content_notification_mail(text,text,boolean),
  private.content_notification_mail_credentials(), private.verify_content_notification_dispatch_token(text),
  private.dispatch_content_notification_emails(), public.get_content_notification_mail_settings(),
  public.configure_content_notification_mail(text,text,boolean), public.get_content_notification_mail_credentials(),
  public.verify_content_notification_dispatch_token(text) from public, anon, authenticated, service_role;
grant usage on schema private to service_role;
grant execute on function private.content_notification_mail_settings(),
  private.configure_content_notification_mail(text,text,boolean), private.content_notification_mail_credentials(),
  private.verify_content_notification_dispatch_token(text), public.get_content_notification_mail_settings(),
  public.configure_content_notification_mail(text,text,boolean), public.get_content_notification_mail_credentials(),
  public.verify_content_notification_dispatch_token(text) to service_role;

select cron.schedule('acrux-private-content-notifications', '* * * * *',
  'select private.dispatch_content_notification_emails();');
notify pgrst, 'reload schema';
