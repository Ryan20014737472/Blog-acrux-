-- Run only against a disposable database with all repository migrations applied:
-- psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/content-notifications.test.sql
-- Fixtures, captured notifications, acknowledgements and config all roll back.
begin;
create function pg_temp.assert(p_condition boolean, p_message text) returns void
language plpgsql as $$ begin if p_condition is not true then raise exception '%', p_message; end if; end $$;
insert into auth.users(id, email) values
 ('90000000-0000-0000-0000-000000000001', 'owner@example.invalid'),
 ('90000000-0000-0000-0000-000000000002', 'admin@example.invalid'),
 ('90000000-0000-0000-0000-000000000003', 'editor@example.invalid'),
 ('90000000-0000-0000-0000-000000000004', 'visitor@example.invalid');
update public.profiles set role = 'admin', display_name = 'Owner' where id = '90000000-0000-0000-0000-000000000001';
update public.profiles set role = 'admin', display_name = 'Other administrator' where id = '90000000-0000-0000-0000-000000000002';
update public.profiles set role = 'editor', display_name = 'Editor verified name' where id = '90000000-0000-0000-0000-000000000003';
set constraints all immediate;
set constraints all deferred;
insert into private.content_notification_config(recipient_user_id, email_enabled, email_configured)
values ('90000000-0000-0000-0000-000000000001', true, true);
insert into public.categories(id, name, slug) values
 ('91000000-0000-0000-0000-000000000001', 'Robotics category', 'notification-robotics'),
 ('91000000-0000-0000-0000-000000000002', 'Team category', 'notification-team');
set constraints all immediate;
set constraints all deferred;

-- Real authenticated editor, not a client-provided author/name, gets captured.
set local role authenticated;
set local request.jwt.claim.sub = '90000000-0000-0000-0000-000000000003';
select * from public.save_post(null, null, 'Notification draft', 'notification-draft', 'Excerpt', 'Original body', null, '{}', '{}', 'draft', false, null, array['91000000-0000-0000-0000-000000000001'::uuid]);
reset role;
set constraints all immediate;
select pg_temp.assert((select count(*) = 1 from private.content_notifications where entity_table='posts' and entity_label='Notification draft'), 'Post and category save must produce exactly one notification');
select pg_temp.assert((select actor_id='90000000-0000-0000-0000-000000000003' and actor_name='Editor verified name' and actor_role='editor' and actor_kind='user' and action='create' and after_values->'categories'->0->>'name'='Robotics category' from private.content_notifications where entity_label='Notification draft'), 'Actor identity/category snapshot is incorrect');
set constraints all deferred;

-- Identical saves replace links but make no meaningful change.
set local role authenticated;
do $$ declare p public.posts%rowtype; begin
 select * into p from public.posts where slug='notification-draft';
 perform * from public.save_post(p.id, p.updated_at, p.title, p.slug, p.excerpt, p.body, p.cover_path, p.image_paths, p.tags, p.status, p.is_featured, p.published_at, array['91000000-0000-0000-0000-000000000001'::uuid]);
end $$;
reset role;
set constraints all immediate;
select pg_temp.assert((select count(*)=1 from private.content_notifications where entity_table='posts'), 'No-op category replacement or updated_at produced an alert');
set constraints all deferred;

-- Editing the body and replacing two category links remains a single update.
set local role authenticated;
do $$ declare p public.posts%rowtype; begin
 select * into p from public.posts where slug='notification-draft';
 perform * from public.save_post(p.id, p.updated_at, p.title, p.slug, p.excerpt, 'Changed body', p.cover_path, p.image_paths, p.tags, p.status, p.is_featured, p.published_at, array['91000000-0000-0000-0000-000000000001'::uuid,'91000000-0000-0000-0000-000000000002'::uuid]);
end $$;
reset role;
set constraints all immediate;
select pg_temp.assert((select count(*)=2 from private.content_notifications where entity_table='posts'), 'Body and category edit must produce one additional event');
select pg_temp.assert((select changed_fields=array['body','categories'] and before_values->>'body'='Original body' and after_values->>'body'='Changed body' and jsonb_array_length(after_values->'categories')=2 from private.content_notifications where entity_table='posts' order by id desc limit 1), 'Net before/after changed field comparison failed');
set constraints all deferred;

