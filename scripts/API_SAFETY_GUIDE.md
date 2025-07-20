# 🛡️ API Safety Guide

This guide ensures you never hit Airtable API limits by preventing unwanted API calls.

## 🚨 Critical Settings

### 1. Environment Variables

**ALWAYS set in your `.env.local`:**

```bash
FETCH_AIRTABLE_AT_BUILD=false
```

**NEVER set to `true` unless you specifically want to update data during a build.**

### 2. Safe Build Commands

**❌ DON'T use these (they might trigger API calls):**

```bash
npm run build          # Might trigger API calls if FETCH_AIRTABLE_AT_BUILD=true
yarn build             # Same as above
```

**✅ DO use these (guaranteed no API calls):**

```bash
npm run build:safe     # Forces FETCH_AIRTABLE_AT_BUILD=false
FETCH_AIRTABLE_AT_BUILD=false npm run build
```

### 3. Development Safety

**For local development:**

```bash
npm run dev            # No API calls, uses cached data
```

**For manual data updates:**

```bash
npm run update-products  # Only when you need fresh data
```

## 🔍 Monitoring API Usage

### Check Current Status

```bash
npm run check-api
```

This will show you:

- Current environment variables
- Last API call timestamp
- Available products count
- Build script configurations

### Expected Output (Safe)

```
📋 Environment Variables:
FETCH_AIRTABLE_AT_BUILD: false
NODE_ENV: NOT SET
AIRTABLE_TOKEN: SET

📊 Cache Information:
Last fetch: 2025-07-20T12:38:30.660Z
Record count: 18
Hours since last fetch: 2.5

📦 Products file: 18 products available
```

## 🚫 Deployment Platform Settings

### Vercel

1. Go to your project settings
2. Navigate to Environment Variables
3. Set `FETCH_AIRTABLE_AT_BUILD=false`
4. **Important**: Set this for ALL environments (Production, Preview, Development)

### Netlify

1. Go to Site settings > Environment variables
2. Add `FETCH_AIRTABLE_AT_BUILD=false`
3. Apply to all contexts

### Other Platforms

Set `FETCH_AIRTABLE_AT_BUILD=false` in your deployment environment variables.

## 🔧 Troubleshooting

### API Limit Reached

1. **Check deployment platform settings** - Most likely cause
2. **Verify environment variables** - Run `npm run check-api`
3. **Check for automatic deployments** - Disable if not needed
4. **Use manual updates** - `npm run update-products` instead of build-time fetching

### Data Not Updating

1. **Check cache timestamps** - Run `npm run check-api`
2. **Verify environment variables** - Ensure they're set correctly
3. **Run manual update** - `npm run update-products`

### Build Failures

1. **Use safe build** - `npm run build:safe`
2. **Check for missing data** - Ensure `data/products.json` exists
3. **Verify cache files** - Check `data/.airtable-cache.json`

## 📋 Checklist

Before any deployment or build:

- [ ] `FETCH_AIRTABLE_AT_BUILD=false` in `.env.local`
- [ ] `FETCH_AIRTABLE_AT_BUILD=false` in deployment platform
- [ ] Use `npm run build:safe` for builds
- [ ] Run `npm run check-api` to verify settings
- [ ] Check cache timestamps (should be recent if data is fresh)

## 🆘 Emergency

If you hit API limits:

1. **Immediate**: Set `FETCH_AIRTABLE_AT_BUILD=false` everywhere
2. **Check**: Run `npm run check-api` to identify the source
3. **Fix**: Update deployment platform settings
4. **Wait**: Airtable limits reset monthly
5. **Prevent**: Follow this guide for future builds

## 📞 Support

If you continue to have issues:

1. Check the cache files in `data/` directory
2. Review deployment platform logs
3. Use `npm run check-api` to diagnose
4. Consider using manual updates only
