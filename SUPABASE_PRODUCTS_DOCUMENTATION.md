# Supabase Products Integration - Documentation

## 📋 Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Product Fetching](#product-fetching)
4. [ISR and Revalidation](#isr-and-revalidation)
5. [User Management](#user-management)
6. [Product Upload Form](#product-upload-form)
7. [Data Flow](#data-flow)
8. [Database Schema](#database-schema)
9. [Troubleshooting](#troubleshooting)

---

## Overview

This application uses **Supabase** as the single source for products and users:

- **Products**: Stored in the Supabase PostgreSQL `products` table
- **Users**: Stored in Supabase, with product counts computed on-the-fly

The system:

- Fetches all products from Supabase
- Caches product reads with Next.js data cache tags (`products`, `product:{slug}`)
- Revalidates product pages on demand after product mutations
- Fetches user information with product counts from Supabase
- Allows uploading new products via the admin form

---

## Architecture

### Data Sources

```text
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
         │ Products & Users
         ▼
┌─────────────────┐
│    Supabase     │  (PostgreSQL + Storage)
│  - products     │
│  - users        │
│  - categories   │
│  - colors       │
│  - genders      │
└─────────────────┘
```

### Key Files

- **Product Fetching**: `src/app/lib/products.ts`
- **Supabase Products**: `src/app/lib/supabase-products.ts`
- **Product Revalidation**: `src/app/lib/product-revalidation.ts`
- **Revalidation Webhook**: `src/app/api/revalidate/route.ts`
- **User Management**: `src/app/lib/users.ts`
- **Upload Form**: `src/app/admin/upload-product/page.tsx`
- **Upload API**: `src/app/api/admin/upload-product/route.ts`

---

## Product Fetching

### How Products Are Loaded

The system loads products from Supabase with Next.js server-side caching:

#### 1. Cache Strategy

```typescript
// Next data cache with 5-minute fallback ISR
// Tags:
// - products
// - product:{slug}
```

#### 2. Product Source

**Supabase** (`products` table)

- All products are stored in Supabase
- Loaded via `getAllProductsFromSupabase()`
- Transformed to match the Product interface

#### 3. Product Lookup by Slug

```typescript
// 1. Query Supabase by public_id or slug
// 2. Return null if not found
```

### Code Flow

```text
getAllProducts()
  ├─> Check Next.js data cache
  └─> Load from Supabase:
      └─> getAllProductsFromSupabase()
          └─> Update tagged cache
          └─> Return list
```

---

## ISR and Revalidation

### Pages Covered

- `/products`
- `/products/[slug]`

Both routes use a 5-minute ISR fallback (`revalidate = 300`) and keep `dynamicParams` enabled for new slugs.

### On-Demand Revalidation Flow

```text
Supabase insert/update/delete
  ├─> Directly from this Next.js app
  │   └─> Route Handler calls revalidateProductContent()
  └─> Outside this app (dashboard, SQL, import, etc.)
      └─> Supabase trigger / Edge Function calls POST /api/revalidate
          └─> Next.js invalidates:
              ├─> tag: products
              ├─> tag: product:{slug}
              ├─> path: /products
              └─> path: /products/{slug}
```

### Endpoint

Use the App Router endpoint:

- `src/app/api/revalidate/route.ts`

This replaces the older `pages/api/revalidate.ts` pattern.

Required env var:

```bash
REVALIDATE_SECRET=your-shared-secret
```

Accepted payload example:

```json
{
  "slug": "vestido-lino-verde-f1f881a3-a813-4633-951a-70cc2bdf559f",
  "oldSlug": "ancien-slug-si-renommage",
  "event": "UPDATE"
}
```

Or forward Supabase-style records:

```json
{
  "event": "INSERT",
  "record": {
    "name": "Vestido lino verde",
    "public_id": "f1f881a3-a813-4633-951a-70cc2bdf559f"
  }
}
```

### Supabase Integration

Recommended pattern:

1. Add a Postgres trigger on `products`.
2. Trigger a Supabase Edge Function.
3. The Edge Function calls `POST https://your-domain.com/api/revalidate`.
4. Send `x-revalidate-secret: <REVALIDATE_SECRET>`.

Minimal Edge Function request body:

```json
{
  "event": "UPDATE",
  "record": { "...": "NEW row" },
  "old_record": { "...": "OLD row" }
}
```

### Important Behavior

- Revalidation invalidates caches immediately.
- Actual HTML/RSC regeneration happens on the next request to the page.
- If you need proactive regeneration, add a warm-up request after revalidation.

---

## User Management

### User-Product Relationship

Products reference their owner via a foreign key:

- **Supabase**: Products have an `owner` field (foreign key to `users.id`)

```
┌─────────┐         ┌──────────┐
│  users  │◄────────│ products │
│   id    │  owner  │   id     │
└─────────┘         └──────────┘
```

### Fetching Users with Product Count

#### Method 1: Batch Queries (Current Implementation)

```typescript
// 1. Fetch all users in one query
SELECT id, name FROM users WHERE id IN (1,2,3)

// 2. Fetch all products in one query
SELECT owner FROM products WHERE owner IN (1,2,3)

// 3. Count products per user in memory
// Result: User objects with productCount
```

**Performance**: 2 queries total (regardless of user count)

#### Method 2: Database Function (Optional - Most Efficient)

```sql
-- Single query with JOIN + COUNT
SELECT u.id, u.name, COUNT(p.id) as product_count
FROM users u
LEFT JOIN products p ON p.owner = u.id
WHERE u.id = ANY(user_ids)
GROUP BY u.id, u.name
```

**Performance**: 1 query total

### Code Implementation

```typescript
// In products/[slug]/page.tsx
if (product['User ID']) {
  user = await getUsersByIdsFromSupabase(userIds);
}
```

### User ID Format

- **Supabase**: Numeric user IDs (e.g., `1`, `4`, `123`) stored in `products.owner`

---

## Product Upload Form

### Form Structure

The upload form (`/admin/upload-product`) consists of:

1. **AI Mode Section**: Analyze images with AI to auto-fill fields
2. **Form Fields**: Manual input fields
3. **User Selector**: Select or create a user
4. **Image Upload**: Drag & drop image uploads

### Upload Workflow

```text
User fills form
  ├─> Selects/Creates user
  ├─> Uploads images
  ├─> Fills product details
  └─> Submits form
      │
      ▼
handleSubmit()
  ├─> Validate files
  ├─> Validate ownerId
  ├─> Validate form data
  └─> Send to API
      │
      ▼
/api/admin/upload-product
  ├─> Upload images to Supabase Storage
  ├─> Generate public_id (UUID)
  ├─> Validate gender values
  ├─> Insert product into Supabase
  └─> Return success/error
```

### Form State Management

```typescript
// Component state
const [ownerId, setOwnerId] = useState(''); // User selection

// Form hook state
const { formData, updateField, validateAndPrepare } = useProductForm();

// Sync ownerId to form data
useEffect(() => {
  updateField('ownerId', ownerId);
}, [ownerId, updateField]);
```

### Validation Flow

```text
validateAndPrepare()
  ├─> Check name
  ├─> Check ownerId (from formData)
  ├─> Validate color (match against Supabase colors)
  ├─> Validate category (match against Supabase categories)
  ├─> Validate gender (match against Supabase genders)
  └─> Return validated data or error
```

### Image Upload Process

1. **Client**: User selects images → stored in `files` state
2. **Submit**: Images sent as `FormData` with `multipart/form-data`
3. **Server**:
   - Generate unique filename: `{public_id}-{index}.{ext}`
   - Upload to Supabase Storage: `products/{filename}`
   - Get public URL
   - Store URLs in `images` array field

### Product Creation in Supabase

```typescript
// Generated fields
- public_id: UUID (unique identifier)
- created_at: Timestamp (auto)

// Required fields
- name: string
- owner: number (user ID)
- images: string[] (array of URLs)

// Optional fields
- price: number
- size: string
- color: string
- category: string
- gender: string[]
- description: string
- featured: boolean
```

---

## Data Flow

### Product Page Rendering

```text
User visits /products/[slug]
  │
  ▼
generateStaticParams()
  └─> getAllProducts()
      └─> Returns all products (Supabase)
  └─> Generate static paths
  │
  ▼
ProductPage component
  ├─> getProductBySlug(slug)
  │   └─> Supabase lookup by public_id or slug
  │
  ├─> Fetch user data
  │   ├─> Check if User ID exists
  │   ├─> Fetch user with product count from Supabase
  │   └─> Handle errors gracefully
  │
  └─> Render ProductDetail
      ├─> ProductImageGallery
      ├─> ProductInfo (with user info)
      └─> Suggested products
```

### Upload Flow

```text
Admin visits /admin/upload-product
  │
  ▼
Form loads
  ├─> Fetch categories, colors, genders from Supabase
  ├─> Fetch users list
  └─> Initialize form state
  │
  ▼
User fills form
  ├─> Selects user (updates ownerId state)
  │   └─> Synced to formData via useEffect
  ├─> Uploads images
  ├─> Fills product details
  └─> Submits
  │
  ▼
API: /api/admin/upload-product
  ├─> Validate input
  ├─> Upload images to Supabase Storage
  ├─> Generate public_id
  ├─> Validate gender values (FK constraint)
  ├─> Insert product
  └─> Return success
  │
  ▼
Product appears in:
  ├─> Supabase products table
  ├─> Product listing page
  └─> Search results
```

---

## Database Schema

### Products Table

```sql
CREATE TABLE products (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  public_id UUID UNIQUE NOT NULL,
  images TEXT[] DEFAULT '{}',
  owner BIGINT REFERENCES users(id),
  price NUMERIC,
  category TEXT,
  size TEXT,
  color TEXT,
  description TEXT,
  gender TEXT[],
  featured BOOLEAN DEFAULT FALSE,
  stock INTEGER DEFAULT 1
);

-- Indexes
CREATE INDEX idx_products_owner ON products(owner);
CREATE INDEX idx_products_public_id ON products(public_id);
```

### Users Table

```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  phone TEXT,
  user_id UUID -- Link to auth.users.id
);

-- Indexes
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_name ON users(name);
```

### Relationships

```text
users (1) ──< (many) products
  │                    │
  id              owner (FK)
```

**To get user's products**: `SELECT * FROM products WHERE owner = user_id`
**To get product count**: `SELECT COUNT(*) FROM products WHERE owner = user_id`

---

## Key Functions Reference

### Product Functions

#### `getAllProducts()`

- **Location**: `src/app/lib/products.ts`
- **Returns**: `Promise<Product[]>`
- **What it does**:
  - Checks in-memory cache first (5 min TTL)
  - Loads from Supabase via `getAllProductsFromSupabase()`
  - Updates cache and returns list

#### `getProductBySlug(slug: string)`

- **Location**: `src/app/lib/products.ts`
- **Returns**: `Promise<Product | null>`
- **What it does**:
  - Looks up product in Supabase by `public_id` or `slug`
  - Returns null if not found

#### `getAllProductsFromSupabase()`

- **Location**: `src/app/lib/supabase-products.ts`
- **Returns**: `Promise<Product[]>`
- **What it does**:
  - Fetches all products from Supabase
  - Transforms to Product format
  - Handles images (string URLs)

### User Functions

#### `getUsersByIdsFromSupabase(userIds: (string | number)[])`

- **Location**: `src/app/lib/users.ts`
- **Returns**: `Promise<User[]>`
- **What it does**:
  - Fetches users in batch (1 query)
  - Fetches product counts in batch (1 query)
  - Combines results with `productCount` field
  - **Performance**: 2 queries total

---

## Product Data Transformation

### Supabase → Product Format

```typescript
// Supabase row structure
{
  id: 12,
  name: "Zapatillas Puma",
  public_id: "629a11bc-66ab-476a-8ad2-6e0860546210",
  owner: 4,
  images: ["url1", "url2"],
  price: 90000,
  // ...
}

// Transformed to Product format
{
  id: "12",
  SKU: "SKU-000012",
  'Product Name': "Zapatillas Puma",
  slug: "zapatillas-puma-629a11bc-66ab-476a-8ad2-6e0860546210",
  'User ID': ["4"],
  Images: ["url1", "url2"],
  Price: 90000,
  // ...
}
```

### Slug Generation

```typescript
// Format: {name-slugified}-{public_id}
// Example: "zapatillas-puma-629a11bc-66ab-476a-8ad2-6e0860546210"

slug = slugify(productName) + '-' + public_id;
```

---

## API Endpoints

### `/api/admin/upload-product` (POST)

**Request**: `FormData`

- `name`: string (required)
- `ownerId`: string (required) - User ID
- `price`: string (optional)
- `size`: string (optional)
- `color`: string (optional)
- `category`: string (optional)
- `gender`: string (JSON array, optional)
- `description`: string (optional)
- `featured`: string ("true"/"false")
- `images`: File[] (required, at least 1)

**Response**:

```json
{
  "success": true,
  "product": {
    /* product data */
  },
  "message": "Produit uploadé avec succès"
}
```

**Error Response**:

```json
{
  "error": "Error message"
}
```

### `/api/admin/users` (GET)

**Returns**: List of all users

```json
{
  "users": [
    { "id": 1, "name": "John", "phone": "+549..." }
    // ...
  ]
}
```

### `/api/admin/users` (POST)

**Request**: Create new user

```json
{
  "name": "John Doe",
  "phone": "+5491125115030"
}
```

**Response**:

```json
{
  "user": { "id": 5, "name": "John Doe", "phone": "+5491125115030" }
}
```

---

## Troubleshooting

### Products Not Showing

1. **Check Supabase connection**:

   ```typescript
   // Verify env variables
   NEXT_PUBLIC_SUPABASE_URL;
   SUPABASE_SERVICE_ROLE_KEY;
   ```

2. **Check cache**:
   - Clear in-memory cache (restart dev server)

3. **Check product format**:
   - Products need `public_id` and `name` in Supabase

### User Info Not Displaying

1. **Check User ID format**:
   - User IDs are numeric (`"4"`, `"1"`) from `products.owner`

2. **Check user exists**:
   - Check `users` table in Supabase for the given `owner` id

3. **Check product count**:
   - Verify `products.owner` references `users.id`
   - Check index exists: `idx_products_owner`

### Upload Form Not Working

1. **User selection issue**:
   - Check `ownerId` state is synced to `formData.ownerId`
   - Verify `useEffect` is running

2. **Validation errors**:
   - Check all required fields are filled
   - Verify color/category/gender match Supabase values

3. **Image upload fails**:
   - Check Supabase Storage bucket exists: `storage`
   - Verify RLS policies allow uploads
   - Check file size limits

### Build Failures

1. **Missing User ID**:
   - Products can render without user info
   - User info is optional in UI

---

## Best Practices

### 1. Product IDs

- Use `public_id` (UUID) for slugs and stable product identity

### 2. User Selection

- Always validate `ownerId` before submission
- Sync component state to form data

### 3. Image Management

- Use Supabase Storage for product images
- Generate unique filenames: `{public_id}-{index}.{ext}`

### 4. Performance

- Use batch queries for multiple users
- Cache product lists (5-minute in-memory TTL)

### 5. Error Handling

- Never block page rendering for user fetch failures
- Gracefully handle missing user data
- Log errors but don't expose to users

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## Summary

The system uses **Supabase** as the single source for products and users:

✅ **Products**: Loaded from Supabase with in-memory caching  
✅ **Users**: Fetched with product counts from Supabase  
✅ **Optimized**: Batch queries, 5-minute cache TTL  
✅ **User-friendly**: Automatic user fetching with product counts  
✅ **Robust**: Error handling and optional user info on product pages
