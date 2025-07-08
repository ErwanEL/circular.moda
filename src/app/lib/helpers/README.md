# Helper Functions

This directory contains reusable helper functions for the application.

## Product Transformer (`product-transformer.ts`)

Contains functions for transforming Airtable product data into the format expected by UI components.

### Functions

#### `transformProductsToCards(products: Product[]): ProductCard[]`

Transforms an array of Airtable products into the format expected by the Card component.

**Parameters:**

- `products`: Array of Product objects from Airtable

**Returns:**

- Array of ProductCard objects with the correct structure for UI components

#### `getFeaturedProducts(products: Product[], limit: number = 8): ProductCard[]`

Gets a limited number of featured products for display on the homepage.

**Parameters:**

- `products`: Array of all Product objects
- `limit`: Maximum number of products to return (default: 8)

**Returns:**

- Array of ProductCard objects limited to the specified count

### Types

#### `ProductCard`

Interface defining the structure of a product card for UI components:

```typescript
interface ProductCard {
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
  href: string;
}
```

## Usage

```typescript
import { transformProductsToCards, getFeaturedProducts } from '../lib/helpers';

// Transform all products
const allProductCards = transformProductsToCards(products);

// Get featured products for homepage
const featuredProducts = getFeaturedProducts(products, 8);
```
