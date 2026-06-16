# Scripts

## `normalize-product-image-orientation.mjs`

One-off backfill that fixes the orientation of product images already stored in
Supabase Storage. Phone photos are saved with a sideways pixel grid plus an EXIF
`Orientation` tag; this bakes that rotation into the pixels and strips the tag,
in place, so the raw stored files look upright everywhere (including WhatsApp /
social share previews that read the raw URL, not the `/api/image` proxy).

**Usage:**

```bash
# Preview what would change (no writes)
node scripts/normalize-product-image-orientation.mjs --dry-run

# Apply to a few images first, as a safe test
node scripts/normalize-product-image-orientation.mjs --limit=3

# Apply to all product images
node scripts/normalize-product-image-orientation.mjs
```

**Requirements:**

- `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY` (or `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

**What it does:**

1. Fetches all `products` rows and walks every Supabase Storage image URL
2. Skips images already upright (no tag / `Orientation: 1`) and images with a
   stale tag (portrait-stored or 180°) that should not be rotated
3. Rotates the genuinely-sideways ones (landscape + 90°/270° tag) with sharp,
   preserving the encoded format (high quality for JPEG/WebP) and skipping
   anything that would change format (e.g. SVG)
4. Overwrites the file in place (`upsert`); the DB `images` URLs are unchanged

Idempotent — re-running reports 0 rotations. Run `--dry-run` first. To stay safe
it only rotates landscape-stored photos with a 90°/270° EXIF tag (genuinely
sideways phone photos); already-upright portrait images with a stale tag, and
180°-tagged images, are left untouched — matching the `/api/image` proxy guard.

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

## `import-supabase-users-to-brevo.mjs`

One-off import script to sync Supabase auth users into a Brevo contact list.

**Usage:**

```bash
node scripts/import-supabase-users-to-brevo.mjs --list-id=4 --dry-run
node scripts/import-supabase-users-to-brevo.mjs --list-id=4
```

**Requirements:**

- `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `BREVO_API_KEY`

**Related app env:**

- `BREVO_USERS_LIST_ID`
  - used by the app runtime to auto-sync new signed-up users to Brevo
  - the import script still takes the destination list from `--list-id`

**What it does:**

1. Fetches all Supabase Auth users with pagination
2. Joins linked profile rows from the `users` table through `users.user_id`
3. Builds Brevo contact upserts using:
   - `email` from Supabase Auth
   - `FIRSTNAME` from `users.name` when present
   - `SMS` from `users.phone`, normalized to `+54...`
4. Upserts contacts into the provided Brevo list with `updateEnabled: true`
5. Prints a summary including scanned users, linked profiles, email-only imports, SMS-enriched imports, and failures

Use `--dry-run` first to verify the data that will be sent before running the live import.
