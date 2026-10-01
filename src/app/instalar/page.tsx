import type { Metadata } from 'next';
import Image from 'next/image';
import { Fragment, type ReactNode } from 'react';
import { InstallPageButton } from './install-page-button';

export const metadata: Metadata = {
  title: 'Instalar Circular Moda en tu celular',
  description:
    'Aprendé a instalar Circular Moda en Android, iPhone o iPad y acceder desde tu pantalla de inicio.',
};

const androidSteps = [
  'Abrí circular.moda en Chrome.',
  'Tocá “Instalar la app” en esta página.',
  'Confirmá la instalación cuando Chrome te lo pida.',
  'Abrí Circular desde el nuevo ícono de tu pantalla de inicio.',
];

const iosSteps = [
  'Abrí circular.moda en Safari. Si estás en Instagram o WhatsApp, elegí abrir el enlace en Safari.',
  'Tocá el botón Compartir o el menú de la página.',
  'Desplazate y elegí “Agregar a Inicio”.',
  'Activá “Abrir como app web” y tocá “Agregar”.',
];

function StepList({
  steps,
  afterStep,
}: {
  steps: string[];
  afterStep?: (index: number) => ReactNode;
}) {
  return (
    <ol className="space-y-4">
      {steps.map((step, index) => (
        <Fragment key={step}>
          <li className="flex gap-4">
            <span className="bg-primary-800 flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-white">
              {index + 1}
            </span>
            <p className="pt-1.5 text-gray-700 dark:text-gray-200">{step}</p>
          </li>
          {afterStep?.(index)}
        </Fragment>
      ))}
    </ol>
  );
}

export default function InstallPage() {
  return (
    <main className="mx-auto max-w-screen-lg px-4 py-12 sm:px-6 lg:py-16">
      <section className="mx-auto max-w-3xl text-center">
        <Image
          src="/pwa/icon-192.png"
          alt="Ícono de Circular Moda"
          width="96"
          height="96"
          className="mx-auto mb-6 h-24 w-24 rounded-3xl shadow-sm"
        />
        <p className="text-primary-800 mb-2 font-semibold">
          Circular en tu celular
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
          Instalá Circular Moda
        </h1>
        <p className="mt-5 text-lg leading-8 text-gray-600 dark:text-gray-300">
          Accedé más rápido al catálogo, publicá tus prendas y usá Circular como
          cualquier otra app, sin descargar nada desde una tienda.
        </p>
        <div className="mt-8 flex justify-center">
          <InstallPageButton />
        </div>
      </section>

      <div className="mt-14 grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100 text-2xl"
              aria-hidden="true"
            >
              🤖
            </span>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Chrome
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Android
              </h2>
            </div>
          </div>
          <StepList steps={androidSteps} />
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-700 dark:bg-gray-900">
          <div className="mb-6 flex items-center gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-2xl"
              aria-hidden="true"
            >
              
            </span>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Safari
              </p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                iPhone y iPad
              </h2>
            </div>
          </div>
          <StepList
            steps={iosSteps}
            afterStep={(index) => {
              if (index === 1) {
                return (
                  <Image
                    src="/pwa/tutorial/ios-share-button.png"
                    alt="Botón Compartir de Safari señalado para instalar Circular Moda"
                    width={2170}
                    height={725}
                    className="mt-2 w-full rounded-2xl border border-gray-200 shadow-sm"
                  />
                );
              }

              if (index === 2) {
                return (
                  <Image
                    src="/pwa/tutorial/ios-add-to-home-screen.png"
                    alt="Opción Agregar a pantalla de inicio resaltada en el menú del iPhone"
                    width={956}
                    height={1646}
                    className="mx-auto mt-2 w-full max-w-sm rounded-2xl border border-gray-200 shadow-sm"
                  />
                );
              }

              return null;
            }}
          />
        </section>
      </div>

      <section className="bg-light mt-8 rounded-3xl p-6 sm:p-8 dark:bg-gray-800">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          ¿Qué cambia al instalarla?
        </h2>
        <ul className="mt-4 grid gap-3 text-gray-700 sm:grid-cols-3 dark:text-gray-200">
          <li>✓ Ícono en tu pantalla de inicio</li>
          <li>✓ Apertura en una ventana propia</li>
          <li>✓ Las actualizaciones llegan automáticamente</li>
        </ul>
      </section>
    </main>
  );
}
