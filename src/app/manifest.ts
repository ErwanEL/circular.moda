import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Circular Moda',
    short_name: 'Circular',
    description:
      'Comprá y vendé ropa de segunda mano en Buenos Aires con circular.moda.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#fffdf6',
    theme_color: '#6e9a4f',
    lang: 'es-AR',
    categories: ['shopping', 'lifestyle'],
    icons: [
      {
        src: '/pwa/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/pwa/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
