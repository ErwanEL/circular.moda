# Catalogue Newsletter

This document covers the catalogue newsletter system used on `circular.moda`:

- the lead magnet on `/products`
- subscription sync to Brevo list `3`
- the rolling monthly automation
- the immediate test-send route used to preview the email template

## Overview

The newsletter flow is app-managed:

- Brevo stores contacts and sends emails
- Supabase stores newsletter subscription state
- Next.js route handlers build the HTML email and orchestrate sends
- Vercel Cron triggers the monthly sender every day

This is not a Brevo visual automation. The app decides who is due, fetches products from Supabase, renders the email HTML, and sends it through Brevo transactional email.

## Main Files

- Lead magnet UI:
  - `src/app/ui/catalogue-newsletter-card.tsx`
  - inline card in the catalogue grid, no modal/popup
  - current short CTA copy: `Recibí las novedades del catálogo`
- Subscribe route:
  - `src/app/api/catalogue-subscribe/route.ts`
- Immediate test-send route:
  - `src/app/api/catalogue-test-send/route.ts`
- Daily cron sender:
  - `src/app/api/cron/send-catalogue/route.ts`
- Brevo webhook sync:
  - `src/app/api/webhooks/brevo-transactional/route.ts`
- Unsubscribe page:
  - `src/app/newsletter/unsubscribe/page.tsx`
- Shared newsletter helpers and HTML renderer:
  - `src/app/lib/catalogue-newsletter.ts`
- SQL schema:
  - `docs/sql/catalogue-newsletter.sql`
- Vercel cron schedule:
  - `vercel.json`

## Environment Variables

Required for Preview and Production:

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEWSLETTER_TOKEN_SECRET`

Required for the live automation:

- `CRON_SECRET`

Optional overrides:

- `BREVO_CATALOGUE_LIST_ID`
  - defaults to `3`
- `BREVO_DAILY_SEND_CAP`
  - defaults to `250`
- `NEXT_PUBLIC_SITE_URL`
  - recommended in production for stable absolute URLs
- `NEWSLETTER_TEST_SECRET`
  - recommended for the manual test-send route
  - if missing, the test route falls back to `CRON_SECRET`

## Database Setup

Run the SQL file below in Supabase SQL Editor:

- `docs/sql/catalogue-newsletter.sql`

It creates:

- `catalogue_subscriptions`
- `catalogue_delivery_cycles`

Recommended when Supabase prompts for table security:

- enable RLS on these tables

The server routes use `SUPABASE_SERVICE_ROLE_KEY`, so they can still read and write these tables with RLS enabled.

## Brevo Configuration

- Catalogue list ID: `3`
- Contacts are added through the server route, not directly from the browser
- Transactional sends are used for the monthly email and the manual test email

Make sure `BREVO_SENDER_EMAIL` is a sender address accepted by your Brevo account.

## How Subscription Works

When a user subscribes from the catalogue card:

1. The user enters an email directly in the inline catalogue card.
2. The UI keeps the copy, input, and submit button inside the image area so the
   card stays close to the product-card height.
3. The client calls `POST /api/catalogue-subscribe`.
4. The route validates and normalizes the email.
5. The route upserts the contact into Brevo list `3`.
6. The route upserts a local row into `catalogue_subscriptions`.
7. `next_send_at` is set to the same calendar day next month in `America/Argentina/Buenos_Aires`.

If the email is already actively subscribed:

- the subscription stays active
- the existing schedule is preserved

If the local database write fails after the Brevo contact is added:

- the route attempts to unlink the contact from the Brevo list again

## How the Monthly Automation Works

The cron route is:

- `GET /api/cron/send-catalogue`

It is scheduled in `vercel.json`:

- every day at `13:00 UTC`

Current flow:

1. Verify `Authorization: Bearer ${CRON_SECRET}`
2. Reset stale `processing` rows
3. Claim due subscriptions from `catalogue_subscriptions`
4. For each claimed subscription:
   - fetch products created after `last_window_end_at` or `subscribed_at`
   - if no new products are found, fall back to latest catalogue picks
   - render the HTML email
   - send through Brevo transactional email
   - record a row in `catalogue_delivery_cycles`
   - move the subscriber to the next monthly cycle

Default send cap:

- `250` emails per day

This cap exists to stay below Brevo Free limits and to spread sends over time.

## Email Template

The HTML template is rendered in code, not stored in Brevo:

- `renderCatalogueEmail(...)` in `src/app/lib/catalogue-newsletter.ts`

Important details:

- product links use the same slug-building logic as the catalogue
- the footer CTA points to:
  - `https://www.circular.moda/products`
