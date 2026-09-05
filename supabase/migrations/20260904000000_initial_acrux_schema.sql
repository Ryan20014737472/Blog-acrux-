-- ACRUX ROBOCEP — initial public site and CMS schema.
-- Apply this migration in a new Supabase project before connecting the app.

create extension if not exists "pgcrypto";

create type public.app_role as enum ('admin', 'editor', 'visitor');
create type public.publication_status as enum ('draft', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_path text,
  role public.app_role not null default 'visitor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  year integer not null check (year between 2000 and 2100),
  summary text,
  is_current boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index seasons_only_one_current_idx on public.seasons (is_current) where is_current;

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  slug text not null unique,
  name text not null,
  area text,
  role_title text,
  short_bio text,
  photo_path text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  slug text not null unique,
  title text not null,
  category text not null,
  description text,
  cover_path text,
  body text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.competitions (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  slug text not null unique,
  organization text,
  event_name text not null,
  starts_at timestamptz,
  ends_at timestamptz,
  location text,
  result text,
  awards jsonb not null default '[]'::jsonb,
  report text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table public.robots (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  slug text not null unique,
  name text not null,
  description text,
  mechanisms jsonb not null default '[]'::jsonb,
  components jsonb not null default '[]'::jsonb,
  specifications jsonb not null default '{}'::jsonb,
  cover_path text,
  cad_embed_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  competition_id uuid references public.competitions (id) on delete set null,
  title text not null,
  achieved_on date,
  placement text,
  description text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  competition_id uuid references public.competitions (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  slug text not null unique,
  title text not null,
  category text,
  description text,
  cover_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  storage_bucket text not null default 'gallery',
  storage_path text not null,
  alt_text text not null,
  caption text,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references public.seasons (id) on delete set null,
  author_id uuid references public.profiles (id) on delete set null,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  cover_path text,
  tags text[] not null default '{}',
  status public.publication_status not null default 'draft',
  is_featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'published' and published_at is not null) or status <> 'published')
);

create table public.post_categories (
  post_id uuid not null references public.posts (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (post_id, category_id)
);

create table public.sponsors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  logo_path text,
  tier text,
  display_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null,
  storage_path text not null,
  alt_text text,
  caption text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket_id, storage_path)
);

-- Many-to-many relations avoid copying member names into historical records.
create table public.robot_team_members (
  robot_id uuid not null references public.robots (id) on delete cascade,
  team_member_id uuid not null references public.team_members (id) on delete cascade,
  primary key (robot_id, team_member_id)
);

create table public.project_team_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  team_member_id uuid not null references public.team_members (id) on delete cascade,
  primary key (project_id, team_member_id)
);

create table public.competition_team_members (
  competition_id uuid not null references public.competitions (id) on delete cascade,
  team_member_id uuid not null references public.team_members (id) on delete cascade,
  primary key (competition_id, team_member_id)
);

