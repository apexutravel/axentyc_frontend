import { AuthService } from './auth';

export interface ApiRequestOptions extends RequestInit {
  skipAuth?: boolean;
}

/**
 * Secure API fetch wrapper with automatic token refresh on 401
 * Uses HttpOnly cookies for authentication
 */
export async function apiFetch<T = any>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

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

  let response = await fetch(url, defaultOptions);

  // If 401 and not skipping auth, try to refresh token
  if (response.status === 401 && !skipAuth) {
    try {
      await AuthService.refresh();
      // Retry the original request
      response = await fetch(url, defaultOptions);
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
    throw new Error(error.message || error.error || 'Request failed');
  }

  return response.json();
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
