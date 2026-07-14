import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '../services/api';
import type { UserProfile } from '../services/api';

type UserRole = 'admin' | 'operador';

interface AuthContextType {
  token: string | null;
  username: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  /** El perfil todavía no llegó del backend: no decidas accesos hasta que sea false. */
  loadingProfile: boolean;
  /** Provincias que el usuario puede administrar. El superadmin las tiene todas. */
  canAccessProcess: (processId: string) => boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('iccu_token')
  );
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(
    () => !!localStorage.getItem('iccu_token')
  );

  // El rol y el alcance vienen de /auth/me, no de decodificar el token: así el
  // frontend refleja las asignaciones vigentes en el backend y no las que
  // estaban activas cuando se emitió el token.
  useEffect(() => {
    if (!token) {
      setProfile(null);
      setLoadingProfile(false);
      return;
    }

    let cancelled = false;
    setLoadingProfile(true);

    authApi
      .me()
      .then(data => {
        if (!cancelled) setProfile(data);
      })
      .catch(() => {
        // Un 401 ya lo maneja el interceptor de axios (limpia token y redirige).
        if (!cancelled) setProfile(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  const login = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('iccu_token', data.accessToken);
    setToken(data.accessToken);
  };

  const logout = () => {
    localStorage.removeItem('iccu_token');
    setToken(null);
    setProfile(null);
  };

  const canAccessProcess = useCallback(
    (processId: string) => {
      if (!profile) return false;
      if (profile.processes === null) return true; // superadmin
      return profile.processes.includes(processId);
    },
    [profile],
  );

  return (
    <AuthContext.Provider value={{
      token,
      username: profile?.username ?? null,
      role: profile?.role ?? null,
      isAuthenticated: !!token,
      isAdmin: profile?.role === 'admin',
      loadingProfile,
      canAccessProcess,
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
