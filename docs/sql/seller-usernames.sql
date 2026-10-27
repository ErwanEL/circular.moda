-- Additive migration: compatible with the old application. Run once in Supabase SQL Editor.
-- Entire migration is atomic. Existing IDs, products and profile data are preserved.
begin;
set local lock_timeout = '5s';
lock table public.users in share row exclusive mode;
alter table public.users add column if not exists username text;
alter table public.users add column if not exists instagram_username text;

create table if not exists public.seller_usernames (
  username text primary key,
  owner_id bigint references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.seller_usernames enable row level security;
revoke all on public.seller_usernames from anon, authenticated;
grant all on public.seller_usernames to service_role;

create or replace function public.prepare_seller_identity()
returns trigger language plpgsql security definer set search_path = '' as $$
declare base text; candidate text; suffix integer := 1;
begin
  -- Defense in depth: do not rely on any existing permissive users RLS policy.
  if current_setting('role', true) in ('anon', 'authenticated') then
    if auth.uid() is null or new.user_id is distinct from auth.uid()
      or (tg_op = 'UPDATE' and old.user_id is distinct from auth.uid()) then
      raise exception 'Profile ownership required' using errcode = '42501';
    end if;
  end if;
  new.username := lower(nullif(btrim(new.username), ''));
  if new.username is null and tg_op = 'UPDATE' then new.username := old.username; end if;
  if new.username is null then
    base := trim(both '-' from regexp_replace(lower(translate(split_part(btrim(coalesce(new.name,'')), ' ', 1), 'áàâäãåéèêëíìîïóòôöõúùûüñçÁÀÂÄÃÅÉÈÊËÍÌÎÏÓÒÔÖÕÚÙÛÜÑÇ', 'aaaaaaeeeeiiiiooooouuuuncaaaaaaeeeeiiiiooooouuuunc')), '[^a-z0-9]+', '-', 'g'));
    if base = '' then base := 'vendedor'; end if;
    base := left(base, greatest(1, 29 - length(new.id::text))) || '-' || new.id::text;
    candidate := base;
    while exists(select 1 from public.seller_usernames where username = candidate and owner_id is distinct from new.id) loop
      suffix := suffix + 1;
      candidate := left(base, 29 - length(suffix::text)) || '-' || suffix::text;
    end loop;
    new.username := candidate;
  end if;
  if new.username !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$'
    or new.username = any(array['admin','api','auth','blog','circular','circular-moda','circularmoda','help','instagram','login','logout','me','products','settings','signup','support','user','welcome','www']) then
    raise exception 'Invalid username' using errcode = '23514';
  end if;
  new.instagram_username := lower(nullif(btrim(new.instagram_username), ''));
  if new.instagram_username is not null and (
    new.instagram_username !~ '^[a-z0-9_]([a-z0-9_.]{0,28}[a-z0-9_])?$'
    or position('..' in new.instagram_username) > 0
    or new.instagram_username = any(array['p','reel','reels','stories','explore','accounts','direct'])
  ) then raise exception 'Invalid Instagram username' using errcode = '23514'; end if;
  return new;
end $$;

create or replace function public.reserve_seller_username()
returns trigger language plpgsql security definer set search_path = '' as $$
declare claimed text;
begin
  insert into public.seller_usernames(username, owner_id) values(new.username, new.id)
  on conflict(username) do update set owner_id = excluded.owner_id
    where public.seller_usernames.owner_id = excluded.owner_id
  returning username into claimed;
  if claimed is null then
    raise exception 'Username already reserved' using errcode = '23505';
  end if;
  return new;
end $$;
revoke all on function public.prepare_seller_identity() from public, anon, authenticated;
revoke all on function public.reserve_seller_username() from public, anon, authenticated;
drop trigger if exists prepare_seller_identity on public.users;
create trigger prepare_seller_identity before insert or update on public.users
for each row execute function public.prepare_seller_identity();
drop trigger if exists reserve_seller_username on public.users;
create trigger reserve_seller_username after insert or update of username on public.users
for each row execute function public.reserve_seller_username();

-- Also reserves already populated names when re-running the migration.
update public.users set username = username;
alter table public.users alter column username set not null;
create unique index if not exists users_username_unique on public.users(username);
-- Prevent simultaneous onboarding requests from creating two profiles for one login.
create unique index if not exists users_auth_identity_unique on public.users(user_id) where user_id is not null;
notify pgrst, 'reload schema';
commit;
