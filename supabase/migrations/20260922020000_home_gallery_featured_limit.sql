alter table public.galleries
  add column if not exists is_home_featured boolean not null default false;

create or replace function public.enforce_gallery_home_featured_limit()
returns trigger language plpgsql security invoker set search_path = public
as $$
begin
  if new.is_home_featured and not new.is_published then
    raise exception 'Um álbum precisa estar publicado para aparecer na Home';
  end if;
  if new.is_home_featured and (tg_op = 'INSERT' or old.is_home_featured is distinct from new.is_home_featured) then
    perform pg_advisory_xact_lock(20260922, 6);
    if (select count(*) from public.galleries where is_home_featured and id <> new.id) >= 6 then
      raise exception 'A Home já possui seis álbuns em destaque';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists galleries_home_featured_limit on public.galleries;
create trigger galleries_home_featured_limit
before insert or update of is_home_featured, is_published on public.galleries
for each row execute procedure public.enforce_gallery_home_featured_limit();

