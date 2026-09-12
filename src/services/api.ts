const configuredBaseUrl = (
  import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }
).env?.VITE_API_BASE_URL?.trim();

// Local development keeps using the Express /api routes. Pages uses the Worker URL.
export const API_BASE_URL = (configuredBaseUrl || '/api').replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}
