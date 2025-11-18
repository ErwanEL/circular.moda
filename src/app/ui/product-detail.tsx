'use client';

import Image, { type ImageProps } from 'next/image';
import Button from './button';
import Link from 'next/link';
import { FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import { translateColorToSpanish } from '../lib/helpers';
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  Suspense,
  forwardRef,
} from 'react';
import SocialShare from './social-share';
import Card from './card';

type ImageStatus = 'pending' | 'loaded' | 'error';

const imagePromiseCache = new Map<string, Promise<void>>();
const imageStatusCache = new Map<string, ImageStatus>();

const ensureImagePromise = (src: string) => {
  if (imagePromiseCache.has(src)) {
    return imagePromiseCache.get(src) as Promise<void>;
  }

  if (typeof window === 'undefined') {
    const resolved = Promise.resolve();
    imagePromiseCache.set(src, resolved);
    imageStatusCache.set(src, 'loaded');
    return resolved;
  }

  imageStatusCache.set(src, 'pending');

  const promise = new Promise<void>((resolve) => {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = src;
    img.onload = () => {
      imageStatusCache.set(src, 'loaded');
      resolve();
    };
    img.onerror = () => {
      imageStatusCache.set(src, 'error');
      resolve();
    };
  });

  imagePromiseCache.set(src, promise);
  return promise;
};

const useImageReady = (src?: string) => {
  if (!src || typeof window === 'undefined') return;

  const status = imageStatusCache.get(src);
  if (status === 'loaded' || status === 'error') return;

  const promise = ensureImagePromise(src);
  if (imageStatusCache.get(src) === 'error') return;

  throw promise;
};

const isImageLoaded = (src?: string) =>
  !!src && imageStatusCache.get(src) === 'loaded';

type LazyImageProps = Omit<ImageProps, 'src'> & { src: string };

const LazyProductImage = forwardRef<HTMLImageElement, LazyImageProps>(
  function LazyProductImage({ src, ...rest }, ref) {
    useImageReady(src);
    return <Image ref={ref} src={src} {...rest} />;
  }
);

const MainImageSkeleton = () => (
  <div className="absolute inset-0 h-full w-full animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
);

const ThumbnailSkeleton = () => (
  <div className="h-full w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-700" />
);

type ProductDetailProps = {
  product: {
    SKU: string;
    'Product Name'?: string;
    Price?: number;
    Category?: string;
    Color?: string;
    Size?: string;
    StockLevels?: number;
    id?: string;
    Images?: Array<{ url: string; filename: string }>;
  };
  rating?: {
    value: number;
    count: number;
  };
  suggestedProducts?: Array<{
    image: {
      light: string;
      dark: string;
      alt: string;
    };
    badge: string;
    title: string;
    sku: string;
    rating: {
      value: number;
      count: number;
    };
    price: string;
    href: string;
  }>;
};

