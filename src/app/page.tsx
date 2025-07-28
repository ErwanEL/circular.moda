import Hero from './ui/hero';
import Cta from './ui/cta';
import Features from './ui/features';
import VenderFacil from './ui/vender-facil';
import { getAllProducts } from './lib/products';
import ResponsiveCards from './ui/ResponsiveCards';
import SocialShare from './ui/social-share';
import LeadMagnet from './ui/lead-magnet';

export default async function Home() {
  const products = await getAllProducts();

  return (
    <main>
      <Hero />
      <Features />
      <ResponsiveCards products={products} />
      <VenderFacil
        cta={{
          text: 'Empieza a vender',
          href: 'https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda',
        }}
      />
      <LeadMagnet />
      <SocialShare />
      <Cta
        variant="centered"
        content={{
          heading: 'Vaciá tu armario sin perder más tiempo',
          description:
            'Mandá tus fotos, deshacete de lo que no usás y hacé lugar para ropa nueva',
          button: {
            text: 'Vacío mi armario',
            href: 'https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda',
          },
        }}
      />
    </main>
  );
}
