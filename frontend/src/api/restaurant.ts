import { apiFetch } from "./client";

export type Restaurant = {
  name: string;
  phone_number: string;
  address: string;
  image_url: string | null;
};

export type RestaurantInput = {
  name: string;
  phone_number: string;
  address: string;
  image?: File | Blob | null;
};

export type ServiceType = {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
};

export type RestaurantOut = {
  restaurant: Restaurant;
  service_types: ServiceType[];
}


function authHeaders(token?: string): HeadersInit {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getRestaurant(token?: string) : Promise<RestaurantOut> {
  return apiFetch<RestaurantOut>('/restaurant', {
    method: "GET",
    headers: authHeaders(token)
  })
}

export function updateRestaurant(
  input: Partial<RestaurantInput>,
  token?: string,
): Promise<RestaurantInput> {
  const form = new FormData();
  if (input.name !== undefined) form.append("name", input.name);
  if (input.phone_number !== undefined) form.append("phone_number", String(input.phone_number));
  if (input.address !== undefined) form.append("address", input.address);
  if (input.image) form.append("image", input.image);
  return apiFetch<RestaurantInput>(`/restaurant`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: form,
  });
}

export function updateServicesType(
  service_type_id: number,
  input: Partial<ServiceType>,
  token?: string,
): Promise<ServiceType> {
  return apiFetch<ServiceType>(`/service_type/${service_type_id}`, {
    method:"PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(input),
  })
}
