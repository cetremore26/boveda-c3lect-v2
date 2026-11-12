import { arrayMove } from '@dnd-kit/sortable';
import type { ProductoAdmin } from '../../api/products';

/** Nuevo orden al soltar `activoId` sobre `sobreId`; si algún id no existe, no cambia nada. */
export function moverEnOrden(ids: string[], activoId: string, sobreId: string): string[] {
  const desde = ids.indexOf(activoId);
  const hasta = ids.indexOf(sobreId);
  if (desde === -1 || hasta === -1) return ids;
  return arrayMove(ids, desde, hasta);
}

/** Posiciones (desde 1) que difieren de las actuales del servidor. */
export function cambiosDeOrden(
  idsEnOrden: string[],
  productos: Pick<ProductoAdmin, 'id' | 'destacadoOrden'>[],
): { id: string; destacadoOrden: number }[] {
  return idsEnOrden
    .map((id, i) => ({ id, destacadoOrden: i + 1 }))
    .filter(({ id, destacadoOrden }) => productos.find((p) => p.id === id)?.destacadoOrden !== destacadoOrden);
}
