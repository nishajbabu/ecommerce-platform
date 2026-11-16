export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  category_id: number;
  category?: { id?: number; name: string };
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}