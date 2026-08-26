'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { FaShieldAlt } from 'react-icons/fa';
import type { Product } from '../lib/types';
import SocialShare from './social-share';
import Card from './card';
import { ProductImageGallery } from './product-image-gallery';
import { ProductInfo } from './product-info';
import { ProductInterestButton } from './product-interest-button';
import {
  processProductImages,
  getDisplayedImages,
  type ProcessedImage,
} from '../lib/product-images';
import type { User } from '../lib/types';

type ProductDetailProps = {
  product: Product;
  user?: User | null;
  rating?: {
    value: number;
    count: number;
  };
  suggestedProducts?: ProductCardItem[];
  sellerProducts?: ProductCardItem[];
  sellerFirstName?: string | null;
  sellerUserId?: string | null;
};

type ProductCardItem = {
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
};

export default function ProductDetail({
  product,
  user,
  rating = { value: 5.0, count: 345 },
  sellerProducts = [],
  sellerFirstName = null,
  sellerUserId = null,
  suggestedProducts = [],
}: ProductDetailProps) {
  const [shareUrl, setShareUrl] = useState('');

  // Process product images
  const processedImages = useMemo<ProcessedImage[]>(() => {
    return processProductImages(product);
  }, [product]);

  const displayedImages = useMemo<ProcessedImage[]>(() => {
    return getDisplayedImages(processedImages);
  }, [processedImages]);

  // Set share URL on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handle = window.setTimeout(() => {
        setShareUrl(window.location.href);
      }, 0);

      return () => window.clearTimeout(handle);
    }
  }, []);

  return (
    <section className="py-8 antialiased md:py-16">
      <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
        <div className="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
          {/* Image Gallery */}
          <div className="mx-auto max-w-md shrink-0 lg:max-w-lg">
            <ProductImageGallery
              images={displayedImages}
              productSku={product.SKU}
            />
          </div>

          {/* Product Info */}
          <div>
            <ProductInfo product={product} user={user} rating={rating} />

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-8 sm:flex sm:items-center sm:gap-4">
              <ProductInterestButton product={product} />
            </div>

            {/* Trust Badge */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FaShieldAlt className="text-primary-800 h-4 w-4 flex-shrink-0" />
              <p className="leading-relaxed">
                <span className="font-bold">Sin comisión.</span> Coordinás pago
                y entrega directamente con la persona vendedora.
              </p>
            </div>
          </div>
        </div>
      </div>

      <SocialShare
        url={shareUrl}
        message={`¡Mirá esta prenda en Circular Moda! ${product['Product Name'] || product.SKU}`}
        title="¡Compartí esta prenda!"
      />

      {sellerProducts.length > 0 && sellerFirstName && (
        <section className="py-8 antialiased md:py-12">
          <div className="mx-auto max-w-screen-xl px-4 2xl:px-0">
            <div className="mb-8 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
                  Más prendas de {sellerFirstName}
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Otras publicaciones del mismo vendedor en circular.moda
                </p>
              </div>
              {sellerUserId && (
                <Link
                  href={`/user/${sellerUserId}`}
                  className="text-sm font-semibold text-primary-800 hover:underline"
                >
                  Ver vitrina completa
                </Link>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {sellerProducts.map((sellerProduct) => (
                <Card key={sellerProduct.href} {...sellerProduct} />
              ))}
            </div>
          </div>
        </section>
      )}

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
    </section>
  );
}
