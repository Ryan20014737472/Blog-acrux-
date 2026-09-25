-- Keep privileged helpers available to RLS and triggers, but off the public Data API.
-- ALTER FUNCTION preserves each function's OID, so existing policy and trigger
-- dependencies continue to point at the same function after the schema move.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

alter function public.handle_new_user() set schema private;
alter function public.is_admin() set schema private;
alter function public.is_editor() set schema private;

alter function private.handle_new_user() set search_path = '';
alter function private.is_admin() set search_path = '';
alter function private.is_editor() set search_path = '';

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon, authenticated;
revoke all on function private.is_editor() from public, anon, authenticated;

-- Anonymous readers and signed-in users both evaluate public read policies.
-- The private schema is not exposed through PostgREST, so these grants do not
-- create RPC endpoints for the helpers.
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_editor() to anon, authenticated;

-- PL/pgSQL resolves calls in its source text at execution time, unlike RLS
-- policies' stored function OIDs. Update the editor guard before requests resume.
create or replace function public.enforce_editor_post_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if private.is_admin() then
    return new;
  end if;

  if not private.is_editor() then
    raise exception 'editor role required';
  end if;

  if tg_op = 'INSERT' then
    if new.author_id is distinct from auth.uid()
      or new.status <> 'draft'
      or new.published_at is not null
      or new.is_featured then
      raise exception 'editors can only create their own non-featured drafts';
    end if;
  elsif tg_op = 'UPDATE' then
    if old.author_id is distinct from auth.uid()
      or old.status <> 'draft'
      or new.author_id is distinct from old.author_id
      or new.status is distinct from old.status
      or new.published_at is distinct from old.published_at
      or new.is_featured is distinct from old.is_featured then
      raise exception 'editors cannot publish, feature, or reassign a post';
    end if;
  end if;

  return new;
end;
$$;

