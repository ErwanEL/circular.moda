import Hero from '../ui/hero';
import Cta from '../ui/cta';
import VenderFacil from '../ui/vender-facil';

export default function ComoFuncionaPage() {
  return (
    <>
      <Hero
        heading={'Te vas a enamorar de la moda de segunda mano'}
        description={
          'Una comunidad, miles de prendas y la moda de segunda mano con toda la onda. ¿Listo para arrancar? Así funciona.'
        }
        showSecondaryButton={false}
      />
      <VenderFacil cta={{ text: 'Empieza a vender', href: '#' }} />
      <Cta
        variant="centered"
        content={{
          heading: '¿Te animás?',
          description:
            'Mandanos tus fotos y nuestro equipo se encarga del resto. Sin comisiones, sin complicaciones.',
          button: {
            text: 'Empieza a vender',
            href: '#',
          },
        }}
      />
    </>
  );
}
