import React from 'react';
import Button from './button';
import Image from 'next/image';

export type VenderFacilStep = {
  img: string;
  title: string;
  desc: string;
};

export type VenderFacilProps = {
  steps: VenderFacilStep[];
  cta?: {
    text: string;
    href: string;
  };
  className?: string;
};

export default function VenderFacil({ steps, cta, className = '' }: VenderFacilProps) {
  return (
    <section className={`w-full py-16 ${className}`}>
      <div className="max-w-screen-xl mx-auto px-4">
        <h2 className="text-gray-900 text-2xl md:text-3xl font-bold mb-12">
          Vender es fácil
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-10">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className="w-full max-w-xs aspect-square mb-6 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shadow">
                <Image
                  src={step.img}
                  alt={step.title}
                  width={300}
                  height={300}
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
        {cta && (
          <div className="flex justify-center">
            <Button href={cta.href} variant="primary">
              {cta.text}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
} 