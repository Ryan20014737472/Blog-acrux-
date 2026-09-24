create table public.team_areas (
  name text primary key,
  display_order integer not null default 0 check (display_order >= 0),
  created_at timestamptz not null default now(),
  constraint team_areas_name_not_blank check (length(btrim(name)) > 0)
);

alter table public.team_areas enable row level security;

grant select on public.team_areas to anon;
grant select, insert, update, delete on public.team_areas to authenticated;

create policy "team areas: anyone can read" on public.team_areas
  for select to anon, authenticated using (true);

create policy "team areas: admins manage" on public.team_areas
  for all to authenticated using ((select public.is_admin()))
  with check ((select public.is_admin()));

insert into public.team_areas (name, display_order) values
  ('CAD', 1),
  ('Gestão', 2),
  ('Engenharia', 3),
  ('Programação', 4),
  ('Mecânica', 5),
  ('Elétrica', 6),
  ('Marketing', 7),
  ('Impacto STEAM', 8);

insert into public.team_areas (name, display_order)
select area, 100 + row_number() over (order by area)::integer
from (
  select distinct btrim(area) as area
  from public.team_members
  where nullif(btrim(area), '') is not null
) as existing_areas
on conflict (name) do nothing;

