import { describe, it, expect } from 'vitest';
import {
  carritoReducer,
  leerLineasGuardadas,
  guardarLineas,
  borrarCarritoGuardado,
  resolverCarrito,
  puedeAgregar,
  MAX_CANTIDAD_POR_PRODUCTO,
  MAX_LINEAS,
  type EstadoCarrito,
} from './carrito';
import type { Producto } from '../data/types';
import { almacenMemoria } from '../../test/almacenMemoria';

const p = (id: string, extra: Partial<Producto> = {}) => ({ id, disponible: true, stock: 5, ...extra }) as Producto;
const vacio: EstadoCarrito = { lineas: [], isOpen: false };

it('ADD respeta max y UPDATE_QTY < 1 elimina', () => {
  let s = carritoReducer({ lineas: [], isOpen: false }, { type: 'ADD', id: 'a', max: 1 });
  s = carritoReducer(s, { type: 'ADD', id: 'a', max: 1 });
  expect(s.lineas).toEqual([{ id: 'a', cantidad: 1 }]);
  expect(carritoReducer(s, { type: 'UPDATE_QTY', id: 'a', cantidad: 0 }).lineas).toEqual([]);
});
it('ADD con max 0 no agrega', () =>
  expect(carritoReducer({ lineas: [], isOpen: false }, { type: 'ADD', id: 'a', max: 0 }).lineas).toEqual([]));
it('migra el formato viejo', () => {
  const a = almacenMemoria();
  a.setItem('c3lect-cart', JSON.stringify([{ producto: { id: 'a', stock: 9 }, cantidad: 2 }, { id: 'b', cantidad: 1 }]));
  expect(leerLineasGuardadas(a)).toEqual([{ id: 'a', cantidad: 2 }, { id: 'b', cantidad: 1 }]);
});
it.each(['{roto', '{"no":"array"}'])('JSON inválido %s → []', (v) => {
  const a = almacenMemoria(); a.setItem('c3lect-cart', v); expect(leerLineasGuardadas(a)).toEqual([]);
});
it('descarta líneas inválidas', () => {
  const a = almacenMemoria();
  a.setItem('c3lect-cart', JSON.stringify([{ id: 'a', cantidad: 0 }, { id: 1, cantidad: 1 }, { id: 'b', cantidad: 1.5 }, { id: 'c', cantidad: 1 }]));
  expect(leerLineasGuardadas(a)).toEqual([{ id: 'c', cantidad: 1 }]);
});
it('guardarLineas solo persiste id y cantidad', () => {
  const a = almacenMemoria(); guardarLineas(a, [{ id: 'a', cantidad: 2 }]);
  expect(a.getItem('c3lect-cart')).toBe('[{"id":"a","cantidad":2}]');
});
it('borrarCarritoGuardado borra carrito y pendingCheckout', () => {
  const a = almacenMemoria(); a.setItem('c3lect-cart', '[]'); a.setItem('c3lect-pending-checkout', '{"creadoEn":1}');
  borrarCarritoGuardado(a);
  expect([a.getItem('c3lect-cart'), a.getItem('c3lect-pending-checkout')]).toEqual([null, null]);
});
it('resuelve disponibles, agotados y retirados y ajusta al stock vigente', () => {
  const r = resolverCarrito(
    [{ id: 'a', cantidad: 4 }, { id: 'b', cantidad: 1 }, { id: 'c', cantidad: 1 }, { id: 'x', cantidad: 2 }],
    [p('a', { stock: 2 }), p('b', { disponible: false }), p('c', { stock: 0 })], true);
  expect(r.items.map((i) => [i.producto.id, i.cantidad])).toEqual([['a', 2]]);
  expect(r.noDisponibles.map((l) => [l.id, l.motivo])).toEqual([['b', 'agotado'], ['c', 'agotado'], ['x', 'retirado']]);
  expect(r.noDisponibles[2].producto).toBeNull();
  expect(r.resolviendo).toBe(false);
});
it('con el catálogo sin cargar no marca nada como retirado', () =>
  expect(resolverCarrito([{ id: 'a', cantidad: 1 }], [], false)).toEqual({ items: [], noDisponibles: [], resolviendo: true }));

