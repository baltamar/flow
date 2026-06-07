export type OrderStatus = 'new' | 'preparing' | 'shipped' | 'delivered';
export type OrderPriority = 'low' | 'normal' | 'high' | 'urgent';
export type OrderCurrency = 'LYD';

export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export interface OrderAttachment {
  name: string;
  dataUrl: string;
  type: string;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  items: OrderItem[];
  total: number;
  currency: OrderCurrency;
  status: OrderStatus;
  priority: OrderPriority;
  notes?: string;
  attachments: OrderAttachment[];
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export const ORDER_STATUSES: OrderStatus[] = ['new', 'preparing', 'shipped', 'delivered'];
export const ORDER_PRIORITIES: OrderPriority[] = ['low', 'normal', 'high', 'urgent'];