export default function ProductDetail({
  product,
  rating = { value: 5.0, count: 345 },
  suggestedProducts = [],
}: ProductDetailProps) {
  const productColor = product.Color
    ? translateColorToSpanish(product.Color.toLowerCase())
    : 'Desconocido';

  // State for selected image
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Zoom functionality state and refs
  const [isZooming, setIsZooming] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const zoomPaneRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);

  // Process all images to create local paths and remove duplicates
  const processedImages = (() => {
    if (!product.Images || product.Images.length === 0) return [];

    // Deduplicate images by URL only (URLs are unique identifiers)
    const seenUrls = new Set<string>();
    const uniqueImages = product.Images.filter((image) => {
      // Skip images without URL
      if (!image.url) return false;

      // If we've seen this URL before, it's a duplicate
      if (seenUrls.has(image.url)) {
        return false;
      }

      seenUrls.add(image.url);
      return true;
    });

    // Process unique images
    // Track filenames to handle collisions (same filename, different URLs)
    const filenameCounts = new Map<string, number>();
    const processed = uniqueImages.map((image) => {
      if (image.filename && product.id) {
        const normalizedFilename = image.filename
          .toLowerCase()
          .replace(/ /g, '_');

        // Check if we've seen this filename before
        const count = filenameCounts.get(normalizedFilename) || 0;
        filenameCounts.set(normalizedFilename, count + 1);

        // If this filename was used before (collision), use original URL instead
        // This handles cases where multiple images have the same filename but different URLs
        if (count > 0) {
          return {
            url: image.url,
            filename: image.filename,
            isLocal: false,
          };
        }

        return {
          url: `/airtable/${product.id}-${normalizedFilename}`,
          filename: image.filename,
          isLocal: true,
        };
      }
      return {
        url: image.url,
        filename: image.filename,
        isLocal: false,
      };
    });

    return processed;
  })();

  // Get current selected image
  const currentImage =
    processedImages[selectedImageIndex] || processedImages[0];
  const canZoom = Boolean(currentImage?.url) && isImageLoaded(currentImage?.url);
  const isInitialImage = selectedImageIndex === 0;

  // Zoom functionality
  const ZOOM_LEVEL = 3;

  // Use useCallback to ensure we always have the latest processedImages and selectedImageIndex
  const updateZoomPane = useCallback(
    (e: React.MouseEvent) => {
      if (!isZooming || !imageContainerRef.current || !zoomPaneRef.current)
        return;

      // Get the current image URL directly from processedImages using selectedImageIndex
      const currentImg =
        processedImages[selectedImageIndex] || processedImages[0];
      if (!currentImg?.url || !isImageLoaded(currentImg.url)) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      // Calculate cursor position relative to the image
      const x = e.pageX - rect.left - scrollLeft;
      const y = e.pageY - rect.top - scrollTop;

      // Calculate the position as a percentage of the image dimensions
      const xPercent = Math.max(0, Math.min(1, x / rect.width));
      const yPercent = Math.max(0, Math.min(1, y / rect.height));

      // Position the zoom pane next to the image
      const spaceRight = window.innerWidth - (rect.right - scrollLeft);
      const zoomPaneWidth = 500;
      const zoomPaneHeight = 500;

      if (spaceRight > zoomPaneWidth + 20) {
        zoomPaneRef.current.style.left = `${rect.right - scrollLeft + 20}px`;
      } else {
        zoomPaneRef.current.style.left = `${rect.left - scrollLeft - zoomPaneWidth - 20}px`;
      }

      zoomPaneRef.current.style.top = `${Math.min(
        window.innerHeight - zoomPaneHeight,
        rect.top - scrollTop
      )}px`;

      // Create the zoomed background image
      const zoomWidth = rect.width * ZOOM_LEVEL;
      const zoomHeight = rect.height * ZOOM_LEVEL;

      // Calculate background position to center on cursor
      const bgX = Math.max(
        0,
        Math.min(
          zoomWidth - zoomPaneWidth,
          xPercent * zoomWidth - zoomPaneWidth / 2
        )
      );
      const bgY = Math.max(
        0,
        Math.min(
          zoomHeight - zoomPaneHeight,
          yPercent * zoomHeight - zoomPaneHeight / 2
        )
      );

      // Always use the current image URL from processedImages (quoted to allow parentheses/spaces)
      const safeUrl = JSON.stringify(currentImg.url);
      zoomPaneRef.current.style.backgroundImage = `url(${safeUrl})`;
      zoomPaneRef.current.style.backgroundSize = `${zoomWidth}px ${zoomHeight}px`;
      zoomPaneRef.current.style.backgroundPosition = `-${bgX}px -${bgY}px`;
    },
    [isZooming, processedImages, selectedImageIndex]
  );

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!canZoom) return;
    if (window.innerWidth >= 1024) {
      setIsZooming(true);
      if (zoomPaneRef.current) {
        zoomPaneRef.current.style.opacity = '1';
      }
      updateZoomPane(e);
    }
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
    if (zoomPaneRef.current) {
      zoomPaneRef.current.style.opacity = '0';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canZoom) return;
    updateZoomPane(e);
  };

  const renderStars = (value: number) => {
    return Array.from({ length: Math.round(value) }).map((_, i) => (
      <svg
        key={i}
        className="h-4 w-4 text-yellow-300"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        fill="currentColor"
        viewBox="0 0 24 24"
      >
        <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z" />
      </svg>
    ));
  };

  // Share URL state
  const [shareUrl, setShareUrl] = useState('');

  // Set share URL on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href);
    }
  }, []);

  // Reset zoom pane when selected image changes
  useEffect(() => {
    if (zoomPaneRef.current) {
      zoomPaneRef.current.style.opacity = '0';
      setIsZooming(false);
    }
  }, [selectedImageIndex]);

  return (
    <section className="py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
          <div className="mx-auto max-w-md shrink-0 lg:max-w-lg">
            <div className="space-y-4">
              {/* Main Image */}
              {currentImage ? (
                <div
                  ref={imageContainerRef}
                  className={`group relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-50 shadow-sm transition-colors dark:bg-gray-900 ${
                    canZoom ? 'cursor-zoom-in' : 'cursor-default'
                  }`}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                  onMouseMove={handleMouseMove}
                >
                  <Suspense fallback={<MainImageSkeleton />}>
                    <LazyProductImage
                      ref={mainImageRef}
                      src={currentImage.url}
                      alt={product.SKU}
                      fill
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      priority={isInitialImage}
                      loading={isInitialImage ? undefined : 'lazy'}
                      className="rounded-lg object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
                      draggable={false}
                    />
                  </Suspense>
                </div>
              ) : (
                <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">
                    Imagen no disponible
                  </span>
                </div>
              )}

              {/* Thumbnail Gallery */}
              {processedImages.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {processedImages.map((image, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedImageIndex(index)}
                      className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 bg-gray-50 transition-colors dark:bg-gray-900 ${
                        selectedImageIndex === index
                          ? 'border-blue-500 ring-2 ring-blue-200'
                          : 'border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none'
                      }`}
                      aria-pressed={selectedImageIndex === index}
                      aria-label={`Ver imagen ${index + 1}`}
                    >
                      <Suspense fallback={<ThumbnailSkeleton />}>
                        <LazyProductImage
                          src={image.url}
                          alt={`${product.SKU} - Vista ${index + 1}`}
                          width={80}
                          height={80}
                          sizes="80px"
                          loading="lazy"
                          className="h-full w-full rounded-md object-cover"
                          draggable={false}
                        />
                      </Suspense>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-8 lg:mt-0">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
              {product['Product Name'] || product.SKU}
            </h1>

            {/* SKU Reference */}
            <div className="mt-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium">Referencia:</span> {product.SKU}
              </p>
            </div>

            <div className="mt-4">
              {product.Price !== undefined && (
                <p className="text-2xl font-extrabold text-gray-900 sm:text-3xl dark:text-white">
                  ${product.Price}
                </p>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <div className="flex items-center gap-1">
                {renderStars(rating.value)}
              </div>
              <p className="text-sm leading-none font-medium text-gray-500 dark:text-gray-400">
                Calificación del vendedor
              </p>
            </div>

            <div className="mt-6 sm:mt-8 sm:flex sm:items-center sm:gap-4">
              <Button
                as={Link}
                size="xl"
                href={`https://wa.me/5491125115030?text=Hola%20me%20interesa%20esa%20prenda%20talla:%20${product.Size},%20color:%20${productColor},%20SKU:%20${product.SKU}`}
                variant="primary"
                className="dark:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                Comprar
                <FaShoppingCart className="ml-2" />
              </Button>
              <Button
                as={Link}
                size="xl"
                href={`https://wa.me/5491125115030?text=Hola%20queria%20mas%20info%20sobre%20esta%20prenda%20talla:%20${product.Size},%20color:%20${productColor},%20SKU:%20${product.SKU}`}
                variant="secondary"
                className="ml-2"
                target="_blank"
                rel="noopener noreferrer"
              >
                Más info
                <FaInfoCircle className="ml-2" />
              </Button>
            </div>

            <hr className="my-6 border-gray-200 md:my-8 dark:border-gray-800" />

            <div className="mb-6 text-gray-500 dark:text-gray-400">
              <ul className="space-y-2">
                {product.Category && (
                  <li>
                    <strong>Categoría:</strong> {product.Category}
                  </li>
                )}
                {product.Color && (
                  <li>
                    <strong>Color:</strong> {productColor}
                  </li>
                )}
                {product.Size && (
                  <li>
                    <strong>Talle:</strong> {product.Size}
                  </li>
                )}
              </ul>
            </div>

            {/* <p className="text-gray-500 dark:text-gray-400">
              Los detalles y especificaciones del producto se mostrarán acá.
              Este es un espacio reservado para información adicional del
              producto.
            </p> */}
          </div>
        </div>
      </div>

      <SocialShare
        url={shareUrl}
        message={`¡Mirá esta prenda en Circular Moda! ${product['Product Name'] || product.SKU}`}
        title="¡Compartí esta prenda!"
      />

      {/* Suggested Products Section */}
      {suggestedProducts.length > 0 && (
        <section className="py-8 antialiased md:py-12">
          <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                Productos sugeridos
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Descubrí más prendas que podrían interesarte
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {suggestedProducts.map((suggestedProduct, index) => (
                <Card key={index} {...suggestedProduct} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Zoom Pane */}
      <div
        ref={zoomPaneRef}
        className="pointer-events-none fixed z-50 hidden h-[500px] w-[500px] rounded-lg border border-gray-200 bg-white opacity-0 shadow-xl transition-opacity duration-200 lg:block"
        style={{
          width: '500px',
          height: '500px',
        }}
      />
    </section>
  );
}
