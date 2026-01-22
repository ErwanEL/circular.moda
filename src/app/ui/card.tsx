import Link from 'next/link';

type CardProps = {
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  badge: string;
  title: string;
  size?: string;
  sku: string;
  rating: {
    value: number;
    count: number;
  };
  price: string;
  href?: string;
};

export default function Card({ image, title, size, sku, price, href }: CardProps) {
  const CardContent = () => (
    <div className="flex h-full flex-col bg-transparent">
      <div className="h-[23rem] w-full bg-transparent">
        <img
          className="h-full w-full rounded-md object-cover dark:hidden"
          src={image.light}
          alt={image.alt}
          loading="lazy"
        />
        <img
          className="hidden h-full w-full rounded-md object-cover dark:block"
          src={image.dark}
          alt={image.alt}
          loading="lazy"
        />
      </div>
      <div className="flex flex-1 flex-col text-left">
        <div className="mt-1 line-clamp-2 min-h-[2.9rem] text-lg leading-tight font-semibold text-gray-900 dark:text-white">
          {title}
        </div>
        <div className="mt-1">
          <p
            className={`text-xs text-gray-500 dark:text-gray-400 ${size ? '' : 'invisible'}`}
          >
            <span className="font-medium">Talle:</span> {size || '—'}
          </p>
        </div>
        <div className="mt-1">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Ref:</span> {sku}
          </p>
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
        <div className="mt-auto flex items-center justify-between gap-4">
          <p className="text-2xl leading-tight font-extrabold text-primary-800 dark:text-primary-300">
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
        className="block h-full transition-transform duration-200 hover:scale-102"
      >
        <CardContent />
      </Link>
    );
  }

  return <CardContent />;
}
