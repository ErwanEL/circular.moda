-- Suivi des clics "Me interesa" sur les teasers de monetisation.
-- A executer dans Supabase SQL Editor avant d'activer la mesure en production.
--
-- Migration prudente :
-- - ne supprime aucun objet ;
-- - ne modifie pas les tables produits/users existantes ;
-- - active RLS sans policy publique, donc seuls les appels serveur avec
--   SUPABASE_SERVICE_ROLE_KEY doivent pouvoir lire/ecrire cette table.

begin;

create table if not exists public.monetization_interest_requests (
  id bigserial primary key,
  auth_user_id uuid,
  seller_id bigint references public.users(id) on delete set null,
  seller_email text,
  seller_name text,
  seller_phone text,
  feature text not null check (
    feature in (
      'boost',
      'plus',
      'ai_listing',
      'photo_optimization',
      'stats',
      'seller_badge',
      'meta_campaign_visibility'
    )
  ),
  source text not null check (
    source in (
      'me_banner',
      'me_sidebar',
      'me_product_card',
      'after_publish',
      'edit_product',
      'upload_form'
    )
  ),
  offer_id text not null,
  offer_title text,
  offer_price text,
  product_id bigint references public.products(id) on delete set null,
  product_name text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'converted', 'dismissed')
  ),
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_monetization_interest_status_created
  on public.monetization_interest_requests (status, created_at desc);

create index if not exists idx_monetization_interest_feature_created
  on public.monetization_interest_requests (feature, created_at desc);

create index if not exists idx_monetization_interest_seller
  on public.monetization_interest_requests (seller_id, created_at desc);

create index if not exists idx_monetization_interest_product
  on public.monetization_interest_requests (product_id);

do $$
begin
  if to_regprocedure('public.set_monetization_interest_requests_updated_at()') is null then
    execute $function$
      create function public.set_monetization_interest_requests_updated_at()
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
    where tgname = 'trg_monetization_interest_requests_updated_at'
      and tgrelid = 'public.monetization_interest_requests'::regclass
      and not tgisinternal
  ) then
    create trigger trg_monetization_interest_requests_updated_at
    before update on public.monetization_interest_requests
    for each row
    execute function public.set_monetization_interest_requests_updated_at();
  end if;
end;
$$;

alter table public.monetization_interest_requests enable row level security;

commit;
