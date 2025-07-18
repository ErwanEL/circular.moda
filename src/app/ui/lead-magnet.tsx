import React from 'react';

export default function LeadMagnet() {
  return (
    <section>
      <div className="mx-auto max-w-screen-md px-2 py-8 text-center sm:px-4 lg:py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            ¡Recibí las mejores oportunidades y novedades!
          </h2>
          <p className="font-light text-gray-500 md:text-lg dark:text-gray-400">
            Suscribite para enterarte antes que nadie de nuevas prendas,
            descuentos y tips para vender más rápido.
          </p>
        </div>
        <div className="flex h-[250px] justify-center sm:h-[200px]">
          <iframe
            width="540"
            height="305"
            src="https://e7b4fa4e.sibforms.com/serve/MUIFAFp26SAaAgfK2vdo0gwbOhCItlRHsvatFXKJ3SQ558IKSN09A1BLhS28I9hNBynInQCmnQHKp-eMjeF0UFTqwWFeMavr1D6Fd7EtocWjvECxRNotxnnwcdE-Ch8vQdf8LPih_ODWG0J6sUEOPa2DI38FJlKMAT3eWrVjlxwow3WFh2X2oaAEAB0FKt3hsbWRA_Q5nqb3gYEv"
            frameBorder="0"
            scrolling="auto"
            allowFullScreen
            style={{
              display: 'block',
              marginLeft: 'auto',
              marginRight: 'auto',
              maxWidth: '100%',
              borderRadius: '0.5rem',
              outline: 'none',
              overflow: 'hidden',
              padding: '0px',
              margin: '0px',
            }}
            title="Suscripción novedades"
          ></iframe>
        </div>
      </div>
    </section>
  );
}