- unsubscribe links are signed and point back to:
  - `/newsletter/unsubscribe`

## Unsubscribe Flow

Every email includes a signed unsubscribe link built from:

- `buildUnsubscribeUrl(...)`
- `createUnsubscribeToken(...)`

When a user clicks unsubscribe:

1. `src/app/newsletter/unsubscribe/page.tsx` validates the signed token
2. The matching `catalogue_subscriptions` row is updated to `unsubscribed`
3. The contact is unlinked from Brevo list `3`

## Brevo Webhook Flow

Webhook route:

- `POST /api/webhooks/brevo-transactional`

Handled events:

- delivered
- unsubscribed
- blocked
- hard bounce / spam-like blocked events
- error / invalid

The webhook updates:

- `catalogue_delivery_cycles`
- `catalogue_subscriptions`

## Manual Test Send

The test route sends the current newsletter template immediately to one email address.

Route:

- `GET /api/catalogue-test-send`
- `POST /api/catalogue-test-send`

What it is for:

- previewing the live email HTML
- checking product layout and image rendering
- iterating on template design without waiting for the monthly cron

What it uses:

- the same HTML renderer as the monthly production sender
- the latest products from Supabase
- Brevo transactional send

What is different from production:

- the default test subject is:
  - `Prueba template newsletter circular.moda`
- the intro copy is test-specific

The email structure and product card rendering are otherwise shared with production.

### Required Variables For Test Send

- `BREVO_API_KEY`
- `BREVO_SENDER_EMAIL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEWSLETTER_TOKEN_SECRET`
- `NEWSLETTER_TEST_SECRET`

If `NEWSLETTER_TEST_SECRET` is not configured, the test route will accept `CRON_SECRET` instead.

### GET Example

```text
https://<deployment-domain>/api/catalogue-test-send?email=you@example.com&secret=YOUR_SECRET
```

Optional custom subject:

```text
https://<deployment-domain>/api/catalogue-test-send?email=you@example.com&secret=YOUR_SECRET&subject=Mi%20prueba
```

Example with local development:

```text
http://localhost:3000/api/catalogue-test-send?email=you@example.com&secret=YOUR_SECRET
```

### POST Example

```bash
curl -X POST https://<deployment-domain>/api/catalogue-test-send \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "secret": "YOUR_SECRET",
    "subject": "Mi prueba"
  }'
```

### Successful Response

```json
{
  "ok": true,
  "sentTo": "you@example.com",
  "productCount": 8,
  "messageId": "..."
}
```

### Common Test Route Errors

`Unauthorized`

- `NEWSLETTER_TEST_SECRET` is missing in that environment
- the provided `secret` does not match
- the deployment was not rebuilt after changing the env var

`NEWSLETTER_TOKEN_SECRET is not configured.`

- the unsubscribe token secret is missing

`BREVO_SENDER_EMAIL is not configured.`

- the sender email is missing from the deployment environment

`Could not find the table 'public.catalogue_subscriptions' in the schema cache`

- the SQL setup file was not run in Supabase yet

`No products available to build the test newsletter.`

- the `products` table is empty or the selected rows cannot be mapped to newsletter products

## Troubleshooting

If subscription fails with the generic message:

- check Vercel logs for `/api/catalogue-subscribe`
- verify Preview or Production has all required env vars
- verify `docs/sql/catalogue-newsletter.sql` has been executed

If the test route returns `404`:

- the deployment does not include `src/app/api/catalogue-test-send/route.ts`
- use the latest preview or production deployment URL

If the test route returns a structured JSON error:

- the route exists and the secret check passed
- the error message should point to the exact missing env var or Supabase/Brevo failure

## Production Checklist

Before relying on the monthly automation in production:

1. Run `docs/sql/catalogue-newsletter.sql` in Supabase
2. Set all required environment variables in Production
3. Confirm `BREVO_SENDER_EMAIL` is valid in Brevo
4. Confirm `CRON_SECRET` is set in Vercel
5. Confirm `NEWSLETTER_TOKEN_SECRET` is set
6. Confirm the Brevo webhook points to `/api/webhooks/brevo-transactional`
7. Send one manual test email through `/api/catalogue-test-send`
