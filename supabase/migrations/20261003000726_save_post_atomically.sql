-- Save the post and its category links in one RPC transaction. Running as the
-- caller preserves the existing RLS policies and editor draft mutation guard.
create function public.save_post(
  p_post_id uuid,
  p_expected_updated_at timestamptz,
  p_title text,
  p_slug text,
  p_excerpt text,
  p_body text,
  p_cover_path text,
  p_image_paths text[],
  p_tags text[],
  p_status public.publication_status,
  p_is_featured boolean,
  p_published_at timestamptz,
  p_category_ids uuid[]
)
returns setof public.posts
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_post public.posts%rowtype;
begin
  if auth.uid() is null or not private.is_editor() then
    raise exception using errcode = '42501', message = 'An editor or administrator session is required';
  end if;

  if coalesce(btrim(p_title), '') = ''
    or coalesce(btrim(p_slug), '') = ''
    or coalesce(btrim(p_excerpt), '') = ''
    or coalesce(btrim(p_body), '') = ''
    or p_status is null
    or p_is_featured is null
    or p_image_paths is null
    or p_tags is null
    or p_category_ids is null then
    raise exception using errcode = '22023', message = 'The post payload is incomplete';
  end if;

  if exists (select 1 from unnest(p_image_paths) as image(path) where coalesce(btrim(path), '') = '')
    or array_position(p_tags, null) is not null
    or array_position(p_category_ids, null) is not null
    or cardinality(p_category_ids) <> (select count(distinct id) from unnest(p_category_ids) as category(id)) then
    raise exception using errcode = '22023', message = 'Image paths and category IDs must be valid; category IDs must be distinct';
  end if;

  if p_post_id is null then
    insert into public.posts (
      author_id, title, slug, excerpt, body, cover_path, image_paths,
      tags, status, is_featured, published_at
    ) values (
      auth.uid(), btrim(p_title), btrim(p_slug), btrim(p_excerpt), btrim(p_body),
      p_cover_path, p_image_paths, p_tags, p_status, p_is_featured, p_published_at
    ) returning * into v_post;
  else
    if p_expected_updated_at is null then
      raise exception using errcode = '22023', message = 'The original update timestamp is required';
    end if;

    -- Serialize concurrent saves before replacing category links. Never hold
    -- this lock across uploads or client requests: all work stays in this RPC.
    select * into v_post from public.posts where id = p_post_id for update;
    if not found then
      raise exception using errcode = '42501', message = 'The post is unavailable for editing';
    end if;
    if v_post.updated_at is distinct from p_expected_updated_at then
      raise exception using errcode = '40001', message = 'The post was changed by another session';
    end if;

    update public.posts set
      title = btrim(p_title),
      slug = btrim(p_slug),
      excerpt = btrim(p_excerpt),
      body = btrim(p_body),
      cover_path = p_cover_path,
      image_paths = p_image_paths,
      tags = p_tags,
      status = p_status,
      is_featured = p_is_featured,
      published_at = p_published_at
    where id = p_post_id
    returning * into v_post;

    if not found then
      raise exception using errcode = '42501', message = 'The post is unavailable for editing';
    end if;
  end if;

  delete from public.post_categories where post_id = v_post.id;
  insert into public.post_categories (post_id, category_id)
    select v_post.id, id from unnest(p_category_ids) as category(id);

  -- Constraint/RLS errors propagate to PostgREST, rolling back both the post
  -- mutation and the replacement of its links. No partial save can succeed.
  return next v_post;
end;
$$;

revoke all on function public.save_post(uuid, timestamptz, text, text, text, text, text, text[], text[], public.publication_status, boolean, timestamptz, uuid[]) from public, anon, authenticated;
grant execute on function public.save_post(uuid, timestamptz, text, text, text, text, text, text[], text[], public.publication_status, boolean, timestamptz, uuid[]) to authenticated;

notify pgrst, 'reload schema';
