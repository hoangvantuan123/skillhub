// Public configuration only: never put DB passwords or JWT secrets in VITE_*.
export const apiConfig = Object.freeze({
  baseUrl: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/+$/, ''),
  timeoutMs: 15000,
});

export function apiUrl(path) {
  return `${apiConfig.baseUrl}/${path.replace(/^\/+/, '')}`;
}
