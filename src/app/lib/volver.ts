// "Volver a donde estaba" después de iniciar sesión o registrarse.
//
// Quien manda al login pasa la ruta actual en ?volver=; Login y Register la
// leen y navegan ahí al terminar (antes iban siempre a /catalog). El valor
// llega por la URL, así que cualquiera puede armar un enlace con él: solo se
// aceptan rutas internas de la tienda, nunca otro dominio.

export const PARAM_VOLVER = "volver";

const DESTINO_POR_DEFECTO = "/catalog";

// Volver a una pantalla de acceso después de entrar no tiene sentido.
const RUTAS_DE_ACCESO = ["/login", "/register", "/reset-password"];

/** Devuelve `valor` si es una ruta interna aceptable; si no, el destino por defecto. */
export function destinoSeguro(
  valor: string | null | undefined,
  origen: string = typeof window !== "undefined" ? window.location.origin : "http://localhost",
): string {
  if (!valor || !valor.startsWith("/")) return DESTINO_POR_DEFECTO;
  try {
    // El parser de URL descarta tabuladores y saltos de línea y trata "\" como
    // "/", así que "/	/evil.com" acabaría siendo "//evil.com": se valida el
    // resultado, no el texto.
    const url = new URL(valor, origen);
    if (url.origin !== origen || RUTAS_DE_ACCESO.includes(url.pathname)) return DESTINO_POR_DEFECTO;
    const destino = url.pathname + url.search + url.hash;
    // "/.//evil.com" resuelve al mismo origen con pathname "//evil.com": un
    // consumidor que lo asigne a location lo trataría como protocolo-relativo.
    if (destino.startsWith("//") || destino.startsWith("/\\")) return DESTINO_POR_DEFECTO;
    return destino;
  } catch {
    return DESTINO_POR_DEFECTO;
  }
}

/** `/login` (o `/register`) recordando a dónde volver después. */
export function rutaDeAcceso(destino: string, pantalla: "/login" | "/register" = "/login"): string {
  const seguro = destinoSeguro(destino);
  return seguro === DESTINO_POR_DEFECTO
    ? pantalla
    : `${pantalla}?${PARAM_VOLVER}=${encodeURIComponent(seguro)}`;
}
