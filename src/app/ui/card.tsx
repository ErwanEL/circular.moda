import Link from 'next/link';
import Image from 'next/image';

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

export default function Card({ image, title, price, href }: CardProps) {
  const CardContent = () => (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="h-56 w-full">
        <div className="relative h-full">
          <Image
            className="mx-auto dark:hidden"
            src={image.light}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'contain' }}
          />
          <Image
            className="mx-auto hidden dark:block"
            src={image.dark}
            alt={image.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>
      <div className="pt-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          {/* <span className="bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300 me-2 rounded px-2.5 py-0.5 text-xs font-medium">
            {badge}
          </span> */}
        </div>
        <div className="text-lg leading-tight font-semibold text-gray-900 hover:underline dark:text-white">
          {title}
        </div>
        <div className="mt-2 flex items-center gap-2">
          {/* <div className="flex items-center">
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
          </div> */}
          {/* <p className="text-sm font-medium text-gray-900 dark:text-white">
            {rating.value}
          </p> */}
          {/* <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            ({rating.count})
          </p> */}
        </div>
        <div className="mt-4 flex items-center justify-between gap-4">
          <p className="text-2xl leading-tight font-extrabold text-gray-900 dark:text-white">
            {price}
          </p>
          {/* <Button
            variant="primary"
            as={Link}
            href={href || '#'}
          >
            Ver más
          </Button> */}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block transition-transform duration-200 hover:scale-102"
      >
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
