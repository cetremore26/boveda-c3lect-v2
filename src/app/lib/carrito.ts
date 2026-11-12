import type { Producto } from '../data/types';
import { CLAVE_PENDING_CHECKOUT, type Almacen } from './checkoutPendiente';

// El carrito guarda solo { id, cantidad }: precio, stock y disponibilidad se
// leen siempre del catálogo vigente (resolverCarrito), nunca de una copia
// vieja en localStorage.
export const CLAVE_CARRITO = 'c3lect-cart';

// Los mismos límites que aplica la API al crear un pedido: más de 20 líneas o
// más de 10 unidades de un producto se rechazan, así que el carrito no los permite.
export const MAX_CANTIDAD_POR_PRODUCTO = 10;
export const MAX_LINEAS = 20;

export interface LineaCarrito {
  id: string;
  cantidad: number;
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}

export interface LineaNoDisponible {
  id: string;
  cantidad: number;
  motivo: 'agotado' | 'retirado';
  producto: Producto | null;
}

export interface EstadoCarrito {
  lineas: LineaCarrito[];
  isOpen: boolean;
}

export type AccionCarrito =
  | { type: 'ADD'; id: string; max?: number }
  | { type: 'REMOVE'; id: string }
  | { type: 'UPDATE_QTY'; id: string; cantidad: number; max?: number }
  | { type: 'CLEAR' | 'OPEN' | 'CLOSE' | 'TOGGLE' };

/** Tope efectivo de unidades: el stock (si se conoce) y nunca más que MAX_CANTIDAD_POR_PRODUCTO. */
export function topeDeCantidad(stock: number | undefined | null): number {
  return stock != null ? Math.min(stock, MAX_CANTIDAD_POR_PRODUCTO) : MAX_CANTIDAD_POR_PRODUCTO;
}

/** true si `id` ya está en el carrito o aún cabe una línea más. */
export function puedeAgregar(lineas: LineaCarrito[], id: string): boolean {
  return lineas.some((l) => l.id === id) || lineas.length < MAX_LINEAS;
}

export function carritoReducer(state: EstadoCarrito, action: AccionCarrito): EstadoCarrito {
  switch (action.type) {
    case 'ADD': {
      const tope = topeDeCantidad(action.max);
      const existente = state.lineas.find((l) => l.id === action.id);
      if (existente) {
        const cantidad = Math.min(existente.cantidad + 1, tope);
        return {
          ...state,
          isOpen: true,
          lineas: state.lineas.map((l) => (l.id === action.id ? { ...l, cantidad } : l)),
        };
      }
      // Sin stock o con el carrito lleno no se agrega, pero se abre para que se vea por qué.
      if (tope < 1 || !puedeAgregar(state.lineas, action.id)) return { ...state, isOpen: true };
      return { ...state, isOpen: true, lineas: [...state.lineas, { id: action.id, cantidad: 1 }] };
    }
    case 'REMOVE':
      return { ...state, lineas: state.lineas.filter((l) => l.id !== action.id) };
    case 'UPDATE_QTY': {
      if (action.cantidad < 1) {
        return { ...state, lineas: state.lineas.filter((l) => l.id !== action.id) };
      }
      const cantidad = Math.min(action.cantidad, topeDeCantidad(action.max));
      return {
        ...state,
        lineas: state.lineas.map((l) => (l.id === action.id ? { ...l, cantidad } : l)),
      };
    }
    case 'CLEAR':
      return { ...state, lineas: [] };
    case 'OPEN':
      return { ...state, isOpen: true };
    case 'CLOSE':
      return { ...state, isOpen: false };
    case 'TOGGLE':
      return { ...state, isOpen: !state.isOpen };
    default:
      return state;
  }
}

function idDeEntrada(entrada: Record<string, unknown>): unknown {
  if ('id' in entrada) return entrada.id;
  // Formato viejo: [{ producto: { ...copia completa }, cantidad }].
  const producto = entrada.producto;
  return typeof producto === 'object' && producto !== null ? (producto as { id?: unknown }).id : undefined;
}

/**
 * Lee el carrito guardado. Acepta { id, cantidad } y el formato viejo
 * { producto: { id }, cantidad }; descarta lo que no sea válido. Nunca lanza.
 */
export function leerLineasGuardadas(almacen: Almacen): LineaCarrito[] {
  let datos: unknown;
  try {
    const crudo = almacen.getItem(CLAVE_CARRITO);
    if (crudo === null) return [];
    datos = JSON.parse(crudo);
  } catch {
    return [];
  }
  if (!Array.isArray(datos)) return [];

  const lineas: LineaCarrito[] = [];
  for (const entrada of datos) {
    if (typeof entrada !== 'object' || entrada === null) continue;
    const id = idDeEntrada(entrada as Record<string, unknown>);
    const cantidad = (entrada as { cantidad?: unknown }).cantidad;
    if (typeof id !== 'string' || id === '') continue;
    if (typeof cantidad !== 'number' || !Number.isInteger(cantidad) || cantidad < 1) continue;

    const repetida = lineas.find((l) => l.id === id);
    if (repetida) {
      repetida.cantidad = Math.min(repetida.cantidad + cantidad, MAX_CANTIDAD_POR_PRODUCTO);
    } else if (lineas.length < MAX_LINEAS) {
      lineas.push({ id, cantidad: Math.min(cantidad, MAX_CANTIDAD_POR_PRODUCTO) });
    }
  }
  return lineas;
}

export function guardarLineas(almacen: Almacen, lineas: LineaCarrito[]): void {
  try {
    almacen.setItem(CLAVE_CARRITO, JSON.stringify(lineas.map(({ id, cantidad }) => ({ id, cantidad }))));
  } catch {
    // Almacenamiento no disponible (modo privado o cuota llena): el carrito sigue en memoria.
  }
}

export function borrarCarritoGuardado(almacen: Almacen): void {
  try {
    almacen.removeItem(CLAVE_CARRITO);
    almacen.removeItem(CLAVE_PENDING_CHECKOUT);
  } catch {
    // Almacenamiento no disponible: no hay nada que borrar.
  }
}

/**
 * Cruza las líneas guardadas con el catálogo vigente. Si el catálogo no está
 * listo (cargando o con error) no decide nada: listas vacías y resolviendo,
 * para no marcar como retirado lo que simplemente aún no se ha cargado.
 */
export function resolverCarrito(
  lineas: LineaCarrito[],
  productos: Producto[],
  catalogoListo: boolean,
): { items: CartItem[]; noDisponibles: LineaNoDisponible[]; resolviendo: boolean } {
  if (!catalogoListo) return { items: [], noDisponibles: [], resolviendo: true };

  const porId = new Map(productos.map((p) => [p.id, p]));
  const items: CartItem[] = [];
  const noDisponibles: LineaNoDisponible[] = [];
  for (const { id, cantidad } of lineas) {
    const producto = porId.get(id);
    if (!producto) {
      noDisponibles.push({ id, cantidad, motivo: 'retirado', producto: null });
    } else if (!producto.disponible || producto.stock === 0) {
      noDisponibles.push({ id, cantidad, motivo: 'agotado', producto });
    } else {
      items.push({ producto, cantidad: Math.min(cantidad, topeDeCantidad(producto.stock)) });
    }
  }
  return { items, noDisponibles, resolviendo: false };
}
