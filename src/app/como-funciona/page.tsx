import Hero from '../ui/hero';
import Cta from '../ui/cta';
import VenderFacil from '../ui/vender-facil';
import { signupUrl } from '../lib/helpers';

export default function ComoFuncionaPage() {
  return (
    <>
      <Hero
        heading={'Te vas a enamorar de la moda de segunda mano'}
        description={
          'Una comunidad, miles de prendas y la moda de segunda mano con toda la onda. ¿Listo para arrancar? Así funciona.'
        }
      />
      <VenderFacil
        cta={{
          text: 'Empieza a vender',
          link: signupUrl('/me/product/add'),
        }}
      />
      <Cta
        variant="centered"
        content={{
          heading: 'Te animás?',
          description:
            'Manda tus fotos y cobra sin comisiones, sin complicaciones.',
          button: {
            text: 'Empieza a vender',
            link: signupUrl('/me/product/add'),
          },
        }}
      />
    </>
  );
}
