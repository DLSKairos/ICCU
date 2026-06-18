import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';

interface AuthContextType {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('iccu_token')
  );

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    const accessToken = data.accessToken;
    localStorage.setItem('iccu_token', accessToken);
    setToken(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('iccu_token');
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
