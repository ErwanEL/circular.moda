import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

import Header from './ui/header';
import Footer from './ui/footer';
import WhatsappFloat from './ui/whatsapp-float';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Vende tu ropa usada fácil y rápido | circular.moda Argentina',
  description:
    'Vendé tu ropa usada fácil y rápido con circular.moda.. Enviás fotos por WhatsApp y ganás dinero sin comisiones.',
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="icon"
          href="./../../icon.png"
          type="image/x-icon"
          sizes="32x32"
        />
        {/* Open Graph / Facebook */}
        <meta
          property="og:title"
          content="Vende tu ropa usada fácil y rápido | circular.moda Argentina"
        />
        <meta
          property="og:description"
          content="Vendé tu ropa usada fácil y rápido con circular.moda.. Enviás fotos por WhatsApp y ganás dinero sin comisiones."
        />
        <meta property="og:image" content="./../../og-image.png" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_AR" />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Vende tu ropa usada fácil y rápido | circular.moda Argentina"
        />
        <meta
          name="twitter:description"
          content="Vendé tu ropa usada fácil y rápido con circular.moda.. Enviás fotos por WhatsApp y ganás dinero sin comisiones."
        />
        <meta name="twitter:image" content="./../../og-image.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        {children}
        <WhatsappFloat />
        <Footer />
        <Script src="https://cdn.jsdelivr.net/npm/flowbite@3.1.2/dist/flowbite.min.js"></Script>
      </body>
    </html>
  );
}
