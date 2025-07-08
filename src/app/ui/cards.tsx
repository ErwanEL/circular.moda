import Card from './card';
import type { ProductCard } from '../lib/helpers';

const staticContent = {
  heading: 'Productos destacados',
  cards: [
    {
      image: {
        light:
          'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front.svg',
        dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/imac-front-dark.svg',
        alt: 'Apple iMac',
      },
      badge: 'Up to 35% off',
      title: 'yé, yé',
      rating: {
        value: 5.0,
        count: 455,
      },
      price: '$1,699',
    },
    {
      image: {
        light:
          'https://flowbite.s3.amazonaws.com/blocks/e-commerce/iphone-light.svg',
        dark: 'https://flowbite.s3.amazonaws.com/blocks/e-commerce/iphone-dark.svg',
        alt: 'Apple iPhone',
      },
      badge: 'Up to 15% off',
      title: 'Thats my bus',
      rating: {
        value: 4.9,
        count: 1233,
      },
      price: '$1,199',
    },
  ],
  button: {
    text: 'Show more',
  },
};

interface CardsProps {
  products?: ProductCard[];
}

export default function Cards({ products }: CardsProps) {
  const content =
    products && products.length > 0
      ? { heading: 'Productos destacados', cards: products }
      : staticContent;

  return (
    <section className="bg-gray-50 py-8 antialiased dark:bg-gray-900 md:py-12">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="mb-4 items-end justify-between space-y-4 sm:flex sm:space-y-0 md:mb-8">
          <div>
            <h2 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
              {content.heading}
            </h2>
          </div>
        </div>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 md:mb-8 lg:grid-cols-3 xl:grid-cols-4">
          {content.cards.map((cardData, index) => (
            <Card key={index} {...cardData} />
          ))}
        </div>
        {/* <div className="w-full text-center">
          <button
            type="button"
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-100 hover:text-primary-700 focus:z-10 focus:outline-none focus:ring-4 focus:ring-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white dark:focus:ring-gray-700"
          >
            {content.button.text}
          </button>
        </div> */}
      </div>
    </section>
  );
}
