export interface Product {
  id: string;
  SKU: string;
  Price?: number;
  Category?: string;
  slug: string;
  Images?: { url: string }[];
  // Add any other fields you use in your product objects
}
