import Hero from './ui/hero';
import Cta from './ui/cta';
import Features from './ui/features';
import Cards from './ui/cards';
import { getAllProducts } from './lib/products';
import { getFeaturedProducts } from './lib/helpers';
import VenderFacil from './ui/vender-facil';

export default async function Home() {
  try {
    const products = await getAllProducts(); // runs at build time, then every 60 s

    // Get featured products using helper function
    const productCards = getFeaturedProducts(products, 8);

    return (
      <main>
        <Hero />
        <Features />
        <VenderFacil
          cta={{
            text: 'Empieza a vender',
            href: 'https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda',
          }}
        />
        <Cards products={productCards} />
        <Cta
          variant="centered"
          content={{
            heading:
              'Transformá tu placard en efectivo antes de que pase otro mes',
            description:
              'Mandanos tus fotos y nuestro equipo se encarga del resto. Sin comisiones, sin complicaciones.',
            button: {
              text: 'Vender ahora',
              href: 'https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda',
            },
          }}
        />
      </main>
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error('Error loading products:', errorMessage);

    // Fallback to static content if products fail to load
    return (
      <main>
        <Hero />
        <Features />
        <Cta />
        <Cards />
        <Cta
          variant="centered"
          content={{
            heading:
              'Transformá tu placard en efectivo antes de que pase otro mes',
            description:
              'Mandanos tus fotos y nuestro equipo se encarga del resto. Sin comisiones, sin complicaciones.',
            button: {
              text: 'Vender ahora',
              href: 'https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda',
            },
          }}
        />
      </main>
    );
  }
}
