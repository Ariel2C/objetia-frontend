// Tipos compartidos alineados con el backend (FastAPI / PostgreSQL)

export type ProductoStatus = 'AVAILABLE' | 'RESERVED' | 'SOLD';

export interface Producto {
  id: number;
  title: string;
  category: string;
  price: number;
  condition: 'USED' | 'NEW';
  image_url: string;
  status: ProductoStatus;
  seller_id?: number;
  seller_name?: string;
  is_new?: boolean;
}

export interface Banner {
  id: number;
  title?: string;
  subtitle?: string;
  link_url?: string;
  cloudfront_url: string;
  mobile_cloudfront_url?: string | null;
  is_active: boolean;
}

export interface SeccionInicio {
  id: number;
  title: string;
  category_filter: string | null;
  orden: number;
  productos: Producto[];
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderStatusResponse {
  order_id: number;
  status: OrderStatus;
  total_price: number;
  shipping_cost: number;
}

export interface WalletBalance {
  balance_available: number; // Retirable al banco ya mismo
  balance_frozen: number;    // Retirable a los 7 días de la venta
  balance_spendable: number; // Usable para comprar dentro de la app (suma de ambos)
}

export interface WalletTransaction {
  id: number;
  amount: number;
  marketplace_commission: number;
  type: string;
  status: string;
  available_at: string;
  created_at: string;
}
