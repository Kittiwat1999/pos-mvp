import { apiFetch } from './client';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'QR_PAYMENT';

export type OrderItem = {
  id: string;
  product_id: string;
  product_name?: string;
  quantity: number;
  unit_price: number;
  discount: number;
  note?: string | null;
};

export type Order = {
  id: string;
  table_session_id: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  created_at: string;
  items: OrderItem[];
};

export type CreateOrderItemInput = {
  product_id: string;
  quantity: number;
  note?: string;
};

export type CreateOrderInput = {
  items: CreateOrderItemInput[];
};

export type CheckoutResponse = {
  table_session_id: string;
  method: PaymentMethod;
  amount: number;
  reference?: string | null;
  paid_at: string;
};

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function createOrder(
  tableSessionId: string,
  input: CreateOrderInput,
  token?: string,
): Promise<Order> {
  return apiFetch<Order>(`/table-sessions/${tableSessionId}/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function createQrOrder(
  qrToken: string,
  input: CreateOrderInput,
  token?: string,
): Promise<Order> {
  return apiFetch<Order>(`/api/v1/qr/${encodeURIComponent(qrToken)}/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function listSessionOrders(tableSessionId: string, token?: string): Promise<Order[]> {
  return apiFetch<Order[]>(`/table-sessions/${tableSessionId}/orders`, {
    headers: authHeaders(token),
  });
}

export function listPendingOrders(token: string): Promise<Order[]> {
  return apiFetch<Order[]>(`/orders?status=pending`, {
    headers: authHeaders(token),
  });
}

export function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  token: string,
): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  });
}

export function checkoutSession(
  tableSessionId: string,
  method: PaymentMethod,
  token?: string,
): Promise<CheckoutResponse> {
  return apiFetch<CheckoutResponse>(`/table-sessions/${tableSessionId}/checkout`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ method }),
  });
}
