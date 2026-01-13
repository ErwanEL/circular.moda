# Development Airtable Setup

This guide shows how to fetch products from Airtable in development mode.

## Quick Setup

### 1. Create Environment File

Create a `.env.local` file in your project root:

```bash
# Airtable Configuration
AIRTABLE_TOKEN=your_airtable_personal_access_token_here
AIRTABLE_BASE_ID=your_base_id_here
AIRTABLE_TABLE_NAME=your_table_name_here

# Enable Airtable fetching in development
ENABLE_AIRTABLE_IN_DEV=true
```

### 2. Get Your Airtable Credentials

1. **Personal Access Token**: Go to [Airtable Account Settings](https://airtable.com/account) → Personal Access Tokens → Create new token
2. **Base ID**: Found in your Airtable base URL: `https://airtable.com/appXXXXXXXXXXXXXX/...` (the part after `/app`)
3. **Table Name**: The name of your table (case-sensitive)

### 3. Fetch Products

```bash
npm run fetch-dev
```

This will:

- Fetch all products from your Airtable base
- Save them to `data/products.json`
- Update your development data

## How It Works

- The script reads your Airtable credentials from `.env.local`
- Fetches all records from your specified table
- Transforms the data to match your product schema
- Saves it to `data/products.json` for your app to use

## Safety Features

- Only works when `ENABLE_AIRTABLE_IN_DEV=true` is set
- Validates all required environment variables
- Provides clear error messages if something is missing

## Usage in Development

1. Set up your `.env.local` file with Airtable credentials
2. Run `npm run fetch-dev` to get fresh data
3. Your app will automatically use the updated `data/products.json` file
4. Run `npm run dev` to start your development server

That's it! Your development environment can now fetch fresh product data from Airtable.
