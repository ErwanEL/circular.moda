import Image from 'next/image';
import PhoneMockup from '../../../public/phone-mockup.png';
import { Button } from 'flowbite-react';
import Link from 'next/link';

const content = {
  heading: 'Convierte tu placard en efectivo hoy mismo',
  description:
    'Ese jean que no usás es un billete de $10.000 ARS durmiendo en tu placard.',
  primaryButton: {
    text: 'Quiero vender ya',
    href: '#',
  },
  secondaryButton: {
    text: 'Cómo funciona',
    href: '#',
  },
  image: {
    src: PhoneMockup,
    alt: 'Phone Mockup',
  },
};

export default function Hero() {
  return (
    <section>
      <div className="grid max-w-screen-xl px-4 py-8 mx-auto lg:gap-8 xl:gap-0 lg:py-16 lg:grid-cols-12">
        <div className="mr-auto place-self-center lg:col-span-7">
          <h1 className="max-w-2xl mb-4 text-4xl font-extrabold tracking-tight leading-none md:text-5xl xl:text-6xl dark:text-white">
            {content.heading}
          </h1>
          <p className="max-w-2xl mb-6 font-light text-gray-500 lg:mb-8 md:text-lg lg:text-xl dark:text-gray-400">
            {content.description}
          </p>
          <div className="flex">
            <Button
              as={Link}
              href={content.primaryButton.href}
              pill
              className="bg-gradient-to-r px-7 py-7  text-xl font-medium text-center from-primary to-secondary text-white hover:bg-gradient-to-bl focus:ring-primary-300 dark:focus:ring-primary-800 hover:text-white"
            >
              {content.primaryButton.text}
              <svg
                className="w-5 h-5 ml-2 -mr-1"
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
            <Button
              as={Link}
              pill
              href={content.secondaryButton.href}
              className="bg-light px-7 py-7 text-xl font-medium text-center hover:bg-gradient-to-bl text-foreground focus:ring-primary-300 dark:focus:ring-primary-800"
            >
              {content.secondaryButton.text}
            </Button>
          </div>
        </div>
        <div className="hidden lg:mt-0 lg:col-span-5 lg:flex">
          <Image src={content.image.src} alt={content.image.alt} />
        </div>
      </div>
    </section>
  );
}
