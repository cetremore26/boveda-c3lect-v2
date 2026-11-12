import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from "react";
import type { Producto } from "../data/types";
import { usePrecioDe } from "../hooks/usePrecio";
import { useProductos } from "./ProductosContext";
import { escucharSesionCerrada } from "../lib/sesion";
import {
  carritoReducer,
  leerLineasGuardadas,
  guardarLineas,
  resolverCarrito,
  puedeAgregar,
  MAX_LINEAS,
  type CartItem,
  type LineaNoDisponible,
} from "../lib/carrito";

export type { CartItem, LineaNoDisponible };
export { formatPrecio } from '../lib/format';

interface CartContextValue {
  /** Solo productos comprables, con el producto y la cantidad del catálogo vigente. */
  items: CartItem[];
  /** Líneas guardadas que ya no se pueden comprar (agotadas o retiradas del catálogo). */
  noDisponibles: LineaNoDisponible[];
  /** true mientras el catálogo no ha cargado (o falló): aún no se sabe qué es comprable. */
  resolviendo: boolean;
  /** true si el carrito ya tiene MAX_LINEAS productos distintos. */
  lleno: boolean;
  isOpen: boolean;
  /** Devuelve false si el producto no cabe (carrito lleno). */
  addItem: (producto: Producto) => boolean;
  removeItem: (id: string) => void;
  updateQty: (id: string, cantidad: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function leerCarritoInicial() {
  try {
    return leerLineasGuardadas(localStorage);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(carritoReducer, undefined, () => ({
    lineas: leerCarritoInicial(),
    isOpen: false,
  }));
  const { productos, cargando, error } = useProductos();
  const catalogoListo = !cargando && !error;
  const precioDe = usePrecioDe();

  useEffect(() => {
    try {
      guardarLineas(localStorage, state.lineas);
    } catch {
      // localStorage no disponible: el carrito sigue en memoria.
    }
  }, [state.lineas]);

  useEffect(
    () => escucharSesionCerrada((m) => {
      if (m === "logout") dispatch({ type: "CLEAR" });
    }),
    [],
  );

  const resuelto = useMemo(
    () => resolverCarrito(state.lineas, productos, catalogoListo),
    [state.lineas, productos, catalogoListo],
  );
  // Un carrito vacío no tiene nada que resolver: no se queda "cargando".
  const resolviendo = resuelto.resolviendo && state.lineas.length > 0;

  // Suma de lo guardado (no de lo resuelto) para que el contador del menú
  // aparezca antes de que cargue el catálogo.
  const totalItems = state.lineas.reduce((acc, l) => acc + l.cantidad, 0);
  // Precio tomado del catálogo vigente en cada render. El cobro real siempre
  // lo recalcula el backend.
  const totalPrice = resuelto.items.reduce(
    (acc, i) => acc + precioDe(i.producto).precioFinal * i.cantidad,
    0,
  );

  function addItem(producto: Producto): boolean {
    const cabe = puedeAgregar(state.lineas, producto.id);
    dispatch({ type: "ADD", id: producto.id, max: producto.stock });
    return cabe;
  }

  function updateQty(id: string, cantidad: number) {
    const max = productos.find((p) => p.id === id)?.stock;
    dispatch({ type: "UPDATE_QTY", id, cantidad, max });
  }

  return (
    <CartContext.Provider
      value={{
        items: resuelto.items,
        noDisponibles: resuelto.noDisponibles,
        resolviendo,
        lleno: state.lineas.length >= MAX_LINEAS,
        isOpen: state.isOpen,
        addItem,
        removeItem: (id) => dispatch({ type: "REMOVE", id }),
        updateQty,
        clearCart: () => dispatch({ type: "CLEAR" }),
        openCart: () => dispatch({ type: "OPEN" }),
        closeCart: () => dispatch({ type: "CLOSE" }),
        toggleCart: () => dispatch({ type: "TOGGLE" }),
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
