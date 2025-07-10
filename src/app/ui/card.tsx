import Link from 'next/link';
import { Button } from 'flowbite-react';

type CardProps = {
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  badge: string;
  title: string;
  rating: {
    value: number;
    count: number;
  };
  price: string;
  href?: string;
};

export default function Card({
  image,
  badge,
  title,
  rating,
  price,
  href,
}: CardProps) {
  const CardContent = () => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="h-56 w-full">
        <div className="h-full">
          <img
            className="mx-auto h-full dark:hidden"
            src={image.light}
            alt={image.alt}
          />
          <img
            className="mx-auto hidden h-full dark:block"
            src={image.dark}
            alt={image.alt}
          />
        </div>
      </div>
      <div className="pt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="me-2 rounded bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-800 dark:bg-primary-900 dark:text-primary-300">
            {badge}
          </span>
        </div>
        <div className="text-lg font-semibold leading-tight text-gray-900 hover:underline dark:text-white">
          {title}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex items-center">
            {Array.from({ length: Math.round(rating.value) }).map((_, i) => (
              <svg
                key={i}
                className="h-4 w-4 text-yellow-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M13.8 4.2a2 2 0 0 0-3.6 0L8.4 8.4l-4.6.3a2 2 0 0 0-1.1 3.5l3.5 3-1 4.4c-.5 1.7 1.4 3 2.9 2.1l3.9-2.3 3.9 2.3c1.5 1 3.4-.4 3-2.1l-1-4.4 3.4-3a2 2 0 0 0-1.1-3.5l-4.6-.3-1.8-4.2Z" />
              </svg>
            ))}
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {rating.value}
          </p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            ({rating.count})
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-2xl font-extrabold leading-tight text-gray-900 dark:text-white">
            {price}
          </p>
          <Button
            color="alternative"
            pill
            className="bg-gradient-to-r from-primary to-secondary text-white hover:bg-gradient-to-bl focus:ring-primary-300 dark:focus:ring-primary-800 hover:text-white"
            // as={Link}
            // href="#"
          >
            Ver más
          </Button>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block hover:scale-105 transition-transform duration-200"
      >
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
