import Card from './card';
import type { ProductCard } from '../lib/helpers';

interface CardsProps {
  products?: ProductCard[];
}

const fallbackContent = {
  heading: 'Productos destacados',
  cards: [],
};

export default function Cards({ products }: CardsProps) {
  const content =
    products && products.length > 0
      ? { heading: 'Productos destacados', cards: products }
      : fallbackContent;

  return (
    <section>
      <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-16 lg:px-6">
        <div className="mb-8 max-w-screen-md lg:mb-16">
          <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {content.heading}
          </h2>
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
