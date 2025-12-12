'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ExternalImage } from './external-image';

type ProcessedImage = {
  url: string;
  originalUrl: string;
  fallbackUrl?: string;
  filename?: string;
  isLocal: boolean;
};

type ProductImageGalleryProps = {
  images: ProcessedImage[];
  productSku: string | number;
};

const ZOOM_LEVEL = 3;

export function ProductImageGallery({
  images,
  productSku,
}: ProductImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isZooming, setIsZooming] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const zoomPaneRef = useRef<HTMLDivElement>(null);
  const mainImageRef = useRef<HTMLImageElement>(null);

  // Filter out invalid images first
  const validImages = images.filter((img) => img && img.url && img.url.trim() !== '');

  // Always get the first available image or the selected one
  // This ensures consistent rendering for both single and multiple images
  const currentImage =
    validImages.length > 0
      ? validImages[Math.min(selectedImageIndex, validImages.length - 1)] || validImages[0]
      : null;
  const canZoom = Boolean(currentImage?.url);
  const isInitialImage = selectedImageIndex === 0;

  // Reset selected index if it's out of bounds
  useEffect(() => {
    if (selectedImageIndex >= validImages.length && validImages.length > 0) {
      setSelectedImageIndex(0);
    }
  }, [validImages.length, selectedImageIndex]);

  const updateZoomPane = useCallback(
    (e: React.MouseEvent) => {
      if (
        !isZooming ||
        !imageContainerRef.current ||
        !zoomPaneRef.current ||
        !mainImageRef.current
      )
        return;

      const currentImg =
        validImages[Math.min(selectedImageIndex, validImages.length - 1)] || validImages[0];
      if (!currentImg?.url) return;

      const rect = imageContainerRef.current.getBoundingClientRect();
      const imgElement = mainImageRef.current;

      // Get actual image dimensions to maintain aspect ratio
      const imgNaturalWidth = imgElement.naturalWidth || rect.width;
      const imgNaturalHeight = imgElement.naturalHeight || rect.height;
      const imgAspectRatio = imgNaturalWidth / imgNaturalHeight;

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft =
        window.pageXOffset || document.documentElement.scrollLeft;

      const x = e.pageX - rect.left - scrollLeft;
      const y = e.pageY - rect.top - scrollTop;

      const xPercent = Math.max(0, Math.min(1, x / rect.width));
      const yPercent = Math.max(0, Math.min(1, y / rect.height));

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

      // Calculate zoom dimensions maintaining image aspect ratio
      // The zoom should be based on the actual image size, not container size
      const containerAspectRatio = rect.width / rect.height;

      let zoomWidth: number;
      let zoomHeight: number;

      if (imgAspectRatio > containerAspectRatio) {
        // Image is wider than container - fit to width
        zoomWidth = rect.width * ZOOM_LEVEL;
        zoomHeight = zoomWidth / imgAspectRatio;
      } else {
        // Image is taller than container - fit to height
        zoomHeight = rect.height * ZOOM_LEVEL;
        zoomWidth = zoomHeight * imgAspectRatio;
      }

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

      const safeUrl = JSON.stringify(currentImg.url);
      zoomPaneRef.current.style.backgroundImage = `url(${safeUrl})`;
      zoomPaneRef.current.style.backgroundSize = `${zoomWidth}px ${zoomHeight}px`;
      zoomPaneRef.current.style.backgroundPosition = `-${bgX}px -${bgY}px`;
      zoomPaneRef.current.style.backgroundRepeat = 'no-repeat';
    },
    [isZooming, validImages, selectedImageIndex]
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

  useEffect(() => {
    if (zoomPaneRef.current) {
      zoomPaneRef.current.style.opacity = '0';
      setIsZooming(false);
    }
  }, [selectedImageIndex]);

  // If no images, show placeholder
  if (!currentImage || !currentImage.url || validImages.length === 0) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
        <span className="text-gray-500 dark:text-gray-400">
          Imagen no disponible
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Main Image - renders the same whether 1 image or multiple */}
        <div
          ref={imageContainerRef}
          className={`group aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-50 shadow-sm transition-colors dark:bg-gray-900 ${
            canZoom ? 'cursor-zoom-in' : 'cursor-default'
          }`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
        >
          <ExternalImage
            ref={mainImageRef}
            src={currentImage.url}
            alt={String(productSku)}
            fallbackSrc={currentImage.fallbackUrl}
            loading={isInitialImage ? 'eager' : 'lazy'}
            className="h-full w-full rounded-lg object-cover transition-transform duration-300 ease-out group-hover:scale-[1.02]"
            draggable={false}
          />
        </div>

        {/* Thumbnail Gallery - Show if there are 2+ valid images */}
        {validImages.length > 1 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {validImages.map((image, index) => {
              // Use a more stable key combining index and filename/url
              const imageKey = image.filename || image.url || `image-${index}`;
              return (
                <button
                  key={`${index}-${imageKey}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={`h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 bg-gray-50 transition-colors dark:bg-gray-900 ${
                    selectedImageIndex === index
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none'
                  }`}
                  aria-pressed={selectedImageIndex === index}
                  aria-label={`Ver imagen ${index + 1} de ${validImages.length}`}
                >
                  <ExternalImage
                    src={image.url}
                    alt={`${productSku} - Vista ${index + 1}`}
                    fallbackSrc={image.fallbackUrl}
                    width={80}
                    height={80}
                    loading="lazy"
                    className="h-full w-full rounded-md object-cover"
                    draggable={false}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Zoom Pane */}
      <div
        ref={zoomPaneRef}
        className="pointer-events-none fixed z-50 hidden h-[500px] w-[500px] rounded-lg border border-gray-200 bg-white opacity-0 shadow-xl transition-opacity duration-200 lg:block"
        style={{
          width: '500px',
          height: '500px',
        }}
      />
    </>
  );
}
