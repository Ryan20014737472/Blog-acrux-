-- Regression checks for gallery cover repair against a disposable Supabase/local DB.
-- Apply every repository migration first, then run:
--   psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/gallery-cover.test.sql
-- TEST_DATABASE_URL must point to a local test database, never production.
-- Fixtures and mutations are rolled back; no pgTAP extension is required.

begin;
insert into auth.users (id) values
  ('10000000-0000-0000-0000-000000000001'),
  ('10000000-0000-0000-0000-000000000002'),
  ('10000000-0000-0000-0000-000000000003');
update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000001';
update public.profiles set role = 'editor' where id = '10000000-0000-0000-0000-000000000002';

create function pg_temp.check_case(ok boolean, case_name text) returns void
language plpgsql as $$
begin
  if ok is distinct from true then raise exception 'FAILED: %', case_name; end if;
  raise notice 'PASS: %', case_name;
end;
$$;

select pg_temp.check_case(count(*) = 2 and bool_and(not prosecdef and proconfig @> array['search_path=""']), 'helpers are SECURITY INVOKER and have empty search_path')
from pg_proc where oid in ('private.lock_gallery_before_image_delete()'::regprocedure, 'private.repair_gallery_cover_after_image_delete()'::regprocedure);
select pg_temp.check_case(not has_function_privilege('authenticated','private.lock_gallery_before_image_delete()','EXECUTE') and not has_function_privilege('anon','private.repair_gallery_cover_after_image_delete()','EXECUTE'), 'helpers are not directly executable by anon/authenticated');

insert into public.galleries (slug,title,cover_path,is_published) values
 ('gallery-cover-check-first','fixture first','gallery-cover-check-first/first.jpg',true),
 ('gallery-cover-check-last','fixture last','gallery-cover-check-last/last.jpg',true),
 ('gallery-cover-check-single','fixture single','gallery-cover-check-single/only.jpg',true),
 ('gallery-cover-check-editor','fixture editor','gallery-cover-check-editor/cover.jpg',true),
 ('gallery-cover-check-cascade','fixture cascade','gallery-cover-check-cascade/cover.jpg',true),
 ('gallery-cover-check-ties','fixture ties','gallery-cover-check-ties/cover.jpg',true),
 ('gallery-cover-check-bucket','fixture bucket','gallery-cover-check-bucket/shared.jpg',true);

insert into public.gallery_images (gallery_id,storage_bucket,storage_path,alt_text,display_order,created_at)
select g.id,v.bucket,g.slug || '/' || v.filename,'fixture',v.position,'2026-09-01'::timestamptz
from public.galleries g
join (values
 ('gallery-cover-check-first','gallery','first.jpg',0),
 ('gallery-cover-check-first','gallery','second.jpg',1),
 ('gallery-cover-check-first','gallery','third.jpg',2),
 ('gallery-cover-check-first','blog','excluded.jpg',-5),
 ('gallery-cover-check-last','gallery','first.jpg',0),
 ('gallery-cover-check-last','gallery','middle.jpg',1),
 ('gallery-cover-check-last','gallery','last.jpg',2),
 ('gallery-cover-check-single','gallery','only.jpg',0),
 ('gallery-cover-check-single','blog','excluded.jpg',-1),
 ('gallery-cover-check-editor','gallery','cover.jpg',0),
 ('gallery-cover-check-editor','gallery','next.jpg',1),
 ('gallery-cover-check-cascade','gallery','cover.jpg',0),
 ('gallery-cover-check-cascade','gallery','next.jpg',1),
 ('gallery-cover-check-bucket','gallery','shared.jpg',0),
 ('gallery-cover-check-bucket','blog','shared.jpg',0)
) as v(slug,bucket,filename,position) on g.slug=v.slug;

