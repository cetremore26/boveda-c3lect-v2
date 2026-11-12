export interface EstadoRegistro {
  email: string;
  registrationToken?: string;
}

/** Lee el state de navegación hacia /registro; null si no es válido. */
export function leerEstadoRegistro(state: unknown): EstadoRegistro | null {
  if (!state || typeof state !== 'object') return null;
  const { email, registrationToken } = state as Record<string, unknown>;
  if (typeof email !== 'string' || email === '') return null;
  return typeof registrationToken === 'string' ? { email, registrationToken } : { email };
}
