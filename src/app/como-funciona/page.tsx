import Hero from '../ui/hero';
import Cta from '../ui/cta';
import VenderFacil from '../ui/vender-facil';

const venderFacilSteps = [
  {
    img: '/step1.png',
    title: 'Mandá tus fotos por WhatsApp',
    desc: 'Sacales unas buenas fotos a tus prendas, indicá el precio que querés cobrar y mandalas por WhatsApp. Nosotros nos encargamos de todo lo demás.',
  },
  {
    img: '/step2.png',
    title: 'Publicamos tu artículo en el catálogo',
    desc: 'Subimos tu prenda a circular.moda con precio y descripción clara para que la vea toda nuestra comunidad.',
  },
  {
    img: '/step3.png',
    title: 'Te contactan directo por WhatsApp',
    desc: 'Cuando alguien se cope con tu artículo, te escribe al toque por WhatsApp para cerrar la venta. Sin comisiones: lo que ganás es tuyo.',
  },
];

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
      <VenderFacil
        steps={venderFacilSteps}
        cta={{ text: 'Empieza a vender', href: '#' }}
      />
      <Cta
          variant="centered"
          content={{
            heading:
              '¿Te animás?',
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
