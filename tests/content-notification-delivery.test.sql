-- Local-only regression for mail settings/scheduling with inert test doubles.
-- Requires plain PostgreSQL + Vault/cron/net doubles (see docs), and both
-- notification migrations with CREATE EXTENSION lines skipped locally.
-- The guard below refuses a real Supabase/net environment. No real key or HTTP.
begin;
do $$ begin
 if to_regclass('net.notification_test_requests') is null then
  raise exception 'Use the isolated notification delivery test database with inert HTTP/Vault/cron doubles';
 end if;
end $$;
create function pg_temp.assert(p_condition boolean,p_message text) returns void language plpgsql as $$ begin if p_condition is not true then raise exception '%',p_message; end if; end $$;
insert into auth.users(id,email) values
 ('94000000-0000-0000-0000-000000000001','delivery-owner@example.invalid'),
 ('94000000-0000-0000-0000-000000000002','delivery-admin@example.invalid');
update public.profiles set role='admin' where id in ('94000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000002');
set constraints all immediate;
set constraints all deferred;
insert into private.content_notification_config(recipient_user_id) values ('94000000-0000-0000-0000-000000000001');
insert into private.content_notifications(recipient_user_id,occurred_at,entity_table,entity_id,entity_label,action,actor_kind,changed_fields,before_values,after_values)
values
 ('94000000-0000-0000-0000-000000000001',now(),'categories','delivery-a','Delivery disabled','create','system',array['name'],'{}','{"name":"Disabled"}'),
 ('94000000-0000-0000-0000-000000000001',now(),'categories','delivery-b','Delivery failed','create','system',array['name'],'{}','{"name":"Failed"}'),
 ('94000000-0000-0000-0000-000000000001',now(),'categories','delivery-c','Delivery sent','create','system',array['name'],'{}','{"name":"Sent"}'),
 ('94000000-0000-0000-0000-000000000002',now(),'categories','delivery-d','Delivery foreign','create','system',array['name'],'{}','{"name":"Foreign"}');
insert into private.content_notification_email_outbox(notification_id,status,attempts,available_at,last_error,provider_id)
select id,case entity_id when 'delivery-a' then 'disabled' when 'delivery-b' then 'failed' when 'delivery-c' then 'sent' else 'disabled' end,
 case entity_id when 'delivery-b' then 8 else 0 end,now()+interval '1 day',
 case entity_id when 'delivery-b' then 'provider_rejected' else null end,
 case entity_id when 'delivery-c' then 'already-sent' else null end
from private.content_notifications where entity_id in('delivery-a','delivery-b','delivery-c','delivery-d');
select pg_temp.assert(private.dispatch_content_notification_emails() is null,'Unconfigured email dispatched an HTTP request');
select pg_temp.assert(not exists(select 1 from net.notification_test_requests),'Unconfigured dispatch touched HTTP');
select pg_temp.assert((select count(*)=1 from cron.job where jobname='acrux-private-content-notifications' and schedule='* * * * *' and command='select private.dispatch_content_notification_emails();'),'Scheduler job is missing or duplicated');

-- Every mail setting/credential/token RPC is denied even to owner/admin JWTs;
-- the Edge Function authenticates owner and calls these as trusted service only.
select pg_temp.assert(not has_function_privilege('anon','public.configure_content_notification_mail(text,text,boolean)','EXECUTE'),'Anonymous can set mail credentials');
select pg_temp.assert(not has_function_privilege('authenticated','public.configure_content_notification_mail(text,text,boolean)','EXECUTE'),'Authenticated can set mail credentials directly');
select pg_temp.assert(not has_function_privilege('authenticated','public.get_content_notification_mail_credentials()','EXECUTE'),'Authenticated can read provider key');
select pg_temp.assert(not has_function_privilege('authenticated','private.content_notification_mail_credentials()','EXECUTE'),'Authenticated can bypass credentials wrapper');
select pg_temp.assert(not has_function_privilege('authenticated','public.verify_content_notification_dispatch_token(text)','EXECUTE'),'Authenticated can inspect scheduler token');
select pg_temp.assert(not has_function_privilege('service_role','private.dispatch_content_notification_emails()','EXECUTE'),'Service role can directly invoke cron dispatch');
set local role authenticated;
do $$ declare who text;denied boolean;begin
 foreach who in array array['94000000-0000-0000-0000-000000000001','94000000-0000-0000-0000-000000000002'] loop
  perform set_config('request.jwt.claim.sub',who,true);
  denied:=false;begin perform public.get_content_notification_mail_settings();exception when insufficient_privilege then denied:=true;end;
  perform pg_temp.assert(denied,'Owner/other admin accessed service settings directly');
  denied:=false;begin perform public.get_content_notification_mail_credentials();exception when insufficient_privilege then denied:=true;end;
  perform pg_temp.assert(denied,'Owner/other admin accessed provider secret directly');
  denied:=false;begin perform public.verify_content_notification_dispatch_token('fake-token');exception when insufficient_privilege then denied:=true;end;
  perform pg_temp.assert(denied,'Owner/other admin accessed dispatch validation directly');
 end loop;
