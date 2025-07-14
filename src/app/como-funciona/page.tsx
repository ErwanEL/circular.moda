import Hero from '../ui/hero';

const venderFacilSteps = [
  {
    img: 'step1.png',
    title: 'Mandá tus fotos por WhatsApp',
    desc: 'Sacales unas buenas fotos a tus prendas, indicá el precio que querés cobrar y mandalas por WhatsApp. Nosotros nos encargamos de todo lo demás.',
  },
  {
    img: 'step2.png',
    title: 'Publicamos tu artículo en el catálogo',
    desc: 'Subimos tu prenda a circular.moda con precio y descripción clara para que la vea toda nuestra comunidad.',
  },
  {
    img: 'step3.png',
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
      />
      {/* Vender es fácil section */}
      <section className="bg-white w-full py-16">
        <div className="max-w-screen-xl mx-auto px-4">
          <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-12">
            Vender es fácil
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
            {venderFacilSteps.map((step, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="w-full max-w-xs aspect-square mb-6 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow">
                  <img
                    src={step.img}
                    alt={step.title}
                    className="w-full h-full object-cover object-center"
                  />
                </div>
                <h3 className="text-gray-700 text-xl font-bold mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-700 mb-3">{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center">
            <a
              href="#"
              className="px-8 py-2 border-2 border-primary-700 text-primary-700 font-semibold rounded-lg hover:bg-primary-50 transition"
            >
              Empieza a vender
            </a>
          </div>
        </div>
      </section>

      {/* ¿Te animás? section */}
      <section className="relative bg-[#999999] w-full py-28 flex flex-col items-center justify-center overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <h2 className="text-white text-3xl md:text-5xl font-bold mb-10 text-center">
            ¿Te animás?
          </h2>
          <div className="flex flex-col md:flex-row gap-4">
            <a
              href="#"
              className="px-8 py-3 border-2 border-white text-white text-lg font-medium rounded-lg hover:bg-white hover:text-[#158b91] transition text-center"
            >
              Empieza a comprar
            </a>
            <a
              href="#"
              className="px-8 py-3 border-2 border-white text-[#158b91] bg-white text-lg font-medium rounded-lg hover:bg-[#e6f7f7] transition text-center"
            >
              Empieza a vender
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
