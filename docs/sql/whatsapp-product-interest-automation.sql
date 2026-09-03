-- Extension du MVP concierge pour automatiser la notification WhatsApp vendeur.
-- A executer dans Supabase SQL Editor avant d'activer WHATSAPP_AUTOMATION_ENABLED.
--
-- Migration prudente :
-- - ne supprime aucun objet ;
-- - ajoute seulement les colonnes manquantes ;
-- - cree une table de logs dediee aux messages WhatsApp ;
-- - garde RLS activee sans policy publique.

begin;

alter table public.product_interest_requests
  add column if not exists buyer_consent_at timestamptz,
  add column if not exists buyer_consent_source text,
  add column if not exists seller_whatsapp text,
  add column if not exists seller_notified_at timestamptz,
  add column if not exists seller_notification_message_id text,
  add column if not exists seller_notification_error text,
  add column if not exists last_whatsapp_status text;

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

alter table public.whatsapp_message_logs enable row level security;

commit;
