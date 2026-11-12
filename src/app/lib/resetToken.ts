// Token de restablecimiento de contraseña.
//
// El enlace del correo lleva el token en el fragmento (`/reset-password#token=<id>.<secreto>`):
// el fragmento no viaja al servidor ni en el Referer. La API vieja usaba `?token=`, que se
// sigue aceptando mientras convivan ambas versiones.

let tokenCapturado: string | null = null;

export function extraerTokenDeReset(hash: string, search: string): string | null {
  const desdeHash = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  if (desdeHash) return desdeHash;
  const desdeQuery = new URLSearchParams(search).get('token');
  return desdeQuery || null;
}

/**
 * Guarda el token en memoria y deja la URL en `/reset-password` a secas.
 * Debe correr ANTES de initMetaPixel() para que el Pixel nunca vea el token.
 */
export function capturarTokenDeReset(
  loc: Pick<Location, 'pathname' | 'hash' | 'search'> = window.location,
  hist: Pick<History, 'replaceState' | 'state'> = window.history,
): void {
  if (!loc.pathname.startsWith('/reset-password')) return;
  const token = extraerTokenDeReset(loc.hash, loc.search);
  if (token) tokenCapturado = token;
  hist.replaceState(hist.state, '', loc.pathname);
}

/** No lo borra: StrictMode monta el componente dos veces. */
export function tokenDeResetCapturado(): string | null {
  return tokenCapturado;
}
