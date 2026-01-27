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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://circular.moda';

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
