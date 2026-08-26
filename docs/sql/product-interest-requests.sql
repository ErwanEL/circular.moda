-- MVP concierge pour automatiser la mise en relation acheteuse/vendeuse.
-- A executer dans Supabase SQL Editor avant d'activer le suivi admin.
--
-- Migration prudente :
-- - ne supprime aucun objet ;
-- - ne remplace aucune fonction existante ;
-- - cree le trigger seulement s'il n'existe pas deja ;
-- - active RLS sans policy publique, donc seuls les appels serveur avec
--   SUPABASE_SERVICE_ROLE_KEY doivent pouvoir lire/ecrire cette table.

begin;

create table if not exists public.product_interest_requests (
  id bigserial primary key,
  code text not null unique,
  product_id bigint references public.products(id) on delete set null,
  product_sku text not null,
  product_slug text,
  product_name text,
  product_size text,
  product_color text,
  seller_id bigint references public.users(id) on delete set null,
  buyer_name text,
  buyer_phone text,
  status text not null default 'new' check (
    status in (
      'new',
      'seller_contacted',
      'buyer_contacted',
      'group_created',
      'sale_coordinated',
      'cancelled'
    )
  ),
  availability_confirmed boolean not null default false,
  source text not null default 'product_detail',
  whatsapp_message text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_product_interest_requests_status_created
  on public.product_interest_requests (status, created_at desc);

create index if not exists idx_product_interest_requests_product
  on public.product_interest_requests (product_id);

create index if not exists idx_product_interest_requests_seller
  on public.product_interest_requests (seller_id);

do $$
begin
  if to_regprocedure('public.set_product_interest_requests_updated_at()') is null then
    execute $function$
      create function public.set_product_interest_requests_updated_at()
      returns trigger
      language plpgsql
      set search_path = public
      as $trigger$
      begin
        new.updated_at = now();
        return new;
      end;
      $trigger$;
    $function$;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_product_interest_requests_updated_at'
      and tgrelid = 'public.product_interest_requests'::regclass
      and not tgisinternal
  ) then
    create trigger trg_product_interest_requests_updated_at
    before update on public.product_interest_requests
    for each row
    execute function public.set_product_interest_requests_updated_at();
  end if;
end;
$$;

alter table public.product_interest_requests enable row level security;

commit;
