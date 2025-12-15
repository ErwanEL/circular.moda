# Supabase User-Products Relationship Optimization

## Problem

The original implementation had an **N+1 query problem**:
- For each user, it made 2 separate queries:
  1. Fetch user: `SELECT id, name FROM users WHERE id = ?`
  2. Count products: `SELECT COUNT(*) FROM products WHERE owner = ?`
- For 3 users = **6 queries total**

## Solution: Three Optimization Levels

### Level 1: Batch Queries (Current Implementation) ✅

**What it does:**
- Fetches all users in **1 query**: `SELECT id, name FROM users WHERE id IN (1,2,3)`
- Fetches all products in **1 query**: `SELECT owner FROM products WHERE owner IN (1,2,3)`
- Counts products in memory using a Map

**Performance:**
- For 3 users: **2 queries** (down from 6)
- ~70% reduction in database round trips
- Good for most use cases

**Code:** `getUsersByIdsFromSupabase()`

### Level 2: Database Function (Most Efficient) 🚀

**What it does:**
- Uses PostgreSQL function `get_users_with_product_counts()` 
- Single query with JOIN + COUNT: `SELECT u.id, u.name, COUNT(p.id) FROM users u LEFT JOIN products p ON p.owner = u.id WHERE u.id = ANY(?) GROUP BY u.id, u.name`
- All work done in database

**Performance:**
- For 3 users: **1 query** (down from 6)
- ~85% reduction in database round trips
- Best for high-traffic scenarios

**Code:** `getUsersByIdsFromSupabaseRPC()`

**Setup Required:**
```sql
-- Run this in Supabase SQL Editor
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
```

### Level 3: Database View (For Analytics)

**What it does:**
- Pre-computed view with all users and their product counts
- Updated automatically when products change
- Best for reporting/analytics pages

**Performance:**
- Instant reads (pre-computed)
- No JOIN needed at query time

**Code:** See `supabase-user-products-relationship.sql`

## Current Implementation

The code uses **Level 1 (Batch Queries)** by default, which is a good balance of:
- ✅ Performance (2 queries instead of 6)
- ✅ Simplicity (no database setup required)
- ✅ Maintainability (easy to understand)

## When to Use Each Approach

| Scenario | Recommended Approach |
|----------|---------------------|
| **Most cases** | Level 1: Batch Queries (current) |
| **High traffic** | Level 2: Database Function (RPC) |
| **Analytics/Reports** | Level 3: Database View |
| **Single user lookup** | Level 1 is fine (only 2 queries) |

## Migration to Level 2 (Optional)

If you want the best performance, you can switch to the RPC approach:

1. **Run the SQL function** in Supabase (see `supabase-user-products-relationship.sql`)

2. **Update the code** to use RPC:
   ```typescript
   // In products/[slug]/page.tsx, change:
   const users = await getUsersByIdsFromSupabase(userIds);
   // To:
   const users = await getUsersByIdsFromSupabaseRPC(userIds);
   ```

## Performance Comparison

| Users | Old (N+1) | Level 1 (Batch) | Level 2 (RPC) |
|-------|-----------|----------------|---------------|
| 1     | 2 queries | 2 queries      | 1 query       |
| 3     | 6 queries | 2 queries      | 1 query       |
| 10    | 20 queries| 2 queries      | 1 query       |
| 100   | 200 queries| 2 queries     | 1 query       |

## Index Requirements

Make sure you have an index on `products.owner` for optimal performance:

```sql
CREATE INDEX IF NOT EXISTS idx_products_owner ON products(owner);
```

This is included in `supabase-user-products-relationship.sql`.

