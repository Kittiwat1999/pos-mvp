import { apiFetch } from './client';
import { API_V1_PREFIX } from '../lib/constants';

export type Category = {
  id: string;
  name: string;
  description?: string | null;
  active: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  description?: string | null;
  price: number;
  active: boolean;
  image_url?: string | null;
  add_ons?: Record<string, unknown>[] | null;
};

export type ProductInput = {
  category_id: string;
  name: string;
  description?: string;
  price: number;
  active?: boolean;
  image_url?: string;
  add_ons?: Record<string, unknown>[];
};

export type ProductQuery = {
  active?: boolean;
  category_id?: string;
  search?: string;
};

function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function queryString(query: ProductQuery = {}) {
  const params = new URLSearchParams();

  if (query.active !== undefined) params.set('active', String(query.active));
  if (query.category_id) params.set('category_id', query.category_id);
  if (query.search) params.set('search', query.search);

  const value = params.toString();
  return value ? `?${value}` : '';
}

export function listCategories(token?: string): Promise<Category[]> {
  return apiFetch<Category[]>(`${API_V1_PREFIX}/categories`, {
    headers: authHeaders(token),
  });
}

export function createCategory(
  input: Pick<Category, 'name'> & Partial<Pick<Category, 'description' | 'active'>>,
  token: string,
): Promise<Category> {
  return apiFetch<Category>(`${API_V1_PREFIX}/categories`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function updateCategory(
  categoryId: string,
  input: Partial<Pick<Category, 'name' | 'description' | 'active'>>,
  token: string,
): Promise<Category> {
  return apiFetch<Category>(`${API_V1_PREFIX}/categories/${categoryId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function listProducts(query?: ProductQuery, token?: string): Promise<Product[]> {
  return apiFetch<Product[]>(`${API_V1_PREFIX}/products${queryString(query)}`, {
    headers: authHeaders(token),
  });
}

export function getProduct(productId: string, token?: string): Promise<Product> {
  return apiFetch<Product>(`${API_V1_PREFIX}/products/${productId}`, {
    headers: authHeaders(token),
  });
}

export function createProduct(input: ProductInput, token: string): Promise<Product> {
  return apiFetch<Product>(`${API_V1_PREFIX}/products`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function updateProduct(
  productId: string,
  input: Partial<ProductInput>,
  token: string,
): Promise<Product> {
  return apiFetch<Product>(`${API_V1_PREFIX}/products/${productId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}
