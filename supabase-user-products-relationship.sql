-- ============================================
-- Optimize User-Products Relationship in Supabase
-- ============================================
-- This script ensures the relationship between users and products is optimized
-- The relationship: products.owner -> users.id (foreign key)

-- 1. Ensure the foreign key constraint exists
-- (This should already exist if you created products table with owner column)
-- If not, uncomment the following:
-- ALTER TABLE products 
--   ADD CONSTRAINT fk_products_owner 
--   FOREIGN KEY (owner) REFERENCES users(id) ON DELETE SET NULL;

-- 2. Create an index on products.owner for fast lookups
-- This is crucial for counting products per user efficiently
CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner);

-- 3. Optional: Create a view for users with product count
-- This can be useful for analytics or reporting
CREATE OR REPLACE VIEW users_with_product_count AS
SELECT 
  u.id,
  u.name,
  u.created_at,
  u.phone,
  u.email,
  COUNT(p.id) as product_count
FROM users u
LEFT JOIN products p ON p.owner = u.id
GROUP BY u.id, u.name, u.created_at, u.phone, u.email;

-- 4. Create optimized function to get multiple users with product counts
-- This is more efficient than individual queries
CREATE OR REPLACE FUNCTION get_users_with_product_counts(user_ids BIGINT[])
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    COALESCE(COUNT(p.id), 0)::BIGINT as product_count
  FROM users u
  LEFT JOIN products p ON p.owner = u.id
  WHERE u.id = ANY(user_ids)
  GROUP BY u.id, u.name;
END;
$$ LANGUAGE plpgsql;

-- 5. Optional: Create a function for a single user (simpler case)
CREATE OR REPLACE FUNCTION get_user_with_product_count(user_id BIGINT)
RETURNS TABLE (
  id BIGINT,
  name TEXT,
  product_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.name,
    COALESCE(COUNT(p.id), 0)::BIGINT as product_count
  FROM users u
  LEFT JOIN products p ON p.owner = u.id
  WHERE u.id = user_id
  GROUP BY u.id, u.name;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Verification Queries
-- ============================================
-- Test the relationship:
-- SELECT * FROM users_with_product_count LIMIT 10;
-- SELECT * FROM get_user_with_product_count(1); -- Replace 1 with actual user ID

