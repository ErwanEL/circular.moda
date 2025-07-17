'use client';
import { getFeaturedProducts } from '../lib/helpers';
import type { Product } from '../lib/types';
import Cards from './cards';
import useIsMobile from '../lib/helpers/useIsMobile';

export default function ResponsiveCards({ products }: { products: Product[] }) {
  const isMobile = useIsMobile();
  const count = isMobile ? 6 : 8;
  const productCards = getFeaturedProducts(products, count);
  return <Cards products={productCards} />;
}
