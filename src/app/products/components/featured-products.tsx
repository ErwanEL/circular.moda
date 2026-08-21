import Card from '../../ui/card';
import type { ProductCard } from '../../lib/helpers';
import DraggableCarousel from './draggable-carousel';

/**
 * Compact, horizontally-scrollable "Destacados" row shown at the top of the
 * catalogue. The cards stay server-rendered; only the scroll row is a client
 * component so it can be dragged with the mouse on desktop.
 * Renders nothing when there are no featured products.
 */
export default function FeaturedProducts({ cards }: { cards: ProductCard[] }) {
  if (!cards || cards.length === 0) {
    return null;
  }

  return (
    <section className="mb-8" aria-label="Productos destacados">
      <div className="mb-3 flex items-baseline gap-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Destacados
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {cards.length}
        </span>
      </div>
      <DraggableCarousel className="flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-color:#d1d5db_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent hover:[&::-webkit-scrollbar-thumb]:bg-gray-400 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600">
        {cards.map((card) => (
          <div key={card.href} className="w-52 shrink-0 snap-start sm:w-56">
            <Card {...card} featured />
          </div>
        ))}
      </DraggableCarousel>
    </section>
  );
}
