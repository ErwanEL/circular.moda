'use client';

import { forwardRef, useCallback, useState, useEffect } from 'react';
import Image from 'next/image';

type ExternalImageProps = {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  draggable?: boolean;
  fallbackSrc?: string; // URL de fallback si l'image principale échoue
};

export const ExternalImage = forwardRef<HTMLImageElement, ExternalImageProps>(
  (
    {
      src,
      alt,
      fill,
      width,
      height,
      className,
      loading,
      onError,
      draggable,
      fallbackSrc,
    },
    ref
  ) => {
    const [currentSrc, setCurrentSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    // Update currentSrc when src prop changes
    useEffect(() => {
      if (src !== currentSrc) {
        setCurrentSrc(src);
        setHasError(false); // Reset error state when src changes
      }
    }, [src, currentSrc]);

    const handleError = useCallback(() => {
      // Si on a un fallback et qu'on n'a pas encore essayé, utiliser le fallback
      if (fallbackSrc && !hasError && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(true);
        return;
      }
      // Sinon, déclencher le callback onError
      onError?.();
    }, [onError, fallbackSrc, hasError, currentSrc]);

    // Use regular img tag for all images (local and external)
    // This ensures images always load reliably, especially for single-image products
    if (fill) {
      return (
        <Image
          ref={ref}
          src={currentSrc}
          alt={alt}
          fill
          className={className}
          onError={handleError}
          loading={loading}
          draggable={draggable}
          sizes="50vw"
          style={{ objectFit: 'cover' }}
        />
      );
    }
    return (
      <Image
        ref={ref}
        src={currentSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        loading={loading}
        draggable={draggable}
        sizes="50vw"
        style={{ height: 'auto' }}
      />
    );
  }
);

ExternalImage.displayName = 'ExternalImage';
