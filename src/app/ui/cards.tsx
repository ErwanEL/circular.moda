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
      ? { heading: 'Novedades', cards: products }
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
      </div>
    </section>
  );
}
