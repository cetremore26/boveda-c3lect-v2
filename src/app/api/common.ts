export interface PaginaMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface Paginado<T> {
  data: T[];
  meta: PaginaMeta;
}

/** Parámetros de query: los vacíos no se envían. */
export function params(
  values: Record<string, string | number | boolean | undefined | null>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(values)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => [k, String(v)]),
  );
}

/**
 * Mensaje de error de una petición fallida. Lee estructuralmente
 * `err.response.data.message` (sin importar axios); si no hay un mensaje
 * utilizable devuelve `fallback`.
 */
export function mensajeDeError(err: unknown, fallback: string): string {
  const message = (err as { response?: { data?: { message?: unknown } } } | null | undefined)
    ?.response?.data?.message;
  if (typeof message === 'string' && message.length > 0) return message;
  if (Array.isArray(message)) {
    const textos = message.filter((m): m is string => typeof m === 'string' && m.length > 0);
    if (textos.length > 0) return textos.join(', ');
  }
  return fallback;
}
