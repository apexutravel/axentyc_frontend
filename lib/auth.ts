import { API_ENDPOINTS } from '@/config/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId?: string;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
  tenant?: Tenant;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  companyName: string;
  companySlug?: string;
}

export class AuthService {
  private static isRefreshing = false;
  private static refreshPromise: Promise<void> | null = null;

  static async login(credentials: LoginCredentials): Promise<User> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de conexión con el servidor' }));
        throw new Error(error.message || error.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.user;
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    }
  }

  static async register(registerData: RegisterData): Promise<User> {
    try {
      const response = await fetch(API_ENDPOINTS.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(registerData),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error de conexión con el servidor' }));
        throw new Error(error.message || error.error || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.user;
    } catch (error: any) {
      if (error.message) {
        throw error;
      }
      throw new Error('No se pudo conectar con el servidor. Verifica que el backend esté corriendo.');
    }
  }

  static async getProfile(): Promise<User> {
    const response = await fetch(API_ENDPOINTS.auth.profile, {
      credentials: 'include',
    });

    if (!response.ok) {
      if (response.status === 401) {
        try {
          await this.refresh();
          return this.getProfile();
        } catch (refreshError) {
          throw new Error('Sesión expirada');
        }
      }
      throw new Error('Error al obtener perfil');
    }

    return response.json();
  }

  static async refresh(): Promise<void> {
    if (this.isRefreshing) {
      return this.refreshPromise!;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(API_ENDPOINTS.auth.refresh, {
          method: 'POST',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Refresh failed');
        }
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  static async logout(): Promise<void> {
    try {
      await fetch(API_ENDPOINTS.auth.logout, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login';
      }
    }
  }
}
