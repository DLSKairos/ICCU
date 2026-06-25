import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';

type UserRole = 'admin' | 'operador';

interface AuthContextType {
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeRole(token: string): UserRole | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1])) as { role?: string };
    if (payload.role === 'admin' || payload.role === 'operador') return payload.role;
    return null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('iccu_token')
  );
  const [role, setRole] = useState<UserRole | null>(
    () => {
      const t = localStorage.getItem('iccu_token');
      return t ? decodeRole(t) : null;
    }
  );

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    const accessToken = data.accessToken;
    localStorage.setItem('iccu_token', accessToken);
    setToken(accessToken);
    setRole(decodeRole(accessToken));
  };

  const logout = () => {
    localStorage.removeItem('iccu_token');
    setToken(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      role,
      isAuthenticated: !!token,
      isAdmin: role === 'admin',
      login,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
