import type { Almacen } from '../app/lib/checkoutPendiente';

export function almacenMemoria(): Almacen {
  const datos = new Map<string, string>();
  return {
    getItem: (k) => datos.get(k) ?? null,
    setItem: (k, v) => {
      datos.set(k, String(v));
    },
    removeItem: (k) => {
      datos.delete(k);
    },
  };
}
