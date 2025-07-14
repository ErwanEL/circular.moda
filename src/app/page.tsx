import Hero from './ui/hero';
import Cta from './ui/cta';
import Features from './ui/features';
import Cards from './ui/cards';
import { getAllProducts } from './lib/airtable';
import { getFeaturedProducts } from './lib/helpers';
import VenderFacil from './ui/vender-facil';

// Incremental Static Regeneration, rebuild every 60 s
export const revalidate = 60;

export default async function Home() {
  try {
    const products = await getAllProducts(); // runs at build time, then every 60 s

    // Get featured products using helper function
    const productCards = getFeaturedProducts(products, 8);

    return (
      <main className="">
        <Hero />
        <Features />
        <VenderFacil
          cta={{ text: 'Empieza a vender', href: '#' }}
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
              href: '#',
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
      <main className="">
        <Hero />
        <Features />
        <Cta  />
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
              href: '#',
            },
          }}
        />
      </main>
    );
  }
}
