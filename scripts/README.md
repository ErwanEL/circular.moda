# API Optimization Strategy

This project has been optimized to minimize Airtable API calls while maintaining data freshness.

## Scripts Overview

### 1. `pull-airtable.mjs` (Build-time)

- **Purpose**: Fetches data during production builds
- **Trigger**: `npm run build` (only when `FETCH_AIRTABLE_AT_BUILD=true`)
- **Optimizations**:
  - Time-based caching (minimum 1 hour between fetches)
  - Change detection (skips if no data changed)
  - Field selection (only fetches needed fields)
  - Fallback to existing data on API errors

### 2. `update-products.mjs` (Manual)

- **Purpose**: Manual data updates independent of builds
- **Trigger**: `npm run update-products`
- **Use case**: When you need fresh data without building

## Environment Variables

### Required

```bash
AIRTABLE_TOKEN=your_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=your_table_name_here
```

### Optional

```bash
FETCH_AIRTABLE_AT_BUILD=false  # Set to 'true' only when you want build-time updates
MIN_HOURS_BETWEEN_FETCHES=1    # Minimum hours between API calls (default: 1)
```

## API Call Optimization Features

### 1. **Smart Caching**

- In-memory cache with 5-minute TTL
- Disk cache for faster subsequent loads
- Change detection to avoid unnecessary updates

### 2. **Time-based Throttling**

- Minimum 1 hour between API calls (configurable)
- Prevents excessive API usage during frequent builds

### 3. **Field Selection**

- Only fetches required fields: `['SKU', 'Price', 'Category', 'StockLevels', 'Color', 'Size', 'Images']`
- Reduces data transfer and API response size

### 4. **Error Handling**

- Falls back to existing data if API fails
- Graceful degradation prevents build failures

### 5. **Change Detection**

- Compares record count, IDs, and data hash
- Skips file writes if no changes detected

## Usage Recommendations

### For Development

```bash
# Set in .env.local
FETCH_AIRTABLE_AT_BUILD=false

# Manual updates when needed
npm run update-products
```

### For Production

```bash
# Only enable during deployments when you need fresh data
FETCH_AIRTABLE_AT_BUILD=true npm run build

# Or use manual updates
npm run update-products
```

### For CI/CD

```bash
# Disable automatic fetching in deployment environments
# Use manual updates or webhooks instead
FETCH_AIRTABLE_AT_BUILD=false
```

## API Call Count

- **Build-time script**: 1 API call per build (only when enabled)
- **Manual script**: 1 API call per run
- **Runtime**: 0 API calls (uses cached data)

## Monitoring

Check the cache files to monitor API usage:

- `data/.airtable-cache.json` - Build-time cache info
- `data/.products-cache.json` - Runtime cache info

## Troubleshooting

### API Limit Reached

1. Check if `FETCH_AIRTABLE_AT_BUILD=true` is set in deployment
2. Verify no automatic deployments are running
3. Use manual updates instead of build-time fetching

### Data Not Updating

1. Check cache timestamps in cache files
2. Verify environment variables are set correctly
3. Run manual update: `npm run update-products`
