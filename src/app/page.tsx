import Hero from './ui/hero';
import Cta from './ui/cta';
import Features from './ui/features';
import Cards from './ui/cards';

export default function Home() {
  return (
    <main className="">
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
            href: '#',
          },
        }}
      />
    </main>
  );
}
