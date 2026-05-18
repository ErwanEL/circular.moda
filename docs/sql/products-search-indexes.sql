-- Enable trigram support for catalogue search on products.name / sku / description.
create extension if not exists pg_trgm;

create index if not exists idx_products_name_trgm
  on products using gin (name gin_trgm_ops);

create index if not exists idx_products_sku_trgm
  on products using gin (sku gin_trgm_ops);

create index if not exists idx_products_description_trgm
  on products using gin (description gin_trgm_ops);
