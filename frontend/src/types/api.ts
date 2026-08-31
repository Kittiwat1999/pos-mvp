export type ApiErrorBody = {
  detail?: string;
};

export type ApiListResponse<T> = T[];

export type { LoginResponse, UserProfile } from './auth';
export type { QrSession } from '../api/qr';
export type {
  Category,
  Product,
  ProductInput,
  ProductQuery,
} from '../api/products';
export type {
  CreateOrderInput,
  CreateOrderItemInput,
  Order,
  OrderItem,
  OrderStatus,
} from '../api/orders';
export type { Table, TableSession } from '../api/tables';
