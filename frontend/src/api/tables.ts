import { apiFetch } from "./client";

export type TableStatus = "AVAILABLE" | "OCCUPIED" | "CLEANING";
export type ActiveFilter = "" | "true" | "false";
export type Table = {
  id: string | number;
  name: string;
  status: TableStatus;
  capacity?: number;
  active?: boolean;
  created_at: string;
  updated_at: string;
};

export type TableListResponse = {
  tables: Table[];
  total_count: number;
}

export type TableInput = {
  name: string;
  capacity: number;
  active?: boolean;
};

export type TableUpdate = Partial<TableInput>;

export type TableSession = {
  id: string | number;
  table_id: string;
  qr_token: string;
  status: "OPEN" | "CLOSED";
  opened_at: string;
  closed_at: string | null;
};

type queryTable = {
  search?: string;
  status?: TableStatus | "";
  active?: ActiveFilter;
  page?: number;
  limit?: number;
}


function queryString(query: queryTable = {}) {
  const params = new URLSearchParams();
  const queryParams = {
    search: query.search,
    status: query.status,
    active: query.active,
    page: query.page ?? 1,
    limit: query.limit ?? 10,
  };

  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });

  return `?${params.toString()}`;
}

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}` };
}

export function listTables(query: queryTable, token: string): Promise<TableListResponse> {
  return apiFetch<TableListResponse>(`/tables${queryString(query)}`, {
    headers: authHeaders(token),
  });
}

export function settingListTables(query: queryTable, token: string): Promise<TableListResponse> {
  return apiFetch<TableListResponse>(`/settings/tables${queryString(query)}`, {
    headers: authHeaders(token),
  });
}

export function createTable(payload: TableInput, token: string): Promise<Table> {
  return apiFetch<Table>("/settings/tables", {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function updateTable(
  tableId: string | number,
  payload: TableUpdate,
  token: string,
): Promise<Table> {
  return apiFetch<Table>(`/settings/tables/${tableId}`, {
    method: "PATCH",
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
}

export function deleteTable(
  tableId: string | number,
  token: string,
): Promise<void> {
  return apiFetch<void>(`/settings/tables/${tableId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
}

export function listTableSessions(token: string): Promise<TableSession[]> {
  return apiFetch<TableSession[]>(`/table-sessions`, {
    headers: authHeaders(token),
  });
}

export function openTable(
  tableId: string | number,
  token: string,
): Promise<TableSession> {
  return apiFetch<TableSession>(`/tables/${tableId}/open`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function closeSession(
  sessionId: string | number,
  token: string,
): Promise<TableSession> {
  return apiFetch<TableSession>(`/table-sessions/${sessionId}/close`, {
    method: "POST",
    headers: authHeaders(token),
  });
}

export function markTableCleaned(
  tableId: string | number,
  token: string,
): Promise<Table> {
  return apiFetch<Table>(`/tables/${tableId}/clean`, {
    method: "POST",
    headers: authHeaders(token),
  });
}
