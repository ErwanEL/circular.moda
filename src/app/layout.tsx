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
    <html lang="es-AR">
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