-- Rejected mutations leave neither content nor audit/outbox side effects.
set local role authenticated;
do $$ declare p public.posts%rowtype; begin
 select * into p from public.posts where slug='notification-draft';
 begin
  perform * from public.save_post(p.id, p.updated_at, 'Rejected notification', p.slug, p.excerpt, 'Rejected body', p.cover_path, p.image_paths, p.tags, p.status, p.is_featured, p.published_at, array['91000000-0000-0000-0000-000000000099'::uuid]);
  raise exception 'Invalid category accepted';
 exception when foreign_key_violation then null; end;
end $$;
reset role;
set constraints all immediate;
select pg_temp.assert((select count(*)=2 from private.content_notifications where entity_table='posts'), 'Rolled back save emitted notification');
select pg_temp.assert(not exists(select 1 from private.content_change_batches), 'Deferred staging retained full content after finalization');
set constraints all deferred;

-- Every CMS section plus relation/media changes has database capture coverage.
set local request.jwt.claim.sub = '90000000-0000-0000-0000-000000000002';
set local role authenticated;
insert into public.seasons(id, slug, label, year) values ('92000000-0000-0000-0000-000000000001','notification-season','Notification season',2026);
insert into public.team_areas(name,display_order) values ('Notification area',88);
insert into public.team_members(id,slug,name,area) values ('92000000-0000-0000-0000-000000000002','notification-member','Notification member','Notification area');
insert into public.projects(id,slug,title,category) values ('92000000-0000-0000-0000-000000000003','notification-project','Notification project','Robot');
insert into public.competitions(id,slug,event_name) values ('92000000-0000-0000-0000-000000000004','notification-competition','Notification competition');
insert into public.robots(id,slug,name) values ('92000000-0000-0000-0000-000000000005','notification-robot','Notification robot');
insert into public.achievements(id,title) values ('92000000-0000-0000-0000-000000000006','Notification achievement');
insert into public.galleries(id,slug,title,cover_path) values ('92000000-0000-0000-0000-000000000007','notification-gallery','Notification gallery','notify/a.jpg');
insert into public.gallery_images(id,gallery_id,storage_path,alt_text,display_order) values
 ('93000000-0000-0000-0000-000000000001','92000000-0000-0000-0000-000000000007','notify/a.jpg','Image A',1),
 ('93000000-0000-0000-0000-000000000002','92000000-0000-0000-0000-000000000007','notify/b.jpg','Image B',2);
insert into public.sponsors(id,name) values ('92000000-0000-0000-0000-000000000008','Notification sponsor');
insert into public.media_assets(id,bucket_id,storage_path) values ('92000000-0000-0000-0000-000000000009','blog','notify/media.jpg');
insert into public.robot_team_members values ('92000000-0000-0000-0000-000000000005','92000000-0000-0000-0000-000000000002');
insert into public.project_team_members values ('92000000-0000-0000-0000-000000000003','92000000-0000-0000-0000-000000000002');
insert into public.competition_team_members values ('92000000-0000-0000-0000-000000000004','92000000-0000-0000-0000-000000000002');
insert into public.about_page(id,headline) values ('sobre','Notification about') on conflict(id) do update set headline=excluded.headline;
update public.profiles set display_name='Changed visitor profile' where id='90000000-0000-0000-0000-000000000004';
reset role;
set constraints all immediate;
select pg_temp.assert((select count(distinct entity_table)=14 from private.content_notifications where recipient_user_id='90000000-0000-0000-0000-000000000001'), 'A CMS entity section lacks trigger coverage');
select pg_temp.assert((select count(*)=1 from private.content_notifications where entity_table='galleries'), 'Gallery images must aggregate into album notification');
select pg_temp.assert((select jsonb_array_length(after_values->'images')=2 from private.content_notifications where entity_table='galleries'), 'Gallery snapshot lost image changes');
select pg_temp.assert((select after_values->'team_members'->0->>'name'='Notification member' from private.content_notifications where entity_table='robots'), 'Membership changes are absent from parent snapshot');
set constraints all deferred;

-- Existing cover repair is reflected in the same committed album update.
set local role authenticated;
delete from public.gallery_images where id='93000000-0000-0000-0000-000000000001';
reset role;
set constraints all immediate;
select pg_temp.assert((select count(*)=2 from private.content_notifications where entity_table='galleries'), 'Deleting image/repairing cover split notifications');
select pg_temp.assert((select changed_fields=array['cover_path','images'] and after_values->>'cover_path'='notify/b.jpg' from private.content_notifications where entity_table='galleries' order by id desc limit 1), 'Automatic cover replacement was not explained');
set constraints all deferred;

