import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authApi, type UsuarioSesion } from '../api/auth';
import { borrarSesionGuardada, escucharSesionCerrada } from '../lib/sesion';

type AuthUser = UsuarioSesion;

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  cargando: boolean;
  autenticado: boolean;
  login: (email: string, password: string) => Promise<{ challengeToken?: string }>;
  completarSegundoFactor: (challengeToken: string, code: string) => Promise<void>;
  loginConOtp: (email: string, code: string) => Promise<{ requiresRegistration?: boolean; registrationToken?: string }>;
  register: (
    email: string,
    password: string,
    nombre: string,
    telefono?: string,
    registrationToken?: string,
  ) => Promise<void>;
  restablecerContrasena: (token: string, newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  requestOtp: (email: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  refrescarUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function saveSession(accessToken: string, refreshToken: string) {
  sessionStorage.setItem('accessToken', accessToken);
  sessionStorage.setItem('refreshToken', refreshToken);
}

function clearSession() {
  borrarSesionGuardada();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const storedToken = sessionStorage.getItem('accessToken');
    if (!storedToken) {
      setCargando(false);
      return;
    }

    authApi.yo()
      .then((data) => {
        setUser(data);
        setAccessToken(storedToken);
      })
      .catch(() => {
        clearSession();
        setUser(null);
      })
      .finally(() => setCargando(false));
  }, []);

  useEffect(
    () => escucharSesionCerrada((m) => {
      if (m === 'expirada') {
        setUser(null);
        setAccessToken(null);
      }
    }),
    [],
  );

  async function login(email: string, password: string) {
    const data = await authApi.login(email, password);
    if ('accessToken' in data && data.accessToken) {
      saveSession(data.accessToken, data.refreshToken);
      setAccessToken(data.accessToken);
      setUser(data.user);
      return {};
    }
    if ('requiresSecondFactor' in data && data.requiresSecondFactor) {
      return { challengeToken: data.challengeToken };
    }
    return {};
  }

  async function completarSegundoFactor(challengeToken: string, code: string) {
    const data = await authApi.loginSegundoFactor(challengeToken, code);
    saveSession(data.accessToken, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function loginConOtp(email: string, code: string) {
    const data = await authApi.verificarOtp(email, code);
    if (data.accessToken && data.user) {
      saveSession(data.accessToken, data.refreshToken!);
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
    return { requiresRegistration: data.requiresRegistration, registrationToken: data.registrationToken };
  }

  async function register(email: string, password: string, nombre: string, telefono?: string, registrationToken?: string) {
    const data = await authApi.registrar({ email, password, nombre, telefono, registrationToken });
    saveSession(data.accessToken, data.refreshToken);
    setAccessToken(data.accessToken);
    setUser(data.user);
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // ignorar error — el token puede estar expirado
    }
    clearSession();
    setAccessToken(null);
    setUser(null);
  }

  async function requestOtp(email: string) {
    await authApi.solicitarOtp(email);
  }

  async function requestPasswordReset(email: string) {
    await authApi.solicitarRestablecimiento(email);
  }

  async function restablecerContrasena(token: string, newPassword: string) {
    await authApi.restablecerContrasena(token, newPassword);
  }

  // Vuelve a leer /auth/me — se usa tras editar el perfil (nombre/teléfono)
  // para que el nombre en el nav y el resto de la app queden al día.
  async function refrescarUsuario() {
    const data = await authApi.yo();
    setUser(data);
  }

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      cargando,
      autenticado: !!user,
      login,
      completarSegundoFactor,
      loginConOtp,
      register,
      logout,
      requestOtp,
      requestPasswordReset,
      restablecerContrasena,
      refrescarUsuario,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