end $$;
reset role;

set local role service_role;
do $$ declare denied boolean;settings jsonb;credentials jsonb;begin
 settings:=public.get_content_notification_mail_settings();
 perform pg_temp.assert(not(settings ? 'api_key') and not(settings ? 'recipient_email'),'Settings leaked secret/recipient');
 denied:=false;begin perform public.configure_content_notification_mail(null,'onboarding@resend.dev',true);exception when invalid_parameter_value then denied:=true;end;
 perform pg_temp.assert(denied,'Mail enabled without provider credential');
 denied:=false;begin perform public.configure_content_notification_mail('re_notification_test_only0001','invalid sender',true);exception when invalid_parameter_value then denied:=true;end;
 perform pg_temp.assert(denied,'Invalid sender accepted');
 denied:=false;begin perform public.configure_content_notification_mail('not-a-provider-key','onboarding@resend.dev',true);exception when invalid_parameter_value then denied:=true;end;
 perform pg_temp.assert(denied,'Invalid credential accepted');
 perform pg_temp.assert((public.get_content_notification_mail_settings()->>'configured')::boolean=false,'Invalid config partially committed');
 settings:=public.configure_content_notification_mail('re_notification_test_only0001','onboarding@resend.dev',true);
 perform pg_temp.assert((settings->>'configured')::boolean and (settings->>'enabled')::boolean,'Valid config not enabled');
 perform pg_temp.assert(not(settings ? 'api_key'),'Saving exposed the key');
 credentials:=public.get_content_notification_mail_credentials();
 perform pg_temp.assert(credentials->>'recipient_email'='delivery-owner@example.invalid','Credentials selected wrong recipient');
 perform pg_temp.assert(credentials->>'api_key'='re_notification_test_only0001','Vault test credential unavailable to service worker');
 perform pg_temp.assert(public.verify_content_notification_dispatch_token('wrong-token')=false,'Wrong dispatch token authorized');
end $$;
reset role;
select pg_temp.assert((select bool_and(o.status='pending' and o.attempts=0 and o.last_error is null and o.available_at<=now()) from private.content_notification_email_outbox o join private.content_notifications n on n.id=o.notification_id where n.entity_id in('delivery-a','delivery-b')),'Configuration did not reactivate/reset owner backlog');
select pg_temp.assert((select o.status='sent' and o.provider_id='already-sent' from private.content_notification_email_outbox o join private.content_notifications n on n.id=o.notification_id where n.entity_id='delivery-c'),'Configuration reset sent delivery');
select pg_temp.assert((select o.status='disabled' from private.content_notification_email_outbox o join private.content_notifications n on n.id=o.notification_id where n.entity_id='delivery-d'),'Configuration redirected another recipient backlog');
do $$ declare token text;begin
 select decrypted_secret into token from vault.decrypted_secrets where name='acrux_content_notification_dispatch_token';
 perform pg_temp.assert(public.verify_content_notification_dispatch_token(token),'Synthetic Vault dispatch token rejected');
end $$;
select pg_temp.assert(private.dispatch_content_notification_emails() is not null,'Ready queue did not schedule inert HTTP request');
select pg_temp.assert((select count(*)=1 from net.notification_test_requests),'Dispatch generated duplicate HTTP requests');
select pg_temp.assert((select url='https://gxzpaocmgllycssxlena.supabase.co/functions/v1/content-notification-mail' and body='{"action":"dispatch"}'::jsonb and timeout_milliseconds=60000 and headers->>'Content-Type'='application/json' and headers->>'x-acrux-notification-token'=(select decrypted_secret from vault.decrypted_secrets where name='acrux_content_notification_dispatch_token') and not(headers ? 'Authorization') from net.notification_test_requests),'Dispatch target/auth/body is incorrect or exposes service key');

-- Pausing stops new dispatch without altering already-sent notifications.
set local role service_role;
select public.configure_content_notification_mail(null,'onboarding@resend.dev',false);
select pg_temp.assert(public.claim_content_notification_emails(20)='[]'::jsonb,'Paused mail still claimed new messages');
reset role;
select pg_temp.assert(private.dispatch_content_notification_emails() is null,'Paused mail dispatched new request');
select pg_temp.assert((select count(*)=1 from net.notification_test_requests),'Pause generated HTTP');
select pg_temp.assert((select bool_and(o.status='disabled') from private.content_notification_email_outbox o join private.content_notifications n on n.id=o.notification_id where n.entity_id in('delivery-a','delivery-b')),'Pause did not disable owner pending queue');
select pg_temp.assert((select o.status='sent' from private.content_notification_email_outbox o join private.content_notifications n on n.id=o.notification_id where n.entity_id='delivery-c'),'Pause changed sent state');
select pg_temp.assert((select count(*)=1 from vault.secrets where name='acrux_content_notification_resend_key'),'Key was stored multiple times');
select 'notification delivery SQL regressions passed (inert doubles)' as result;
rollback;
