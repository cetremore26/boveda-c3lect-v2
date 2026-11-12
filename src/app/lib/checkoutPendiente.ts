export type Almacen = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const CLAVE_PENDING_CHECKOUT = 'c3lect-pending-checkout';

export interface PendingCheckout {
  creadoEn: number;
}

export function guardarPendingCheckout(almacen: Almacen, ahora: number): void {
  const valor: PendingCheckout = { creadoEn: ahora };
  almacen.setItem(CLAVE_PENDING_CHECKOUT, JSON.stringify(valor));
}

export function leerPendingCheckout(almacen: Almacen): PendingCheckout | null {
  const crudo = almacen.getItem(CLAVE_PENDING_CHECKOUT);
  if (crudo === null) return null;
  try {
    const valor: unknown = JSON.parse(crudo);
    if (typeof valor !== 'object' || valor === null) return null;
    const creadoEn = (valor as { creadoEn?: unknown }).creadoEn;
    if (typeof creadoEn !== 'number' || !Number.isFinite(creadoEn)) return null;
    return { creadoEn };
  } catch {
    return null;
  }
}

export function borrarPendingCheckout(almacen: Almacen): void {
  almacen.removeItem(CLAVE_PENDING_CHECKOUT);
}
