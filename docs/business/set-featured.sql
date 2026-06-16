-- Set featured = true for the 20 shortlisted products (circular.moda)
-- `sku` is a generated column: 'SKU-' || lpad(id::text, 6, '0')
-- Run in the Supabase SQL editor (needs write access; the read-only MCP can't apply this).

-- 1) Preview the rows that will change (expect 20)
select id, sku, name, featured
from products
where sku in (
  'SKU-000880','SKU-000285','SKU-000423','SKU-000583','SKU-000361',
  'SKU-000066','SKU-000132','SKU-000229','SKU-000939','SKU-000467',
  'SKU-000321','SKU-000281','SKU-001259','SKU-000990','SKU-000731',
  'SKU-000793','SKU-000455','SKU-000707','SKU-000251','SKU-000644'
)
order by id;

-- OPTIONAL: to make ONLY these 20 featured (clear any currently-featured first),
-- uncomment and run this BEFORE the UPDATE below:
-- update products set featured = false where featured is true;

-- 2) Apply: set featured = true and return the affected rows
update products
set featured = true
where sku in (
  'SKU-000880','SKU-000285','SKU-000423','SKU-000583','SKU-000361',
  'SKU-000066','SKU-000132','SKU-000229','SKU-000939','SKU-000467',
  'SKU-000321','SKU-000281','SKU-001259','SKU-000990','SKU-000731',
  'SKU-000793','SKU-000455','SKU-000707','SKU-000251','SKU-000644'
)
returning id, sku, name, featured;
