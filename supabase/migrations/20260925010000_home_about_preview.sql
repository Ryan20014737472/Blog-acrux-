-- The Home introduction is editorially distinct from the full About page.
alter table public.about_page
  add column home_headline text not null default '',
  add column home_introduction text not null default '',
  add column home_history text not null default '',
  add column home_mission text not null default '',
  add column home_values text not null default '',
  add column home_trajectory text not null default '';

