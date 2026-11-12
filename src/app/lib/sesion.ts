export const EVENTO_SESION_CERRADA = 'c3lect:sesion-cerrada';

export type MotivoCierre = 'expirada' | 'logout';

/** Rutas que exigen sesión: /cuenta, /admin (y subrutas) y exactamente /checkout. */
export function esRutaProtegida(pathname: string): boolean {
  const p = pathname;
  return (
    p === '/cuenta' || p.startsWith('/cuenta/') ||
    p === '/admin' || p.startsWith('/admin/') ||
    p === '/checkout'
  );
}

export function borrarSesionGuardada(): void {
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('authUser');
}

export function emitirSesionCerrada(motivo: MotivoCierre): void {
  window.dispatchEvent(new CustomEvent(EVENTO_SESION_CERRADA, { detail: { motivo } }));
}

export function escucharSesionCerrada(handler: (motivo: MotivoCierre) => void): () => void {
  const listener = (e: Event) => handler((e as CustomEvent<{ motivo: MotivoCierre }>).detail.motivo);
  window.addEventListener(EVENTO_SESION_CERRADA, listener);
  return () => window.removeEventListener(EVENTO_SESION_CERRADA, listener);
}
