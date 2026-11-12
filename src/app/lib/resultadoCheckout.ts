import type { PendingCheckout } from './checkoutPendiente';

export type EstadoResultado = 'success' | 'failure' | 'pending';

export function estadoDesdeRuta(pathname: string): EstadoResultado {
  if (pathname.endsWith('success')) return 'success';
  if (pathname.endsWith('failure')) return 'failure';
  return 'pending';
}

export function numeroDePedidoVisible(estado: EstadoResultado, search: string): string | null {
  if (estado !== 'success') return null;
  return new URLSearchParams(search).get('external_reference');
}

export function efectoDelResultado(
  estado: EstadoResultado,
  pendiente: PendingCheckout | null,
): { vaciarCarrito: boolean; borrarPendiente: boolean } {
  if (!pendiente) return { vaciarCarrito: false, borrarPendiente: false };
  if (estado === 'success') return { vaciarCarrito: true, borrarPendiente: true };
  if (estado === 'failure') return { vaciarCarrito: false, borrarPendiente: true };
  return { vaciarCarrito: false, borrarPendiente: false };
}

export const TEXTOS_RESULTADO: Record<
  EstadoResultado,
  { titulo: string; cuerpo: string; cta: { texto: string; a: string } }
> = {
  success: {
    titulo: 'Pago aprobado',
    cuerpo: 'Tu pago fue aprobado. En unos minutos te llegará a tu correo la confirmación del pedido.',
    cta: { texto: 'Seguir explorando', a: '/catalog' },
  },
  failure: {
    titulo: 'Pago no completado',
    cuerpo:
      'MercadoPago no aprobó el pago, así que no se creó ningún pedido. Tu carrito sigue guardado: puedes intentarlo de nuevo.',
    cta: { texto: 'Volver al checkout', a: '/checkout' },
  },
  pending: {
    titulo: 'Pago en proceso',
    cuerpo:
      'MercadoPago está procesando tu pago. Cuando se apruebe crearemos tu pedido y te avisaremos por correo. Tu carrito sigue guardado; no vuelvas a pagar mientras tanto.',
    cta: { texto: 'Seguir explorando', a: '/catalog' },
  },
};
