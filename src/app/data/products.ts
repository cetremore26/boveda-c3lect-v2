import { supabase } from "../supabase";
import type { Producto } from "./types";

// La tienda lee el catálogo de la vista `catalogo_publico` (migración
// 20261029000000 en c3lect-api), no de las tablas. La vista es el contrato:
// ya filtra los productos incompletos, sanea el estilo "N/A", cruza el stock
// con inventario y calcula el precio con promociones. Aquí no se replica
// ninguna regla del negocio; solo se mapea de snake_case al modelo de la UI.
// Se lee de Supabase (y no de la API) para no depender de que el servidor de
// Render esté despierto.
const COLUMNAS =
  "id, nombre, estilo, display, precio, disponible, destacado, destacado_orden, cat, marca, genero, imgs, " +
  "spec_movimiento, spec_dimensiones, spec_caja, spec_correa, spec_cristal, spec_funciones, " +
  "spec_resistencia_agua, spec_peso, spec_bateria, spec_reserva_marcha, spec_observaciones, " +
  "notas_descripcion, notas_top, notas_corazon, notas_base, " +
  "stock, descuento_invitado, descuento_cuenta, precio_final_invitado, precio_final_cuenta";

// Fila de la vista `catalogo_publico`, tal como la devuelve Supabase.
interface FilaCatalogo {
  id: string;
  nombre: string;
  estilo: string;
  display: string;
  precio: number;
  disponible: boolean;
  destacado: boolean | null;
  destacado_orden: number | null;
  stock: number | null;
  cat: Producto["cat"];
  marca: string | null;
  genero: Producto["genero"] | null;
  imgs: string[];
  spec_movimiento: string | null;
  spec_dimensiones: string;
  spec_caja: string;
  spec_correa: string;
  spec_cristal: string;
  spec_funciones: string;
  spec_resistencia_agua: string;
  spec_peso: string;
  spec_bateria: string;
  spec_reserva_marcha: string;
  spec_observaciones: string;
  notas_descripcion: string | null;
  notas_top: string;
  notas_corazon: string;
  notas_base: string;
  descuento_invitado: number;
  descuento_cuenta: number;
  precio_final_invitado: number;
  precio_final_cuenta: number;
}

export async function getProductos(): Promise<Producto[]> {
  const { data, error } = await supabase
    .from("catalogo_publico")
    .select(COLUMNAS)
    .order("cat", { ascending: false });

  if (error) throw error;

  return (data as unknown as FilaCatalogo[]).map((p) => ({
    id: p.id,
    nombre: p.nombre,
    estilo: p.estilo,
    display: p.display,
    precio: p.precio,
    disponible: p.disponible,
    destacado: p.destacado ?? false,
    destacadoOrden: p.destacado_orden ?? null,
    stock: p.stock ?? undefined,
    cat: p.cat,
    marca: p.marca ?? undefined,
    genero: p.genero ?? undefined,
    imgs: p.imgs,
    specs: p.spec_movimiento ? {
      movimiento: p.spec_movimiento,
      dimensiones: p.spec_dimensiones,
      caja: p.spec_caja,
      correa: p.spec_correa,
      cristal: p.spec_cristal,
      funciones: p.spec_funciones,
      resistenciaAgua: p.spec_resistencia_agua,
      peso: p.spec_peso,
      bateria: p.spec_bateria,
      reservaMarcha: p.spec_reserva_marcha,
      observaciones: p.spec_observaciones,
    } : undefined,
    notas: p.notas_descripcion ? {
      descripcion: p.notas_descripcion,
      notas_top: p.notas_top,
      notas_corazon: p.notas_corazon,
      notas_base: p.notas_base,
    } : undefined,
    precios: {
      invitado: { final: p.precio_final_invitado, descuento: p.descuento_invitado },
      cuenta: { final: p.precio_final_cuenta, descuento: p.descuento_cuenta },
    },
  }));
}

export function getProductoById(id: string, productos: Producto[]) {
  return productos.find((p) => p.id === id);
}
