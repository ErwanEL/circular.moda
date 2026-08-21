import React from 'react';
import NewsletterSubscribeForm from './newsletter-subscribe-form';

export default function LeadMagnet() {
  return (
    <section>
      <div className="mx-auto max-w-screen-md px-2 py-8 text-center sm:px-4 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Recibí las mejores oportunidades y novedades
          </h2>
          <p className="font-light text-gray-500 md:text-lg dark:text-gray-400">
            Suscribite para enterarte antes que nadie de nuevas prendas,
            descuentos y tips para vender más rápido.
          </p>
        </div>
        <NewsletterSubscribeForm />
      </div>
    </section>
  );
}
