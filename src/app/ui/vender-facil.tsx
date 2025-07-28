import React from 'react';
import Button from './button';
import Image from 'next/image';

export type VenderFacilStep = {
  img: string;
  title: string;
  desc: string;
};

export type VenderFacilProps = {
  cta?: {
    text: string;
    href: string;
  };
};

const venderFacilSteps = [
  {
    img: '/step1.webp',
    title: 'Mandá tus fotos por WhatsApp',
    desc: 'Sacales unas fotos de tus prendas, indicá el precio que querés cobrar y mandalas por WhatsApp.',
  },
  {
    img: '/step2.webp',
    title: 'Se publica al instante en el catálogo.',
    desc: 'Se publica al instante tu prenda a circular.moda con precio y descripción clara para que la vea todos los visitantes.',
  },
  {
    img: '/step3.webp',
    title: 'Vendé directo, sin comisiones',
    desc: 'Alguien se cope con tu ropa? Te escribe al toque por WhatsApp para cerrar la venta. Sin comisiones: lo que cobras es tuyo.',
  },
];

export default function VenderFacil({ cta }: VenderFacilProps) {
  return (
    <section>
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-16 lg:px-6">
        <div className="mb-8 max-w-screen-md lg:mb-16">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Vender es fácil
          </h2>
        </div>
        <div className="mb-10 grid grid-cols-1 gap-10 md:grid-cols-3">
          {venderFacilSteps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="mb-6 flex aspect-square w-full max-w-xs items-center justify-center overflow-hidden rounded-lg bg-gray-100 shadow">
                <Image
                  src={step.img}
                  alt={step.title}
                  width={300}
                  height={300}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                {step.title}
              </h3>
              <p className="mb-3 text-gray-500 dark:text-gray-400">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
        {cta && (
          <div className="flex justify-center">
            <Button href={cta.href} variant="primary" size="xl">
              {cta.text}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
