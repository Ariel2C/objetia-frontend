import { getApiUrl } from './config';

export const TOKEN_KEY = 'vamaar_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export interface ApiError extends Error {
  status: number;
  detail?: string;
}

/**
 * Cliente fetch centralizado.
 * - Adjunta el header Authorization automáticamente cuando hay token (salvo auth:false).
 * - Lanza un ApiError con status y detail en respuestas no-OK.
 * - Dispara 'vamaar:unauthorized' en un 401 para que la app cierre sesión de forma unificada.
 */
export async function apiFetch<T = any>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders = new Headers(headers || {});

  if (auth) {
    const token = getToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiUrl()}${path}`, { ...rest, headers: finalHeaders });

  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('vamaar:unauthorized'));
    }
  }

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const detail = (data && typeof data === 'object' && (data.detail || data.message)) || undefined;
    const err = new Error(detail || `Error ${res.status}`) as ApiError;
    err.status = res.status;
    err.detail = detail;
    throw err;
  }

  return data as T;
}
