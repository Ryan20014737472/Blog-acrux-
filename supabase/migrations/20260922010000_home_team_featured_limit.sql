alter table public.team_members
  add column if not exists is_home_featured boolean not null default false;

create or replace function public.enforce_team_home_featured_limit()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.is_home_featured and not new.is_published then
    raise exception 'Um integrante precisa estar publicado para aparecer na Home';
  end if;
  if new.is_home_featured and (tg_op = 'INSERT' or old.is_home_featured is distinct from new.is_home_featured) then
    if (select count(*) from public.team_members where is_home_featured and id <> new.id) >= 3 then
      raise exception 'A Home já possui três integrantes em destaque';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists team_members_home_featured_limit on public.team_members;
create trigger team_members_home_featured_limit
before insert or update of is_home_featured, is_published on public.team_members
for each row execute procedure public.enforce_team_home_featured_limit();

