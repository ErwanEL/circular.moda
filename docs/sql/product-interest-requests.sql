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
  buyer_consent_at timestamptz,
  buyer_consent_source text,
  seller_whatsapp text,
  seller_notified_at timestamptz,
  seller_notification_message_id text,
  seller_notification_error text,
  last_whatsapp_status text,
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

create index if not exists idx_product_interest_requests_seller_message
  on public.product_interest_requests (seller_notification_message_id)
  where seller_notification_message_id is not null;

create table if not exists public.whatsapp_message_logs (
  id bigserial primary key,
  product_interest_request_id bigint references public.product_interest_requests(id) on delete set null,
  direction text not null check (direction in ('outbound', 'inbound', 'status')),
  recipient_phone text,
  template_name text,
  message_id text,
  status text,
  payload jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_whatsapp_message_logs_request
  on public.whatsapp_message_logs (product_interest_request_id, created_at desc);

create index if not exists idx_whatsapp_message_logs_message
  on public.whatsapp_message_logs (message_id)
  where message_id is not null;

create index if not exists idx_whatsapp_message_logs_status_created
  on public.whatsapp_message_logs (status, created_at desc);

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
  if to_regprocedure('public.set_whatsapp_message_logs_updated_at()') is null then
    execute $function$
      create function public.set_whatsapp_message_logs_updated_at()
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

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'trg_whatsapp_message_logs_updated_at'
      and tgrelid = 'public.whatsapp_message_logs'::regclass
      and not tgisinternal
  ) then
    create trigger trg_whatsapp_message_logs_updated_at
    before update on public.whatsapp_message_logs
    for each row
    execute function public.set_whatsapp_message_logs_updated_at();
  end if;
end;
$$;

alter table public.product_interest_requests enable row level security;
alter table public.whatsapp_message_logs enable row level security;

commit;