create index posts_public_index on public.posts (status, published_at desc);
create index galleries_public_index on public.galleries (is_published, created_at desc);
create index team_members_public_index on public.team_members (is_published, display_order);
create index robots_public_index on public.robots (is_published, season_id);
create index projects_public_index on public.projects (is_published, season_id);
create index competitions_public_index on public.competitions (is_published, starts_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name'))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create trigger profiles_set_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
create trigger seasons_set_updated_at before update on public.seasons for each row execute procedure public.set_updated_at();
create trigger team_members_set_updated_at before update on public.team_members for each row execute procedure public.set_updated_at();
create trigger projects_set_updated_at before update on public.projects for each row execute procedure public.set_updated_at();
create trigger competitions_set_updated_at before update on public.competitions for each row execute procedure public.set_updated_at();
create trigger robots_set_updated_at before update on public.robots for each row execute procedure public.set_updated_at();
create trigger achievements_set_updated_at before update on public.achievements for each row execute procedure public.set_updated_at();
create trigger galleries_set_updated_at before update on public.galleries for each row execute procedure public.set_updated_at();
create trigger posts_set_updated_at before update on public.posts for each row execute procedure public.set_updated_at();
create trigger sponsors_set_updated_at before update on public.sponsors for each row execute procedure public.set_updated_at();

-- Security helpers used exclusively by RLS policies. Roles are never changed by
-- a client-side form; user provisioning must use a server-side admin workflow.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select coalesce((select p.role in ('admin', 'editor') from public.profiles p where p.id = auth.uid()), false);
$$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_editor() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.team_members enable row level security;
alter table public.categories enable row level security;
alter table public.projects enable row level security;
alter table public.competitions enable row level security;
alter table public.robots enable row level security;
alter table public.achievements enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_images enable row level security;
alter table public.posts enable row level security;
alter table public.post_categories enable row level security;
alter table public.sponsors enable row level security;
alter table public.media_assets enable row level security;
alter table public.robot_team_members enable row level security;
alter table public.project_team_members enable row level security;
alter table public.competition_team_members enable row level security;

create policy "profiles: own record or admin can read" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles: admins can update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

create policy "seasons: published or editor can read" on public.seasons
  for select using (is_published or public.is_editor());
create policy "seasons: admins manage" on public.seasons
  for all using (public.is_admin()) with check (public.is_admin());

create policy "team members: published or editor can read" on public.team_members
  for select using (is_published or public.is_editor());
create policy "team members: admins manage" on public.team_members
  for all using (public.is_admin()) with check (public.is_admin());

create policy "categories: anyone can read" on public.categories for select using (true);
create policy "categories: editors manage" on public.categories
  for all using (public.is_editor()) with check (public.is_editor());

create policy "projects: published or editor can read" on public.projects
  for select using (is_published or public.is_editor());
create policy "projects: admins manage" on public.projects
  for all using (public.is_admin()) with check (public.is_admin());

create policy "competitions: published or editor can read" on public.competitions
  for select using (is_published or public.is_editor());
create policy "competitions: admins manage" on public.competitions
  for all using (public.is_admin()) with check (public.is_admin());

create policy "robots: published or editor can read" on public.robots
  for select using (is_published or public.is_editor());
create policy "robots: admins manage" on public.robots
  for all using (public.is_admin()) with check (public.is_admin());

create policy "achievements: published or editor can read" on public.achievements
  for select using (is_published or public.is_editor());
create policy "achievements: admins manage" on public.achievements
  for all using (public.is_admin()) with check (public.is_admin());

create policy "galleries: published or editor can read" on public.galleries
  for select using (is_published or public.is_editor());
create policy "galleries: admins manage" on public.galleries
  for all using (public.is_admin()) with check (public.is_admin());

create policy "gallery images: public gallery or editor can read" on public.gallery_images
  for select using (
    public.is_editor() or exists (
      select 1 from public.galleries g where g.id = gallery_id and g.is_published
    )
  );
create policy "gallery images: editors manage" on public.gallery_images
  for all using (public.is_editor()) with check (public.is_editor());

create policy "posts: published or editor can read" on public.posts
  for select using (
    public.is_editor() or (status = 'published' and published_at is not null and published_at <= now())
  );
create policy "posts: editors manage" on public.posts
  for all using (public.is_editor()) with check (public.is_editor());

create policy "post categories: public post or editor can read" on public.post_categories
  for select using (
    public.is_editor() or exists (
      select 1 from public.posts p
      where p.id = post_id and p.status = 'published' and p.published_at <= now()
    )
  );
create policy "post categories: editors manage" on public.post_categories
  for all using (public.is_editor()) with check (public.is_editor());

create policy "sponsors: published or editor can read" on public.sponsors
  for select using (is_published or public.is_editor());
create policy "sponsors: admins manage" on public.sponsors
  for all using (public.is_admin()) with check (public.is_admin());

create policy "media assets: editors can read" on public.media_assets
  for select using (public.is_editor());
create policy "media assets: editors manage" on public.media_assets
  for all using (public.is_editor()) with check (public.is_editor());

create policy "robot membership: published robot or editor can read" on public.robot_team_members
  for select using (public.is_editor() or exists (select 1 from public.robots r where r.id = robot_id and r.is_published));
create policy "robot membership: admins manage" on public.robot_team_members
  for all using (public.is_admin()) with check (public.is_admin());

create policy "project membership: published project or editor can read" on public.project_team_members
  for select using (public.is_editor() or exists (select 1 from public.projects p where p.id = project_id and p.is_published));
create policy "project membership: admins manage" on public.project_team_members
  for all using (public.is_admin()) with check (public.is_admin());

create policy "competition membership: published competition or editor can read" on public.competition_team_members
  for select using (public.is_editor() or exists (select 1 from public.competitions c where c.id = competition_id and c.is_published));
create policy "competition membership: admins manage" on public.competition_team_members
  for all using (public.is_admin()) with check (public.is_admin());

-- Buckets are intentionally separated by content type. Keep the source image
-- path in a content row instead of duplicating binary metadata in every table.
insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('blog', 'blog', true),
  ('robots', 'robots', true),
  ('projects', 'projects', true),
  ('gallery', 'gallery', true),
  ('sponsors', 'sponsors', true)
on conflict (id) do nothing;

create policy "storage: public assets can be read" on storage.objects
  for select using (bucket_id in ('avatars', 'blog', 'robots', 'projects', 'gallery', 'sponsors'));
create policy "storage: editors can upload" on storage.objects
  for insert to authenticated with check (
    bucket_id in ('avatars', 'blog', 'robots', 'projects', 'gallery', 'sponsors') and public.is_editor()
  );
create policy "storage: editors can update" on storage.objects
  for update to authenticated using (
    bucket_id in ('avatars', 'blog', 'robots', 'projects', 'gallery', 'sponsors') and public.is_editor()
  ) with check (
    bucket_id in ('avatars', 'blog', 'robots', 'projects', 'gallery', 'sponsors') and public.is_editor()
  );
create policy "storage: admins can delete" on storage.objects
  for delete to authenticated using (
    bucket_id in ('avatars', 'blog', 'robots', 'projects', 'gallery', 'sponsors') and public.is_admin()
  );

