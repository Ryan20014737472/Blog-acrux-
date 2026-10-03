-- Serialize image deletions within an album before choosing a replacement cover.
-- These helpers run with the caller's privileges and retain existing RLS rules.
create or replace function private.lock_gallery_before_image_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform 1 from public.galleries where id = old.gallery_id for update;
  return old;
end;
$$;

create or replace function private.repair_gallery_cover_after_image_delete()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if old.storage_bucket = 'gallery' then
    update public.galleries
    set cover_path = (
      select image.storage_path
      from public.gallery_images as image
      where image.gallery_id = old.gallery_id
        and image.storage_bucket = 'gallery'
      order by image.display_order, image.created_at, image.id
      limit 1
    )
    where id = old.gallery_id and cover_path = old.storage_path;
  end if;
  return old;
end;
$$;

revoke all on function private.lock_gallery_before_image_delete() from public, anon, authenticated;
revoke all on function private.repair_gallery_cover_after_image_delete() from public, anon, authenticated;

create trigger gallery_images_lock_album_before_delete
before delete on public.gallery_images
for each row execute function private.lock_gallery_before_image_delete();

create trigger gallery_images_repair_cover_after_delete
after delete on public.gallery_images
for each row execute function private.repair_gallery_cover_after_image_delete();
