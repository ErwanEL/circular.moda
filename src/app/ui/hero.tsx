import HeroImage from '../../../public/roommates-fashion-fun_simple_compose.png';
import Button from './button'; // Import your custom Button component
import Link from 'next/link';
import Image from 'next/image';

interface HeroProps {
  heading?: string;
  description?: string;
  showSecondaryButton?: boolean;
}

export default function Hero({
  heading = 'Transformá tu ropa en dinero. Fácil, rápido y circular.',
  description = 'Esa prenda que ya no usás puede tener una segunda vida… y darte ingresos extra hoy mismo. Enviás tus fotos, nosotros hacemos el resto.',
  showSecondaryButton = true,
}: HeroProps) {
  const content = {
    heading,
    description,
    primaryButton: {
      text: 'Quiero vender ya',
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
      <div className="mx-auto grid max-w-screen-xl px-4 py-8 lg:grid-cols-12 lg:gap-8 lg:py-16 xl:gap-0">
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="mb-4 max-w-2xl text-4xl leading-none font-extrabold tracking-tight md:text-5xl xl:text-6xl dark:text-white">
            {content.heading}
          </h1>
          <p className="mb-6 max-w-2xl font-light text-gray-500 md:text-lg lg:mb-8 lg:text-xl dark:text-gray-400">
            {content.description}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button
              as={Link}
              size="lg"
              href={content.primaryButton.href}
              variant="primary"
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
            {showSecondaryButton && (
              <Button
                as={Link}
                size="lg"
                href={content.secondaryButton.href}
                variant="secondary"
              >
                {content.secondaryButton.text}
              </Button>
            )}
          </div>
        </div>
        <div className="hidden lg:col-span-5 lg:mt-0 lg:flex">
          <div className="h-xl relative w-xl">
            <Image
              fill={true}
              objectFit={'cover'}
              src={content.image.src}
              // sizes="300px"
              alt={content.image.alt}
              className="rounded-3xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
