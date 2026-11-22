export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface ProductImage {
  id: number;
  image_url: string;
  display_order: number;
}

export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  stock_quantity: number;
  image_url?: string | null;
  images?: ProductImage[];
  average_rating?: number;
  review_count?: number;
  category_id: number;
  category?: { id?: number; name: string };
}

export interface ProductReview {
  id: number;
  product_id: number;
  user_id: number;
  rating: number;
  title?: string | null;
  comment: string;
  created_at: string;
  user_name: string;
  product_title?: string;
}

export interface UserProfile {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  secondary_phone?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
}

export interface UserAddress {
  id: number;
  user_id: number;
  label: string;
  recipient_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface CartItem {
  id: number;
  product_id: number;
  quantity: number;
  product: Product;
}