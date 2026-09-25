create table public.about_page (
  id text primary key default 'sobre' check (id = 'sobre'),
  headline text not null default '',
  introduction text not null default '',
  institutional_note text not null default '',
  mission text not null default '',
  vision text not null default '',
  values_text text not null default '',
  robocep text not null default '',
  partners_title text not null default '',
  partners_body text not null default '',
  milestones jsonb not null default '[]'::jsonb check (jsonb_typeof(milestones) = 'array' and jsonb_array_length(milestones) <= 12),
  is_published boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger about_page_set_updated_at before update on public.about_page
  for each row execute procedure public.set_updated_at();

alter table public.about_page enable row level security;

revoke all on public.about_page from anon, authenticated;
grant select on public.about_page to anon;
grant select, insert, update on public.about_page to authenticated;

create policy "about page: public published or admins read" on public.about_page
  for select to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "about page: admins create" on public.about_page
  for insert to authenticated
  with check ((select public.is_admin()));

create policy "about page: admins update" on public.about_page
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
