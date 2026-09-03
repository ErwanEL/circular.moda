-- Journal de publication Instagram des produits circular.moda.
-- A executer dans Supabase SQL Editor avant d'activer la publication reelle.
--
-- Objectifs :
-- - garder une trace des produits deja envoyes a Instagram ;
-- - eviter les doublons ;
-- - conserver les erreurs Meta sans exposer le token ;
-- - permettre un MVP dry-run puis une publication manuelle controlee.

begin;

create table if not exists public.instagram_product_posts (
  id bigserial primary key,
  product_id bigint references public.products(id) on delete set null,
  product_slug text,
  product_name text,
  product_url text,
  image_url text,
  source_image_url text,
  caption text,
  status text not null default 'pending' check (
    status in (
      'pending',
      'container_created',
      'publishing',
      'published',
      'failed',
      'skipped'
    )
  ),
  instagram_container_id text,
  instagram_media_id text,
  instagram_permalink text,
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_instagram_product_posts_status_created
  on public.instagram_product_posts (status, created_at desc);

create index if not exists idx_instagram_product_posts_product
  on public.instagram_product_posts (product_id);

create unique index if not exists idx_instagram_product_posts_unique_active
  on public.instagram_product_posts (product_id)
  where product_id is not null
    and status in ('pending', 'container_created', 'publishing', 'published');

do $$
begin
  if to_regprocedure('public.set_instagram_product_posts_updated_at()') is null then
    execute $function$
      create function public.set_instagram_product_posts_updated_at()
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
    where tgname = 'trg_instagram_product_posts_updated_at'
      and tgrelid = 'public.instagram_product_posts'::regclass
      and not tgisinternal
  ) then
    create trigger trg_instagram_product_posts_updated_at
    before update on public.instagram_product_posts
    for each row
    execute function public.set_instagram_product_posts_updated_at();
  end if;
end;
$$;

alter table public.instagram_product_posts enable row level security;

commit;

