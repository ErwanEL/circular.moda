import HeroImage from '../../../public/woman-in-red.png';
import Button from './button'; // Import your custom Button component
import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  heading?: string;
  description?: string;
}

export default function Hero({
  heading = 'Tu armario está lleno de ropa que no usás',
  description = 'Vendé tu ropa por WhatsApp, liberá espacio y quedate con el 100 % de la plata para renovar tu armario',
}: HeroProps) {
  const content = {
    heading,
    description,
    primaryButton: {
      text: 'Vender ya',
      href: `https://wa.me/5491125115030?text=Hola%20quiero%20publicar%20una%20prenda%20en%20circular.moda`,
    },
    secondaryButton: {
      text: 'Cómo funciona',
      href: '/como-funciona',
    },
    image: {
      src: HeroImage,
      alt: 'Dos mujeres sonrientes probándose ropa de moda circular en una habitación luminosa.',
    },
  };

  return (
    <section>
      <div className="mx-auto grid h-auto max-w-screen-xl px-4 py-8 lg:h-[500px] lg:grid-cols-12 lg:gap-8 lg:py-16 xl:gap-0">
        {/* Mobile Image */}
        <div className="mb-8 flex justify-center lg:hidden">
          <div className="relative h-56 w-full max-w-xs">
            <Image
              fill={true}
              src={content.image.src}
              alt={content.image.alt}
              className="rounded-3xl"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="mb-4 max-w-2xl text-4xl leading-none font-extrabold tracking-tight md:text-5xl xl:text-6xl dark:text-white">
            {content.heading}
          </h1>
          <p className="mb-6 max-w-2xl font-light text-gray-900 md:text-lg lg:mb-8 lg:text-xl dark:text-gray-400">
            {content.description}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              size="xl"
              href={content.primaryButton.href}
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
              solid
              bold
            >
              {content.primaryButton.text}
              <svg
                className="-mr-1 ml-2 h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </Button>
          </div>
          {/* 0 Comisión Badge - After Button */}
          <div className="mt-4 flex justify-center gap-2 sm:justify-start">
            <div className="bg-primary-100 text-primary-800 border-primary-200 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold">
              <svg
                className="mr-1.5 h-3 w-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Sin comisiones</span>
            </div>
            <div className="bg-primary-100 text-primary-800 border-primary-200 inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-bold">
              <div className="text-primary-800 flex items-center px-2 py-0.5 text-xs font-bold">
                <svg
                  className="mr-1.5 h-3 w-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2C6.686 2 4 4.686 4 8c0 4.418 5.293 9.293 5.512 9.488a1 1 0 001.336 0C10.707 17.293 16 12.418 16 8c0-3.314-2.686-6-6-6zm0 2a4 4 0 110 8 4 4 0 010-8zm0 2a2 2 0 100 4 2 2 0 000-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Solo CABA
              </div>
            </div>
          </div>
        </div>
        {/* Desktop Image */}
        <div className="hidden lg:col-span-5 lg:mt-0 lg:flex">
          <div className="h-xl relative w-xl">
            <Image
              fill={true}
              src={content.image.src}
              // sizes="300px"
              alt={content.image.alt}
              className="rounded-3xl"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
