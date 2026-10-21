import { AuthService } from './auth';

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipWorkspace?: boolean;
}

const WORKSPACE_SCOPED_PATHS = [
  '/automations',
  '/chat-widget',
  '/contacts',
  '/conversations',
  '/deals',
  '/emails',
  '/integrations',
  '/leads',
];

// Every company-level route is scoped to the active workspace (Meta channels included)
const WORKSPACE_SCOPE_EXCLUDED_PATHS: string[] = [];

function getActiveWorkspaceId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('axentyc.activeWorkspaceId');
}

function shouldScopeWorkspace(url: string): boolean {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/api\/v1/, '');
    if (WORKSPACE_SCOPE_EXCLUDED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
      return false;
    }
    return WORKSPACE_SCOPED_PATHS.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
  } catch {
    return false;
  }
}

function applyWorkspaceScope(url: string, options: RequestInit, skipWorkspace?: boolean) {
  const workspaceId = getActiveWorkspaceId();
  if (skipWorkspace || !workspaceId || !shouldScopeWorkspace(url)) {
    return { url, options };
  }

  const method = (options.method || 'GET').toUpperCase();
  const nextOptions: RequestInit = { ...options };
  const nextUrl = new URL(url);

  if (method === 'GET' || method === 'DELETE') {
    if (!nextUrl.searchParams.has('workspaceId')) {
      nextUrl.searchParams.set('workspaceId', workspaceId);
    }
    return { url: nextUrl.toString(), options: nextOptions };
  }

  const isFormData = typeof FormData !== 'undefined' && nextOptions.body instanceof FormData;
  if (!isFormData) {
    const rawBody = typeof nextOptions.body === 'string' ? nextOptions.body : undefined;
    const body = rawBody ? JSON.parse(rawBody) : {};
    if (!body.workspaceId) {
      body.workspaceId = workspaceId;
    }
    nextOptions.body = JSON.stringify(body);
  }

  return { url: nextUrl.toString(), options: nextOptions };
}

/**
 * Secure API fetch wrapper with automatic token refresh on 401
 * Uses HttpOnly cookies for authentication
 */
export async function apiFetch<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth, skipWorkspace, ...fetchOptions } = options;

  const isFormData = typeof FormData !== 'undefined' && (fetchOptions as any)?.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(fetchOptions.headers as any),
  } as any;

  const defaultOptions: RequestInit = {
    credentials: 'include',
    ...fetchOptions,
    headers,
  };

  const scoped = applyWorkspaceScope(url, defaultOptions, skipWorkspace);

  let response = await fetch(scoped.url, scoped.options);

  // If 401 and not skipping auth, try to refresh token
  if (response.status === 401 && !skipAuth) {
    try {
      await AuthService.refresh();
      // Retry the original request
      response = await fetch(scoped.url, scoped.options);
    } catch (refreshError) {
      // Refresh failed, redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
      throw new Error('Session expired');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `Error ${response.status}: ${response.statusText}`,
    }));
    const rawMessage = error.message || error.error || 'Request failed';
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : String(rawMessage);
    // Expose axios-like `response` so callers can read `e.response.data.message` / `.details`
    const apiError = new Error(message) as Error & {
      response?: { status: number; data: any };
      status?: number;
    };
    apiError.status = response.status;
    (apiError as any).code = (error as any).code;
    if (response.status === 403 && ((error as any).code === 'WORKSPACE_REQUIRED' || (error as any).code === 'WORKSPACE_FORBIDDEN') && typeof window !== 'undefined') {
      // The selected workspace is no longer valid: let the workspace context resync
      window.dispatchEvent(new CustomEvent('axentyc:workspace-invalid'));
    }
    apiError.response = { status: response.status, data: { ...error, message } };
    throw apiError;
  }

  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiFetch<T>(url, { ...options, method: 'GET' }),

  post: <T = any>(url: string, data?: any, options?: ApiRequestOptions) => {
    const isForm = typeof FormData !== 'undefined' && data instanceof FormData;
    return apiFetch<T>(url, {
      ...options,
      method: 'POST',
      body: isForm ? data : data ? JSON.stringify(data) : undefined,
    });
  },

  put: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T = any>(url: string, data?: any, options?: ApiRequestOptions) =>
    apiFetch<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = any>(url: string, options?: ApiRequestOptions) =>
    apiFetch<T>(url, { ...options, method: 'DELETE' }),
};
