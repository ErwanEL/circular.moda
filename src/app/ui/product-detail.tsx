'use client';

import { useState, useEffect, useMemo } from 'react';
import Button from './button';
import Link from 'next/link';
import { FaWhatsapp } from 'react-icons/fa6';
import { FaShieldAlt } from 'react-icons/fa';
import type { Product } from '../lib/types';
import SocialShare from './social-share';
import Card from './card';
import { ProductImageGallery } from './product-image-gallery';
import { ProductInfo } from './product-info';
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
  user,
  rating = { value: 5.0, count: 345 },
  suggestedProducts = [],
}: ProductDetailProps) {
  const [shareUrl, setShareUrl] = useState('');

  console.log('[ProductDetail] User data:', user);
  console.log('[ProductDetail] Product User ID:', product['User ID']);

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
      setShareUrl(window.location.href);
    }
  }, []);

  console.log(product);

  const productColor = product.Color
    ? product.Color.toLowerCase()
    : 'Desconocido';

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
              <Button
                size="xl"
                href={`https://wa.me/5491125115030?text=Hola%20me%20interesa%20esa%20prenda%20talla:%20${product.Size},%20color:%20${productColor},%20SKU:%20${product.SKU}`}
                variant="primary"
                solid
                bold
                className="text-white dark:text-gray-900"
                target="_blank"
                rel="noopener noreferrer"
              >
                Contactar al vendedor por WhatsApp
                <FaWhatsapp className="ml-2" />
              </Button>
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
