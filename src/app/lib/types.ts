export interface Product {
  id: string;
  SKU: string;
  'Product Name'?: string; // Primary field from Airtable
  Price?: number;
  Category?: string;
  category?: string; // Support both formats
  Color?: string;
  color?: string; // Support both formats
  Size?: string;
  size?: string; // Support both formats
  'Stock Levels'?: number;
  stock?: number; // Support both formats
  slug: string;
  Images?: Array<{ id?: string; url: string; filename?: string } | string>; // Support both Airtable objects and Supabase string URLs
  airtable_id?: string; // Pour identifier les produits Airtable
  Description?: string;
  description?: string;
  gender?: string[]; // Support gender array
  'User ID'?: string | string[]; // Linked record field from Airtable
  // Add any other fields you use in your product objects
}

export interface User {
  id: string;
  Name?: string; // Airtable format
  name?: string; // Supabase format
  Products?: string | string[]; // Linked products or product IDs (Airtable)
  productCount?: number; // Product count (Supabase) - computed from products table
  // Only Name/name and Products/productCount are fetched for confidentiality
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
