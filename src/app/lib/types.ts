export interface Product {
  id: string;
  SKU: string;
  'Product Name'?: string; // Primary field from Airtable
  Price?: number;
  Category?: string;
  Color?: string;
  Size?: string;
  'Stock Levels'?: number;
  slug: string;
  Images?: { url: string; filename: string }[];
  'Description'?: string;
  description?: string;
  // Add any other fields you use in your product objects
}

export interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  featuredImage?: string | null;
  readTime: number; // in minutes
  published: boolean;
}

export interface BlogMetadata {
  title: string;
  description: string;
  publishedAt: string;
  author: string;
  tags: string[];
  featuredImage?: string | null;
}
