-- Harden the editor post guard already applied manually to the production project.
-- The trigger needs no elevated database privileges: it only validates NEW/OLD
-- values and the caller's authenticated role through the existing helpers.

create or replace function public.enforce_editor_post_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if not public.is_editor() then
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