-- Long changes past the displayed excerpt still count; original text is not
-- retained after staging, and displayed values explicitly indicate truncation.
set local role authenticated;
update public.posts set body=repeat('x',2500)||'A' where slug='notification-draft';
reset role;
set constraints all immediate;
set constraints all deferred;
set local role authenticated;
update public.posts set body=repeat('x',2500)||'B' where slug='notification-draft';
reset role;
set constraints all immediate;
select pg_temp.assert((select count(*)=4 from private.content_notifications where entity_table='posts'), 'Change beyond excerpt boundary was silently ignored');
select pg_temp.assert((select after_values->>'body' like '%… [trecho]' and length(after_values->>'body')<2050 from private.content_notifications where entity_table='posts' order by id desc limit 1), 'Long text is not bounded/labeled as excerpt');
set constraints all deferred;

-- Unknown/system callers are described honestly without guessing author_id.
set local request.jwt.claim.sub = '';
insert into public.categories(id,name,slug) values ('91000000-0000-0000-0000-000000000003','System category','notification-system');
set constraints all immediate;
select pg_temp.assert((select actor_id is null and actor_kind='system' from private.content_notifications where entity_label='System category'), 'System write was falsely attributed to a user');
set constraints all deferred;

-- Another admin, editor, visitor and anonymous cannot read/change this inbox.
set local role authenticated;
do $$ declare v_user text; v_denied boolean; begin
 foreach v_user in array array['90000000-0000-0000-0000-000000000002','90000000-0000-0000-0000-000000000003','90000000-0000-0000-0000-000000000004'] loop
  perform set_config('request.jwt.claim.sub',v_user,true);
  perform pg_temp.assert((public.content_notification_status()->>'is_owner')::boolean=false, 'Non-owner status exposed ownership');
  v_denied:=false; begin perform public.list_content_notifications(); exception when insufficient_privilege then v_denied:=true; end;
  perform pg_temp.assert(v_denied,'Non-owner read inbox');
  v_denied:=false; begin perform public.mark_content_notifications_read(); exception when insufficient_privilege then v_denied:=true; end;
  perform pg_temp.assert(v_denied,'Non-owner changed receipt');
 end loop;
end $$;
reset role;
select pg_temp.assert(not has_table_privilege('authenticated','private.content_notifications','SELECT'), 'Client has direct audit table read');
select pg_temp.assert(not has_table_privilege('authenticated','private.content_notifications','INSERT'), 'Client can forge an event');
select pg_temp.assert(not has_table_privilege('authenticated','private.content_notifications','UPDATE'), 'Client can rewrite event');
select pg_temp.assert(not has_table_privilege('authenticated','private.content_notification_config','UPDATE'), 'Client can redirect recipient');
select pg_temp.assert(not has_function_privilege('anon','public.content_notification_status()','EXECUTE'), 'Anonymous can call notification API');
select pg_temp.assert(not has_function_privilege('authenticated','public.claim_content_notification_emails(integer)','EXECUTE'), 'Client can claim another email');
select pg_temp.assert(not has_function_privilege('authenticated','private.capture_content_change()','EXECUTE'), 'Client can directly invoke privileged trigger');
select pg_temp.assert((select bool_and(prosecdef and proconfig @> array['search_path=""']) from pg_proc where oid in ('private.capture_content_change()'::regprocedure,'private.finalize_content_change()'::regprocedure,'private.list_content_notifications(integer,bigint,boolean)'::regprocedure)), 'Privileged function search_path is unsafe');

select pg_temp.assert((select bool_and(not prosecdef) from pg_proc where oid in ('public.content_notification_status()'::regprocedure,'public.list_content_notifications(integer,bigint,boolean)'::regprocedure,'public.mark_content_notifications_read(bigint[])'::regprocedure,'public.claim_content_notification_emails(integer)'::regprocedure,'public.finish_content_notification_email(bigint,uuid,text,text)'::regprocedure)), 'Public wrapper bypasses caller privileges');

