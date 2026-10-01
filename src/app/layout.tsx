import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import { GoogleTagManager } from '@next/third-parties/google';

import './globals.css';

import Header from './ui/header';
import Footer from './ui/footer';
import WhatsappFloat from './ui/whatsapp-float';
import { PwaInstallProvider } from './ui/pwa-install-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  applicationName: 'Circular Moda',
  title: 'Vende tu ropa usada en Buenos Aires fácil y rápido | circular.moda',
  description:
    'Vendé tu ropa usada fácil y rápido con circular.moda en Buenos Aires. Enviás fotos por WhatsApp y ganás dinero sin comisiones. Solo CABA y GBA.',
  openGraph: {
    title: 'Vende tu ropa usada en Buenos Aires fácil y rápido | circular.moda',
    description:
      'Circular.moda • Mercado de ropa de segunda mano para Buenos Aires',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Circular',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#6e9a4f',
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
        <PwaInstallProvider>
          <Header />
          {children}
          <WhatsappFloat />
          {/* <Popup /> */}
          <Footer />
        </PwaInstallProvider>
        <Script src="https://cdn.jsdelivr.net/npm/flowbite@3.1.2/dist/flowbite.min.js"></Script>
        {process.env.NODE_ENV === 'production' && (
          <GoogleTagManager gtmId="GTM-P8TK9FBN" />
        )}
      </body>
    </html>
  );
}
