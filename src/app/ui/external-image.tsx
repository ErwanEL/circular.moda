'use client';

import { forwardRef, useCallback } from 'react';

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
};

export const ExternalImage = forwardRef<HTMLImageElement, ExternalImageProps>(
  (
    { src, alt, fill, width, height, className, loading, onError, draggable },
    ref
  ) => {
    const handleError = useCallback(() => {
      onError?.();
    }, [onError]);

    // Use regular img tag for all images (local and external)
    // This ensures images always load reliably, especially for single-image products
    if (fill) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={ref}
          src={src}
          alt={alt}
          className={className}
          onError={handleError}
          loading={loading}
          draggable={draggable}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      );
    }
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        ref={ref}
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        onError={handleError}
        loading={loading}
        draggable={draggable}
      />
    );
  }
);

ExternalImage.displayName = 'ExternalImage';
