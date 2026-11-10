import axios from 'axios';
import { rutaDeAcceso } from '../lib/volver';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

const RUTAS_DE_AUTH = [
  '/auth/login',
  '/auth/refresh',
  '/auth/register',
  '/auth/verify-otp',
  '/auth/request-otp',
  '/auth/reset-password',
  '/auth/request-password-reset',
];

/** Un 401 de estos endpoints es una respuesta normal, no una sesión caducada. */
export function esEndpointDeAuth(url: string): boolean {
  return RUTAS_DE_AUTH.some((ruta) => url.includes(ruta));
}

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function clearSessionAndRedirect() {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('authUser');
  if (window.location.pathname !== '/login') {
    window.location.href = rutaDeAcceso(window.location.pathname + window.location.search);
  }
}

// El access token dura poco (15 min) a propósito — esto lo renueva en silencio
// con el refresh token cuando una petición falla por expirado, para que el
// admin no tenga que volver a iniciar sesión a mitad de una edición.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = sessionStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
      `${API_URL}/auth/refresh`,
      { refreshToken },
    );
    sessionStorage.setItem('accessToken', data.accessToken);
    sessionStorage.setItem('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url: string = originalRequest?.url ?? '';

    if (status !== 401 || esEndpointDeAuth(url) || !originalRequest || originalRequest._retried) {
      return Promise.reject(error);
    }
    originalRequest._retried = true;

    if (!refreshing) {
      refreshing = refreshAccessToken().finally(() => { refreshing = null; });
    }
    const newToken = await refreshing;

    if (!newToken) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${newToken}` };
    return api(originalRequest);
  },
);
