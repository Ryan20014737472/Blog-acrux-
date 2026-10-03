-- Regression checks for public.save_post against a disposable Supabase/local DB.
-- Apply every repository migration first, then run:
--   psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/save-post.test.sql
-- TEST_DATABASE_URL must point to a local test database, never production.
-- All fixtures and mutations are rolled back; no pgTAP extension is required.

begin;
insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003'),
  ('10000000-0000-0000-0000-000000000004');
update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000001';
update public.profiles set role = 'editor' where id in
  ('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000004');
insert into public.categories (id, slug, name) values
  ('20000000-0000-0000-0000-000000000001', 'rpc-test-first', 'RPC test first'),
  ('20000000-0000-0000-0000-000000000002', 'rpc-test-second', 'RPC test second');
create temporary table validation_rpc_policies as select * from pg_policies;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
do $$
declare
  v_post public.posts%rowtype;
  v_before public.posts%rowtype;
  v_denied boolean;
begin
  select * into v_post from public.save_post(null, null, 'Saved title', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000002'::uuid]);
  if v_post.author_id <> auth.uid() or v_post.image_paths <> array['posts/a.jpg', 'posts/b.jpg']
    or v_post.tags <> array['robotica', 'equipe'] or (select count(*) from public.post_categories where post_id=v_post.id) <> 2 then
    raise exception 'RPC creation lost author/images/tags/categories';
  end if;
  select * into v_post from public.save_post(v_post.id, v_post.updated_at, 'Updated title', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000002'::uuid]);
  if v_post.title <> 'Updated title' or (select array_agg(category_id) from public.post_categories where post_id=v_post.id) <> array['20000000-0000-0000-0000-000000000002'::uuid] then
    raise exception 'RPC update/category replacement failed';
  end if;
  perform set_config('validation.rpc_post_id', v_post.id::text, true);
  v_before := v_post;
  begin
    perform * from public.save_post(v_post.id, v_post.updated_at, 'Must rollback', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000099'::uuid]);
    raise exception 'Invalid category accepted';
  exception when foreign_key_violation then null;
  end;
  select * into v_post from public.posts where id=v_before.id;
  if v_post is distinct from v_before or (select array_agg(category_id) from public.post_categories where post_id=v_post.id) <> array['20000000-0000-0000-0000-000000000002'::uuid] then
    raise exception 'Category FK failure did not rollback post AND old links';
  end if;
  begin
    perform * from public.save_post(null, null, 'Saved title', 'rpc-check-failed-create', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000099'::uuid]);
    raise exception 'Invalid new category accepted';
  exception when foreign_key_violation then null;
  end;
  if exists(select 1 from public.posts where slug='rpc-check-failed-create') then
    raise exception 'Failed creation left an orphan post';
  end if;
  begin
    perform * from public.save_post(v_post.id, v_post.updated_at, 'Duplicate categories', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000001'::uuid]);
    raise exception 'Duplicate categories accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform * from public.save_post(null, null, 'Saved title', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid]);
    raise exception 'Duplicate slug accepted';
  exception when unique_violation then null;
  end;
  begin
    perform * from public.save_post(v_post.id, v_post.updated_at - interval '1 second', 'Stale overwrite', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid]);
    raise exception 'Stale update timestamp accepted';
  exception when serialization_failure then null;
  end;
  select * into v_post from public.posts where id=v_before.id;
  if v_post is distinct from v_before or (select array_agg(category_id) from public.post_categories where post_id=v_post.id) <> array['20000000-0000-0000-0000-000000000002'::uuid] then
    raise exception 'Rejected payload/conflict changed persisted data';
  end if;
  v_denied := false;
  begin
    perform * from public.save_post(null, null, 'Saved title', 'rpc-check-editor-publish', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'published', true, now(), array['20000000-0000-0000-0000-000000000001'::uuid]);
  exception when raise_exception or insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'Editor published or featured a new post'; end if;
end;
$$;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000004';
do $$
declare v_post public.posts%rowtype; v_denied boolean := false;
begin
  -- Other editors cannot read the draft, but an arbitrary ID still reaches RPC.
  begin
    perform * from public.save_post(current_setting('validation.rpc_post_id')::uuid, now(), 'Saved title', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid]);
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'Editor changed another editor draft'; end if;
end;
$$;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
do $$
declare v_post public.posts%rowtype;
begin
  select * into v_post from public.posts where slug='rpc-check-editor';
  select * into v_post from public.save_post(v_post.id, v_post.updated_at, 'Saved title', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'published', true, now(), array['20000000-0000-0000-0000-000000000001'::uuid, '20000000-0000-0000-0000-000000000002'::uuid]);
  if v_post.status <> 'published' or not v_post.is_featured or v_post.published_at is null
    or v_post.author_id <> '10000000-0000-0000-0000-000000000002'::uuid then
    raise exception 'Admin publication changed author or lost publication fields';
  end if;
end;
$$;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
do $$
declare v_post public.posts%rowtype; v_denied boolean := false;
begin
  select * into v_post from public.posts where slug='rpc-check-editor';
  begin
    perform * from public.save_post(v_post.id, v_post.updated_at, 'Editor published overwrite', 'rpc-check-editor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'published', true, v_post.published_at, array['20000000-0000-0000-0000-000000000001'::uuid]);
  exception when insufficient_privilege or raise_exception then v_denied := true;
  end;
  if not v_denied then raise exception 'Editor altered a published post'; end if;
end;
$$;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
do $$
declare v_denied boolean := false;
begin
  begin
    perform * from public.save_post(null, null, 'Saved title', 'rpc-check-visitor', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid]);
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'Visitor created a post'; end if;
end;
$$;
set local request.jwt.claim.sub = '';
do $$
declare v_denied boolean := false;
begin
  begin
    perform * from public.save_post(null, null, 'Saved title', 'rpc-check-no-session', 'Saved excerpt', 'Saved body', 'posts/a.jpg', array['posts/a.jpg', 'posts/b.jpg'], array['robotica', 'equipe'], 'draft', false, null, array['20000000-0000-0000-0000-000000000001'::uuid]);
  exception when insufficient_privilege then v_denied := true;
  end;
  if not v_denied then raise exception 'Missing session created a post'; end if;
end;
$$;
reset role;
do $$
begin
  if exists(select 1 from pg_proc where oid='public.save_post(uuid,timestamptz,text,text,text,text,text,text[],text[],public.publication_status,boolean,timestamptz,uuid[])'::regprocedure and prosecdef) then
    raise exception 'RPC unexpectedly bypasses RLS';
  end if;
  if has_function_privilege('anon', 'public.save_post(uuid,timestamptz,text,text,text,text,text,text[],text[],public.publication_status,boolean,timestamptz,uuid[])', 'execute') then
    raise exception 'Anonymous RPC execute granted';
  end if;
  if exists ((select * from pg_policies except select * from pg_temp.validation_rpc_policies)
    union all (select * from pg_temp.validation_rpc_policies except select * from pg_policies)) then
    raise exception 'RPC changed policies';
  end if;
end;
$$;
rollback;
select 'PASS: transactional rollback on invalid category for inserts/updates; distinct IDs; unique slug; stale version; images/tags; editor drafts only; admin publication; visitor/session/anon denied; SECURITY INVOKER and unchanged policies' as validation;
