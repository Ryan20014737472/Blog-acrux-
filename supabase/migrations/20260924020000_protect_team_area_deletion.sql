create index team_members_area_index on public.team_members (area) where area is not null;

alter table public.team_members
  add constraint team_members_area_fkey
  foreign key (area) references public.team_areas (name)
  on update restrict on delete restrict;

