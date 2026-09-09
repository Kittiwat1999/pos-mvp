import { apiFetch } from './client';

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
  image?: File | Blob | null;
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

export function listCategories(token?: string | undefined): Promise<Category[]> {
  return apiFetch<Category[]>(`/categories`, {
    headers: authHeaders(token),
  });
}

export function createCategory(
  input: Pick<Category, 'name'> & Partial<Pick<Category, 'description' | 'active'>>,
  token: string,
): Promise<Category> {
  return apiFetch<Category>(`/categories`, {
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
  return apiFetch<Category>(`/categories/${categoryId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}

export function listProducts(query?: ProductQuery, token?: string): Promise<Product[]> {
  return apiFetch<Product[]>(`/products${queryString(query)}`, {
    headers: authHeaders(token),
  });
}

export function getProduct(productId: string, token?: string): Promise<Product> {
  return apiFetch<Product>(`/products/${productId}`, {
    headers: authHeaders(token),
  });
}

export function createProduct(input: ProductInput, token: string): Promise<Product> {
  const form = new FormData();
  form.append('category_id', input.category_id);
  form.append('name', input.name);
  form.append('price', String(input.price));
  if (input.description !== undefined) form.append('description', input.description);
  if (input.active !== undefined) form.append('active', String(input.active));
  if (input.image) form.append('image', input.image);

  return apiFetch<Product>(`/products`, {
    method: 'POST',
    headers: authHeaders(token),
    body: form,
  });
}

export function updateProduct(
  productId: string,
  input: Partial<ProductInput>,
  token: string,
): Promise<Product> {
  return apiFetch<Product>(`/products/${productId}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(input),
  });
}
