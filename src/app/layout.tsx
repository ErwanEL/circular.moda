import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { GoogleTagManager } from '@next/third-parties/google';

import './globals.css';

import Header from './ui/header';
import Footer from './ui/footer';
import WhatsappFloat from './ui/whatsapp-float';
import Popup from './ui/popup';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/**
 * Get the site URL dynamically based on environment:
 * - Production: Use NEXT_PUBLIC_SITE_URL or fallback to circular.moda
 * - Preview/Dev on Vercel: Use VERCEL_URL for correct OG image URLs
 * - Local dev: Use localhost
 */
function getSiteUrl(): string {
  // On Vercel preview/dev deployments, use the deployment URL
  // (so OG images point to the preview URL, not production)
  if (process.env.VERCEL_ENV !== 'production' && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Production: use configured URL (remove trailing slash if present)
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  // Fallback for local dev
  return 'http://localhost:3000';
}

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Vende tu ropa usada en Buenos Aires fácil y rápido | circular.moda',
  description:
    'Vendé tu ropa usada fácil y rápido con circular.moda en Buenos Aires. Enviás fotos por WhatsApp y ganás dinero sin comisiones. Solo CABA y GBA.',
  openGraph: {
    title: 'Vende tu ropa usada en Buenos Aires fácil y rápido | circular.moda',
    description:
      'Circular.moda • Mercado de ropa de segunda mano para Buenos Aires',
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-AR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
        <WhatsappFloat />
        <Popup />
        <Footer />
        <Script src="https://cdn.jsdelivr.net/npm/flowbite@3.1.2/dist/flowbite.min.js"></Script>
        {process.env.NODE_ENV === 'production' && (
          <GoogleTagManager gtmId="GTM-P8TK9FBN" />
        )}
      </body>
    </html>
  );
}
