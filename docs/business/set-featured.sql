-- Set featured = true for the current 20-product visual batch (circular.moda)
-- `sku` is a generated column: 'SKU-' || lpad(id::text, 6, '0')
-- Current batch documented in:
-- docs/business/featured-products-batch-2026-08-20.md
--
-- Run in the Supabase SQL editor or with a service-role Supabase client.

-- 1) Preview the rows that will change (expect 20)
select id, sku, name, featured
from products
where sku in (
  'SKU-001344','SKU-001337','SKU-001334','SKU-001312','SKU-001309',
  'SKU-001308','SKU-001289','SKU-001288','SKU-001285','SKU-001284',
  'SKU-001279','SKU-001235','SKU-001227','SKU-001225','SKU-001211',
  'SKU-001210','SKU-001209','SKU-001198','SKU-001184','SKU-001170'
)
order by id;

-- 2) Make ONLY these 20 featured.
update products set featured = false where featured is true;

-- 3) Apply: set featured = true and return the affected rows
update products
set featured = true
where sku in (
  'SKU-001344','SKU-001337','SKU-001334','SKU-001312','SKU-001309',
  'SKU-001308','SKU-001289','SKU-001288','SKU-001285','SKU-001284',
  'SKU-001279','SKU-001235','SKU-001227','SKU-001225','SKU-001211',
  'SKU-001210','SKU-001209','SKU-001198','SKU-001184','SKU-001170'
)
returning id, sku, name, featured;
