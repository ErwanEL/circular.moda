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
  Images?: { url: string }[];
  // Add any other fields you use in your product objects
}
