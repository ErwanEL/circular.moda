-- Additive migration. Existing profiles keep their names and products.
begin;
set local lock_timeout = '5s';
alter table public.users
  add column if not exists boutique_name text not null default '' check (char_length(boutique_name) <= 60),
  add column if not exists bio text not null default '' check (char_length(bio) <= 300),
  add column if not exists city text not null default '' check (char_length(city) <= 80),
  add column if not exists avatar_url text,
  add column if not exists pinned_product_ids bigint[] not null default '{}' check (cardinality(pinned_product_ids) <= 3);

create or replace function public.validate_storefront_pins() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if cardinality(new.pinned_product_ids) <> (select count(distinct id) from unnest(new.pinned_product_ids) id)
    or exists (select 1 from unnest(new.pinned_product_ids) as chosen(product_id) where not exists
      (select 1 from public.products p where p.id = chosen.product_id and p.owner = new.id)) then
    raise exception 'Only distinct own products can be pinned' using errcode = '23514';
  end if;
  return new;
end $$;
revoke all on function public.validate_storefront_pins() from public, anon, authenticated;
drop trigger if exists validate_storefront_pins on public.users;
create trigger validate_storefront_pins before insert or update of pinned_product_ids on public.users
  for each row execute function public.validate_storefront_pins();
notify pgrst, 'reload schema';
commit;
