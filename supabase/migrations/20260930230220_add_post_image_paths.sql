-- Ordered image paths in the existing blog bucket. Keep cover_path available
-- for older posts and as the cover displayed by listing cards.
alter table public.posts
  add column image_paths text[] not null default '{}'::text[];