insert into public.gallery_images (id,gallery_id,storage_path,alt_text,display_order,created_at)
select v.id::uuid,g.id,g.slug || '/' || v.filename,'fixture',v.position,v.ts::timestamptz
from public.galleries g
join (values
 ('f0a00000-0000-0000-0000-000000000001','cover.jpg',0,'2026-09-01'),
 ('f0a00000-0000-0000-0000-000000000002','id-first.jpg',1,'2026-09-01'),
 ('f0a00000-0000-0000-0000-000000000003','id-second.jpg',1,'2026-09-01'),
 ('f0a00000-0000-0000-0000-000000000004','created-later.jpg',1,'2026-09-02'),
 ('f0a00000-0000-0000-0000-000000000005','order-later.jpg',2,'2026-08-01')
) as v(id,filename,position,ts) on g.slug='gallery-cover-check-ties';

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
set local role authenticated;
select pg_temp.check_case(private.is_admin(),'fixture authenticated admin recognized');

delete from public.gallery_images where storage_path='gallery-cover-check-first/first.jpg';
select pg_temp.check_case(cover_path='gallery-cover-check-first/second.jpg','delete first cover selects next gallery image, excludes other buckets') from public.galleries where slug='gallery-cover-check-first';

delete from public.gallery_images where storage_path='gallery-cover-check-last/middle.jpg';
select pg_temp.check_case(cover_path='gallery-cover-check-last/last.jpg','delete non-cover leaves current cover unchanged') from public.galleries where slug='gallery-cover-check-last';
delete from public.gallery_images where storage_path='gallery-cover-check-last/last.jpg';
select pg_temp.check_case(cover_path='gallery-cover-check-last/first.jpg','delete last-position cover selects first remaining image') from public.galleries where slug='gallery-cover-check-last';

delete from public.gallery_images where storage_path='gallery-cover-check-single/only.jpg';
select pg_temp.check_case(cover_path is null,'delete sole gallery image clears cover even when another bucket has an image') from public.galleries where slug='gallery-cover-check-single';

delete from public.gallery_images where storage_path='gallery-cover-check-ties/cover.jpg';
select pg_temp.check_case(cover_path='gallery-cover-check-ties/id-first.jpg','replacement ordering uses display_order, created_at, then id') from public.galleries where slug='gallery-cover-check-ties';

delete from public.gallery_images where storage_path='gallery-cover-check-bucket/shared.jpg' and storage_bucket='blog';
select pg_temp.check_case(cover_path='gallery-cover-check-bucket/shared.jpg','delete image in non-gallery bucket with matching path leaves cover unchanged') from public.galleries where slug='gallery-cover-check-bucket';

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
select pg_temp.check_case(private.is_editor() and not private.is_admin(),'fixture authenticated editor recognized');
with removed as (delete from public.gallery_images where storage_path='gallery-cover-check-editor/cover.jpg' returning id)
select pg_temp.check_case(count(*)=0,'editor unauthorized image delete affects zero rows') from removed;
with removed as (delete from public.galleries where slug='gallery-cover-check-editor' returning id)
select pg_temp.check_case(count(*)=0,'editor unauthorized album delete affects zero rows and cannot cascade') from removed;
select pg_temp.check_case(cover_path='gallery-cover-check-editor/cover.jpg' and (select count(*) from public.gallery_images i where i.gallery_id=g.id)=2,'editor rejected deletions preserve cover and images') from public.galleries g where slug='gallery-cover-check-editor';

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000003';
with removed as (delete from public.gallery_images where storage_path='gallery-cover-check-editor/cover.jpg' returning id)
select pg_temp.check_case(count(*)=0,'visitor unauthorized image delete affects zero rows') from removed;

set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
delete from public.galleries where slug='gallery-cover-check-cascade';
select pg_temp.check_case(not exists(select 1 from public.galleries where slug='gallery-cover-check-cascade') and not exists(select 1 from public.gallery_images where storage_path like 'gallery-cover-check-cascade/%'),'admin album delete cascades through both triggers without error');

delete from public.gallery_images where gallery_id=(select id from public.galleries where slug='gallery-cover-check-first');
select pg_temp.check_case(cover_path is null,'multirow deletion clears cover when all gallery images are removed') from public.galleries where slug='gallery-cover-check-first';

reset role;
rollback;
select count(*) as remaining_test_galleries from public.galleries where slug like 'gallery-cover-check%';
select count(*) as remaining_test_images from public.gallery_images where storage_path like 'gallery-cover-check%';
