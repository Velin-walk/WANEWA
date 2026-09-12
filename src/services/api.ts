const configuredBaseUrl = (
  import.meta as ImportMeta & { env?: { PROD?: boolean; VITE_API_BASE_URL?: string } }
).env;

// Local development keeps using the Express /api routes. Pages uses the Worker URL.
export const API_BASE_URL = (
  configuredBaseUrl?.VITE_API_BASE_URL?.trim() ||
  (configuredBaseUrl?.PROD ? 'https://walk-nepal-walk-api.velinrai-vr.workers.dev' : '/api')
).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  return `${API_BASE_URL}/${path.replace(/^\/+/, '')}`;
}

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}
