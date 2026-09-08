import { apiFetch } from './client';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'QR_PAYMENT';

export const ALLOWED_TRANSITIONS = {
  PENDING: ["CANCELLED", "CONFIRMED"],
  CONFIRMED: ["CANCELLED", "COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
} as const satisfies Record<OrderStatus, readonly OrderStatus[]>;

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return (ALLOWED_TRANSITIONS[from] as readonly OrderStatus[]).includes(to);
}

export const orderStatusToButtonActions: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirm',
  COMPLETED: 'Complete',
  CANCELLED: 'Cancel',
};

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

function normalizeOrder(order: Order): Order {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    tax: Number(order.tax),
    total: Number(order.total),
    items: order.items.map((item) => ({
      ...item,
      unit_price: Number(item.unit_price),
      discount: Number(item.discount),
    })),
  };
}

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
  }).then(normalizeOrder);
}

export function createQrOrder(
  qrToken: string,
  input: CreateOrderInput,
  token?: string,
): Promise<Order> {
  return apiFetch<Order>(`/qr/${encodeURIComponent(qrToken)}/orders`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  }).then(normalizeOrder);
}

export function listSessionOrders(tableSessionId: string, token?: string): Promise<Order[]> {
  return apiFetch<Order[]>(`/table-sessions/${tableSessionId}/orders`, {
    headers: authHeaders(token),
  }).then((orders) => orders.map(normalizeOrder));
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
  }).then(normalizeOrder);
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

// incoming orders
export function listOrders(status:string, token?: string): Promise<Order[]> {
  return apiFetch<Order[]>(`/orders?status=${status}`, {
    headers: authHeaders(token),
  }).then((orders) => orders.map(normalizeOrder));
}

export function updateOrderStatusById(orderId: string, status: OrderStatus, token?: string): Promise<Order> {
  return apiFetch<Order>(`/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify({ status }),
  }).then(normalizeOrder);
}