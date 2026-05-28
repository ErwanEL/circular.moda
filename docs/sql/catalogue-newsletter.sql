create extension if not exists pgcrypto;

create table if not exists catalogue_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  status text not null default 'active' check (
    status in ('active', 'processing', 'unsubscribed', 'blocked', 'errored')
  ),
  subscribed_at timestamptz not null default now(),
  next_send_at timestamptz not null,
  last_sent_at timestamptz,
  last_window_end_at timestamptz,
  processing_started_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_catalogue_subscriptions_due
  on catalogue_subscriptions (status, next_send_at);

create table if not exists catalogue_delivery_cycles (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references catalogue_subscriptions(id) on delete cascade,
  cycle_due_date date not null,
  window_start_at timestamptz,
  window_end_at timestamptz not null,
  send_kind text not null check (
    send_kind in ('new_products', 'latest_picks')
  ),
  product_count integer not null default 0,
  brevo_message_id text,
  status text not null default 'processing' check (
    status in ('processing', 'sent', 'delivered', 'error', 'blocked', 'unsubscribed')
  ),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subscription_id, cycle_due_date)
);

create index if not exists idx_catalogue_delivery_cycles_message_id
  on catalogue_delivery_cycles (brevo_message_id);
