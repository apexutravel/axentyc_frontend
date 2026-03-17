"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthService, User, Tenant } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  tenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();


  const refreshUser = async () => {
    try {
      const userData = await AuthService.getProfile();
      console.log('[Auth] Profile loaded:', userData);
      setUser(userData);
      if (userData.tenantId) {
        console.log('[Auth] Setting tenant from profile tenantId:', userData.tenantId);
        setTenant({
          id: userData.tenantId,
          name: '',
          slug: '',
          plan: ''
        });
      } else {
        console.warn('[Auth] No tenantId found in profile');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      setTenant(null);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await refreshUser();
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = async () => {
    setUser(null);
    setTenant(null);
    await AuthService.logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tenant,
        isLoading,
        isAuthenticated: !!user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
