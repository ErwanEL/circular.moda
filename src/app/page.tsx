import Hero from './ui/hero';
import Cta from './ui/cta';
import Features from './ui/features';
import VenderFacil from './ui/vender-facil';
import { getAllProducts } from './lib/products';
import ResponsiveCards from './ui/ResponsiveCards';
import SocialShare from './ui/social-share';
import LeadMagnet from './ui/lead-magnet';

export default async function Home() {
  try {
    const products = await getAllProducts();

    return (
      <main>
        <Hero />
        <Features />
        <ResponsiveCards products={products} />
        <LeadMagnet />
        <VenderFacil
          cta={{
            text: 'Empieza a vender',
            href: 'https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda',
          }}
        />
        <SocialShare />
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

    return (
      <main>
        <Hero />
        <Features />
        <ResponsiveCards products={[]} />
        <LeadMagnet />
        <Cta />
        <SocialShare />
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
