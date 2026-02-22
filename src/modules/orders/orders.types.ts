export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum PaymentMethod {
  COD = 'cod',
  ONLINE = 'online',
}

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

export enum CourierProvider {
  MANUAL = 'manual',
  PATHAO = 'pathao',
}

export enum ShipmentStatus {
  PENDING = 'pending',
  REQUESTED = 'requested',
  PICKED_UP = 'picked_up',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
}

export enum OrderLogActorType {
  SYSTEM = 'system',
  MERCHANT = 'merchant',
  CUSTOMER = 'customer',
  COURIER = 'courier',
}

export interface MerchantRecord {
  id: string;
  owner_id: string;
  business_name: string;
  subdomain: string;
  is_active: boolean;
}

export interface ProductRecord {
  id: string;
  merchant_id: string;
  name: string;
  description?: string | null;
  base_price: number;
  stock_level: number;
  attributes: Record<string, unknown>;
  image_urls: string[];
}

export interface OrderRecord {
  id: string;
  merchant_id: string;
  status: OrderStatus;
  delivered_at?: string | null;
}

export interface CourierShipmentRecord {
  id: string;
  order_id: string;
  merchant_id: string;
  shipment_status: ShipmentStatus;
}
