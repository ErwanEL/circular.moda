import Hero from './ui/hero';
import Cta from './ui/cta';
import Features from './ui/features';
import VenderFacil from './ui/vender-facil';
import { getAllProducts } from './lib/products';
import ResponsiveCards from './ui/ResponsiveCards';
import SocialShare from './ui/social-share';
import LeadMagnet from './ui/lead-magnet';
import { signupUrl } from './lib/helpers';
import InstagramFollowBanner from './ui/instagram-follow-banner';

export default async function Home() {
  const products = await getAllProducts();

  return (
    <main>
      <Hero />
      <VenderFacil
        cta={{
          text: 'Empieza a vender',
          link: signupUrl('/me/product/add'),
        }}
      />
      <Features />
      <div className="mx-auto max-w-screen-xl px-4 py-4 lg:px-6">
        <InstagramFollowBanner />
      </div>
      <ResponsiveCards products={products} />
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
            link: signupUrl('/me/product/add'),
          },
        }}
      />
    </main>
  );
}
