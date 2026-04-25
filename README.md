# MODACIRCULAR

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Supabase magic-link login (mobile/iOS)

If magic-link login works on desktop but fails on iPhone (e.g. you click the email link and end up on `/` not logged in), the most common causes are:

- **Email click-tracking rewrites the link** (Brevo/Sendinblue, etc.), which can drop Supabase parameters or consume the one-time token during redirects.
- **Redirect URL allow-list mismatch** (e.g. `www.` vs non-`www`, preview domain, etc.).

### Required settings

- **Disable click-tracking for transactional/auth emails** in your email provider (Brevo/Sendinblue).
  - The final URL you open should be your site (e.g. `https://circular.moda/auth/confirm?...`), not a tracking domain (e.g. `sendibt3.com`).
- **Supabase Dashboard → Authentication → URL Configuration**
  - **Site URL**: choose a single canonical domain (with or without `www`) and use it consistently.
  - **Redirect URLs**: include every variant you might send users to, at minimum:
    - `https://circular.moda/auth/confirm`
    - `https://www.circular.moda/auth/confirm`

### Repo behavior

- Login email links are generated in `src/app/ui/login-form.tsx` via `supabase.auth.signInWithOtp({ options: { emailRedirectTo } })`.
- Magic-link confirmation is handled by `src/app/auth/confirm/route.ts` and supports both:
  - `token_hash` (+ `type`) via `verifyOtp`
  - `code` via `exchangeCodeForSession`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
