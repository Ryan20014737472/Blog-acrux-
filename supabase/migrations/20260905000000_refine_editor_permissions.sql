-- Refines the initial broad editor policies before any Editor accounts are invited.
-- Admins retain full CRUD; Editors can create and revise only their own drafts,
-- attach categories to those drafts, and add/update image metadata in an album.

begin;

drop policy if exists "posts: published or editor can read" on public.posts;
drop policy if exists "posts: editors manage" on public.posts;
drop policy if exists "categories: editors manage" on public.categories;
drop policy if exists "post categories: editors manage" on public.post_categories;
drop policy if exists "gallery images: editors manage" on public.gallery_images;
drop policy if exists "media assets: editors manage" on public.media_assets;
drop policy if exists "storage: editors can update" on storage.objects;

create policy "posts: public, owner, or admin can read" on public.posts
  for select using (
    (status = 'published' and published_at is not null and published_at <= now())
    or public.is_admin()
    or (public.is_editor() and author_id = auth.uid())
  );

create policy "posts: admins manage" on public.posts
  for all using (public.is_admin()) with check (public.is_admin());

create policy "posts: editors create drafts" on public.posts
  for insert to authenticated with check (
    public.is_editor()
    and author_id = auth.uid()
    and status = 'draft'
    and published_at is null
    and not is_featured
  );

create policy "posts: editors update own drafts" on public.posts
  for update to authenticated
  using (public.is_editor() and author_id = auth.uid() and status = 'draft')
  with check (
    public.is_editor()
    and author_id = auth.uid()
    and status = 'draft'
    and published_at is null
    and not is_featured
  );

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

drop trigger if exists posts_enforce_editor_mutation on public.posts;
create trigger posts_enforce_editor_mutation
  before insert or update on public.posts
  for each row execute procedure public.enforce_editor_post_mutation();

create policy "categories: admins manage" on public.categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "post categories: admins manage" on public.post_categories
  for all using (public.is_admin()) with check (public.is_admin());

create policy "post categories: editors add to own drafts" on public.post_categories
  for insert to authenticated with check (
    public.is_editor() and exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid() and p.status = 'draft'
    )
  );

create policy "post categories: editors remove from own drafts" on public.post_categories
  for delete to authenticated using (
    public.is_editor() and exists (
      select 1 from public.posts p
      where p.id = post_id and p.author_id = auth.uid() and p.status = 'draft'
    )
  );

create policy "gallery images: admins manage" on public.gallery_images
  for all using (public.is_admin()) with check (public.is_admin());

create policy "gallery images: editors add" on public.gallery_images
  for insert to authenticated with check (
    public.is_editor() and exists (
      select 1 from public.galleries g where g.id = gallery_id
    )
  );

create policy "gallery images: editors update" on public.gallery_images
  for update to authenticated
  using (public.is_editor())
  with check (public.is_editor() and exists (
    select 1 from public.galleries g where g.id = gallery_id
  ));

create policy "media assets: admins manage" on public.media_assets
  for all using (public.is_admin()) with check (public.is_admin());

create policy "storage: admins can update" on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars', 'blog', 'robots', 'projects', 'gallery', 'sponsors')
    and public.is_admin()
  ) with check (
    bucket_id in ('avatars', 'blog', 'robots', 'projects', 'gallery', 'sponsors')
    and public.is_admin()
  );

commit;
