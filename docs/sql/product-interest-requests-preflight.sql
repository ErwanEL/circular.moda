-- Verification en lecture seule avant d'executer product-interest-requests.sql.
-- Ce script ne cree, ne modifie et ne supprime rien.

with checks as (
  select
    'public.products existe' as check_name,
    (to_regclass('public.products') is not null) as ok,
    'Table source utilisee pour retrouver la prenda.' as details
  union all
  select
    'public.users existe',
    (to_regclass('public.users') is not null),
    'Table source utilisee pour retrouver la vendeuse.'
  union all
  select
    'products.id existe',
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'products'
        and column_name = 'id'
    ),
    'Reference produit pour product_interest_requests.product_id.'
  union all
  select
    'products.owner existe',
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'products'
        and column_name = 'owner'
    ),
    'Reference vendeuse pour product_interest_requests.seller_id.'
  union all
  select
    'users.id existe',
    exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'users'
        and column_name = 'id'
    ),
    'Cible de la foreign key seller_id.'
  union all
  select
    'table product_interest_requests existe deja',
    (to_regclass('public.product_interest_requests') is not null),
    'Si true, verifier que sa structure correspond avant migration.'
  union all
  select
    'fonction updated_at existe deja',
    (to_regprocedure('public.set_product_interest_requests_updated_at()') is not null),
    'Si true, la migration prudente ne la remplacera pas.'
  union all
  select
    'trigger updated_at existe deja',
    exists (
      select 1
      from pg_trigger
      where tgname = 'trg_product_interest_requests_updated_at'
        and tgrelid = to_regclass('public.product_interest_requests')
        and not tgisinternal
    ),
    'Si true, la migration prudente ne le recréera pas.'
  union all
  select
    'availability_confirmed default false',
    coalesce(
      (
        select column_default = 'false'
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'product_interest_requests'
          and column_name = 'availability_confirmed'
      ),
      false
    ),
    'Si false apres migration, executer product-interest-requests-set-availability-default.sql.'
  union all
  select
    'RLS deja activee',
    coalesce(
      (
        select c.relrowsecurity
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relname = 'product_interest_requests'
      ),
      false
    ),
    'La migration active RLS pour bloquer l''acces client direct.'
  union all
  select
    'policies RLS publiques existantes',
    exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'product_interest_requests'
    ),
    'La feature MVP attend aucune policy publique et des routes serveur avec service role.'
)
select check_name, ok, details
from checks
order by check_name;