describe('casos adicionales', () => {
  it('sin clave guardada → []', () => expect(leerLineasGuardadas(almacenMemoria())).toEqual([]));

  it('descarta entradas que no son objetos y JSON null', () => {
    const a = almacenMemoria();
    a.setItem('c3lect-cart', JSON.stringify([null, 3, 'x', { producto: null, cantidad: 1 }, { producto: { id: 2 }, cantidad: 1 }, { id: 'ok', cantidad: 1 }]));
    expect(leerLineasGuardadas(a)).toEqual([{ id: 'ok', cantidad: 1 }]);
    a.setItem('c3lect-cart', 'null');
    expect(leerLineasGuardadas(a)).toEqual([]);
  });

  it('el almacén que lanza al leer → []', () => {
    const a = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => {}, removeItem: () => {} };
    expect(leerLineasGuardadas(a)).toEqual([]);
  });

  it('guardarLineas no lanza si el almacén falla', () => {
    const a = { getItem: () => null, setItem: () => { throw new Error('cuota'); }, removeItem: () => {} };
    expect(() => guardarLineas(a, [{ id: 'a', cantidad: 1 }])).not.toThrow();
  });

  it('producto sin stock conocido conserva la cantidad', () => {
    const r = resolverCarrito([{ id: 'a', cantidad: 3 }], [p('a', { stock: undefined })], true);
    expect(r.items[0].cantidad).toBe(3);
  });

  it('agotado conserva el producto del catálogo', () => {
    const prod = p('b', { disponible: false });
    expect(resolverCarrito([{ id: 'b', cantidad: 1 }], [prod], true).noDisponibles[0].producto).toBe(prod);
  });
});

describe('reducer (caracterización de la Fase 0, adaptada a líneas)', () => {
  it('ADD a carrito vacío añade 1 línea y abre', () => {
    const s = carritoReducer(vacio, { type: 'ADD', id: 'p1', max: 3 });
    expect(s.lineas).toEqual([{ id: 'p1', cantidad: 1 }]);
    expect(s.isOpen).toBe(true);
  });

  it('ADD repetido suma 1', () => {
    let s = carritoReducer(vacio, { type: 'ADD', id: 'p1', max: 3 });
    s = carritoReducer(s, { type: 'ADD', id: 'p1', max: 3 });
    expect(s.lineas).toEqual([{ id: 'p1', cantidad: 2 }]);
  });

  it('ADD con max 0 no añade línea pero abre', () => {
    const s = carritoReducer(vacio, { type: 'ADD', id: 'p1', max: 0 });
    expect(s.lineas).toHaveLength(0);
    expect(s.isOpen).toBe(true);
  });

  it('UPDATE_QTY se limita al max', () => {
    const s0 = carritoReducer(vacio, { type: 'ADD', id: 'p1', max: 3 });
    expect(carritoReducer(s0, { type: 'UPDATE_QTY', id: 'p1', cantidad: 99, max: 3 }).lineas[0].cantidad).toBe(3);
  });

  it('REMOVE quita la línea', () => {
    const s0 = carritoReducer(vacio, { type: 'ADD', id: 'p1', max: 3 });
    expect(carritoReducer(s0, { type: 'REMOVE', id: 'p1' }).lineas).toHaveLength(0);
  });

  it('CLEAR vacía líneas y conserva isOpen', () => {
    const s0 = carritoReducer(vacio, { type: 'ADD', id: 'p1', max: 3 });
    const s = carritoReducer(s0, { type: 'CLEAR' });
    expect(s.lineas).toHaveLength(0);
    expect(s.isOpen).toBe(true);
  });

  it('TOGGLE alterna, OPEN y CLOSE', () => {
    const a = carritoReducer(vacio, { type: 'TOGGLE' });
    expect(a.isOpen).toBe(true);
    expect(carritoReducer(a, { type: 'TOGGLE' }).isOpen).toBe(false);
    expect(carritoReducer(vacio, { type: 'OPEN' }).isOpen).toBe(true);
    expect(carritoReducer(a, { type: 'CLOSE' }).isOpen).toBe(false);
  });
});

