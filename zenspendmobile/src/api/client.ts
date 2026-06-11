// Thin fetch wrapper around the ZenSpend REST API.
//
// Responsibilities:
//  - attach the Bearer access token,
//  - transparently refresh the token once on a 401 and retry the request,
//  - surface readable (French) error messages,
//  - notify the auth layer when the session is irrecoverable.
import { API_BASE_URL } from './config';
import { tokenStore } from './tokenStore';

type Json = Record<string, any>;

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Json | FormData;
  /** Skip attaching the Authorization header (login / register / refresh). */
  auth?: boolean;
}

// The auth layer registers a handler so it can clear state and route the user
// back to the login screen when refreshing fails.
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(handler: (() => void) | null) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = await tokenStore.getRefresh();
  if (!refresh) return null;

  const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data?.access) return null;

  await tokenStore.setTokens(data.access, data.refresh);
  return data.access as string;
}

async function parseBody(res: Response) {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json().catch(() => null);
  }
  return res.text().catch(() => null);
}

function extractError(payload: any, status: number): string {
  if (payload && typeof payload === 'object') {
    if (payload.detail) return payload.detail;
    if (payload.message) return payload.message;
    if (payload.error) return payload.error;
    // DRF field-level errors: { field: ["msg"] }
    const firstKey = Object.keys(payload)[0];
    if (firstKey) {
      const val = payload[firstKey];
      if (Array.isArray(val) && val.length) return `${firstKey}: ${val[0]}`;
      if (typeof val === 'string') return val;
    }
  }
  if (status >= 500) return 'Erreur serveur, veuillez réessayer plus tard';
  return `Erreur HTTP: ${status}`;
}

async function rawRequest(endpoint: string, options: RequestOptions, accessToken: string | null) {
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {};

  if (!isFormData && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (options.auth !== false && accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return fetch(`${API_BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    headers,
    body: isFormData
      ? (options.body as FormData)
      : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
  });
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  let accessToken = options.auth === false ? null : await tokenStore.getAccess();

  let res: Response;
  try {
    res = await rawRequest(endpoint, options, accessToken);
  } catch {
    throw new Error('Impossible de se connecter au serveur. Vérifiez votre connexion.');
  }

  // Attempt a one-time refresh on expiry for authenticated requests.
  if (res.status === 401 && options.auth !== false) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await rawRequest(endpoint, options, newToken);
    }
    if (res.status === 401) {
      await tokenStore.clear();
      onSessionExpired?.();
      throw new Error('Session expirée, veuillez vous reconnecter.');
    }
  }

  const payload = await parseBody(res);

  if (!res.ok) {
    throw new Error(extractError(payload, res.status));
  }

  return payload as T;
}

/** Normalize DRF list responses (array or paginated `{ results: [] }`). */
export function asList<T = any>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  return [];
}
