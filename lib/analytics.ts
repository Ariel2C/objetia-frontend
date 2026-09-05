import { getApiUrl } from './config';
import { getToken } from './api';

const VISITOR_KEY = 'vamaar_visitor_id';

/**
 * Obtiene o genera una huella pseudo-anónima única para el visitante actual.
 * Se almacena en localStorage para deduplicar visualizaciones sin recolectar datos personales.
 */
export function getVisitorId(): string {
  if (typeof window === 'undefined') return 'server';
  let vid = localStorage.getItem(VISITOR_KEY);
  if (!vid) {
    vid = 'vis_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    try {
      localStorage.setItem(VISITOR_KEY, vid);
    } catch {
      // Ignorar si localStorage está bloqueado en modo incógnito estricto
    }
  }
  return vid;
}

/**
 * Registra un evento de interacción con un producto (vista, clic, carrito, etc.).
 * Se ejecuta de forma asíncrona "fire-and-forget" para no bloquear la experiencia de usuario.
 */
export async function trackProductEvent(productId: number, eventType: 'view' | 'click' | 'favorite_add' | 'favorite_remove' | 'cart_add' | 'purchase') {
  if (typeof window === 'undefined' || !productId) return;
  try {
    const token = getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body = JSON.stringify({
      product_id: productId,
      event_type: eventType,
      visitor_hash: getVisitorId(),
    });

    // Fire and forget usando keepalive si el navegador lo soporta
    fetch(`${getApiUrl()}/analytics/event`, {
      method: 'POST',
      headers,
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silencioso
  }
}

export function trackProductView(productId: number) {
  trackProductEvent(productId, 'view');
}

// Control de debounce para registro de búsquedas
let searchTimeout: NodeJS.Timeout | null = null;
let lastTrackedQuery = '';

export function trackSearchQuery(query: string, resultsCount: number = 0) {
  if (typeof window === 'undefined') return;
  const clean = query.trim().toLowerCase();
  if (!clean || clean.length < 2 || clean === lastTrackedQuery) return;

  if (searchTimeout) clearTimeout(searchTimeout);

  searchTimeout = setTimeout(() => {
    lastTrackedQuery = clean;
    try {
      const token = getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      fetch(`${getApiUrl()}/analytics/search`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ query: clean, results_count: resultsCount }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // Silencioso
    }
  }, 1200); // 1.2 segundos después de dejar de tipear
}