describe('límites de la API', () => {
  const lleno = (n: number): EstadoCarrito => ({
    lineas: Array.from({ length: n }, (_, i) => ({ id: `p${i}`, cantidad: 1 })),
    isOpen: false,
  });

  it('los límites son 10 unidades por producto y 20 líneas', () => {
    expect(MAX_CANTIDAD_POR_PRODUCTO).toBe(10);
    expect(MAX_LINEAS).toBe(20);
  });

  it('ADD no pasa de 10 unidades aunque el stock sea mayor o desconocido', () => {
    let s = vacio;
    for (let i = 0; i < 15; i++) s = carritoReducer(s, { type: 'ADD', id: 'a', max: 50 });
    expect(s.lineas).toEqual([{ id: 'a', cantidad: 10 }]);
    let t = vacio;
    for (let i = 0; i < 15; i++) t = carritoReducer(t, { type: 'ADD', id: 'a' });
    expect(t.lineas).toEqual([{ id: 'a', cantidad: 10 }]);
  });

  it('UPDATE_QTY no pasa de 10 unidades', () => {
    const s = carritoReducer({ lineas: [{ id: 'a', cantidad: 1 }], isOpen: false }, { type: 'UPDATE_QTY', id: 'a', cantidad: 99 });
    expect(s.lineas).toEqual([{ id: 'a', cantidad: 10 }]);
  });

  it('ADD de un producto nuevo con 20 líneas se rechaza', () => {
    const s = carritoReducer(lleno(20), { type: 'ADD', id: 'nuevo', max: 5 });
    expect(s.lineas).toHaveLength(20);
    expect(s.lineas.some((l) => l.id === 'nuevo')).toBe(false);
  });

  it('con 20 líneas sí se puede sumar a una existente', () => {
    const s = carritoReducer(lleno(20), { type: 'ADD', id: 'p0', max: 5 });
    expect(s.lineas[0]).toEqual({ id: 'p0', cantidad: 2 });
  });

  it('puedeAgregar indica si el producto cabe', () => {
    expect(puedeAgregar(lleno(19).lineas, 'nuevo')).toBe(true);
    expect(puedeAgregar(lleno(20).lineas, 'nuevo')).toBe(false);
    expect(puedeAgregar(lleno(20).lineas, 'p3')).toBe(true);
  });

  it('resolverCarrito ajusta a 10 aunque haya más stock', () => {
    const r = resolverCarrito([{ id: 'a', cantidad: 50 }], [p('a', { stock: 99 })], true);
    expect(r.items[0].cantidad).toBe(10);
  });

  it('leerLineasGuardadas recorta a 10 unidades y 20 líneas', () => {
    const a = almacenMemoria();
    a.setItem('c3lect-cart', JSON.stringify(Array.from({ length: 25 }, (_, i) => ({ id: `p${i}`, cantidad: 30 }))));
    const lineas = leerLineasGuardadas(a);
    expect(lineas).toHaveLength(20);
    expect(lineas.every((l) => l.cantidad === 10)).toBe(true);
  });

  it('leerLineasGuardadas une ids repetidos sin perder unidades', () => {
    const a = almacenMemoria();
    a.setItem('c3lect-cart', JSON.stringify([{ id: 'a', cantidad: 2 }, { producto: { id: 'a' }, cantidad: 3 }]));
    expect(leerLineasGuardadas(a)).toEqual([{ id: 'a', cantidad: 5 }]);
  });
});
