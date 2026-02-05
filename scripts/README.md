# Scripts

## `test-supabase.mjs`

Script to verify the Supabase connection and product data.

**Usage:**

```bash
node scripts/test-supabase.mjs
```

**Requirements:**

- `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**What it does:**

1. Checks that the `products` table exists and is accessible
2. Prints a sample of the table structure (columns)
3. Fetches up to 5 products and logs name, ID, SKU, slug, price, category

Use this after setting up Supabase or when debugging product loading.