-- Owner sees only own records; cursor pagination/read receipts are idempotent.
set local role authenticated;
set local request.jwt.claim.sub='90000000-0000-0000-0000-000000000001';
do $$ declare first_page jsonb; next_page jsonb; item_id bigint; read_count bigint; begin
 perform pg_temp.assert((public.content_notification_status()->>'is_owner')::boolean, 'Owner denied status');
 first_page:=public.list_content_notifications(2);
 perform pg_temp.assert(jsonb_array_length(first_page->'items')=2, 'Page limit ignored');
 perform pg_temp.assert(not(first_page->'items'->0 ? 'recipient_user_id'), 'Private routing metadata leaked');
 next_page:=public.list_content_notifications(2,(first_page->>'next_cursor')::bigint);
 perform pg_temp.assert((next_page->'items'->0->>'id')::bigint < (first_page->>'next_cursor')::bigint,'Cursor page duplicates items');
 item_id:=(first_page->'items'->0->>'id')::bigint;
 read_count:=public.mark_content_notifications_read(array[item_id,-1]);
 perform pg_temp.assert(read_count=1,'Read receipt allowed unknown ID');
 perform pg_temp.assert(public.mark_content_notifications_read(array[item_id])=0,'Read receipt not idempotent');
 perform public.mark_content_notifications_read();
 perform pg_temp.assert((public.content_notification_status()->>'unread_count')::bigint=0,'Mark all failed');
 perform pg_temp.assert(jsonb_array_length(public.list_content_notifications(30,null,true)->'items')=0,'Unread filter failed');
end $$;
reset role;

-- Email recipient comes only from private Auth; claiming and acknowledgements
-- are service-only, lease-aware, bounded, and keep errors free of secrets.
set local role service_role;
do $$ declare items jsonb; first_item jsonb; second_item jsonb; begin
 items:=public.claim_content_notification_emails(2);
 perform pg_temp.assert(jsonb_array_length(items)=2,'Worker could not claim configured email');
 first_item:=items->0; second_item:=items->1;
 perform pg_temp.assert(first_item->>'recipient_email'='owner@example.invalid','Email recipient is not trusted owner');
 perform pg_temp.assert(first_item->>'idempotency_key'='acrux-content-notification-'||(first_item->>'id'),'Provider idempotency key is unstable');
 perform pg_temp.assert(not public.finish_content_notification_email((first_item->>'id')::bigint,'00000000-0000-0000-0000-000000000000','bad',null),'Forged lease acknowledged email');
 perform pg_temp.assert(public.finish_content_notification_email((first_item->>'id')::bigint,(first_item->>'claim_token')::uuid,'provider-msg-1',null),'Valid success ack failed');
 perform pg_temp.assert(not public.finish_content_notification_email((first_item->>'id')::bigint,(first_item->>'claim_token')::uuid,'provider-msg-1',null),'Duplicate ack succeeded');
 perform pg_temp.assert(public.finish_content_notification_email((second_item->>'id')::bigint,(second_item->>'claim_token')::uuid,null,'Secret API key should never appear'),'Failure ack failed');
 perform set_config('validation.failed_notification',second_item->>'id',true);
end $$;
reset role;
select pg_temp.assert((select status='failed' and last_error='delivery_failed' and available_at>now() from private.content_notification_email_outbox where notification_id=current_setting('validation.failed_notification')::bigint),'Provider failure has unsafe error/no backoff');
select pg_temp.assert((select count(*)=4 from private.content_notifications where entity_table='posts'),'Delivery failure changed content/audit history');
-- Reclaim expired lease and reject old token while keeping idempotency key.
create temporary table validation_old_claim as select notification_id,claim_token from private.content_notification_email_outbox where status='sending' limit 1;
set local role service_role;
select public.claim_content_notification_emails(2);
reset role;
truncate validation_old_claim;
insert into validation_old_claim select notification_id,claim_token from private.content_notification_email_outbox where status='sending' order by notification_id limit 1;
update private.content_notification_email_outbox set claimed_at=now()-interval '11 minutes' where notification_id in(select notification_id from validation_old_claim);
set local role service_role;
select public.claim_content_notification_emails(1);
reset role;
select pg_temp.assert((select o.claim_token is distinct from c.claim_token from private.content_notification_email_outbox o join validation_old_claim c using(notification_id)),'Expired lease was not reclaimed');
update private.content_notification_config set email_enabled=false;
set local role service_role;
select pg_temp.assert(public.claim_content_notification_emails(20)='[]'::jsonb,'Disabled email still delivered');
reset role;

-- Deletes survive cascade with pre-delete names; rollback suppresses everything.
set constraints all deferred;
set local request.jwt.claim.sub='90000000-0000-0000-0000-000000000002';
set local role authenticated;
delete from public.galleries where id='92000000-0000-0000-0000-000000000007';
reset role;
set constraints all immediate;
select pg_temp.assert((select action='delete' and entity_label='Notification gallery' and before_values->'images'->0->>'alt_text'='Image B' and after_values='{}'::jsonb from private.content_notifications where entity_table='galleries' order by id desc limit 1),'Parent cascade lost deletion identity/snapshot');
select pg_temp.assert(not exists(select 1 from private.content_change_batches),'Finalization staging was not cleaned');
select 'content notification regressions passed' as result;
rollback;
