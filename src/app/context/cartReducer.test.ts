import { describe, it, expect, vi } from 'vitest';

vi.mock('../hooks/usePrecio', () => ({ usePrecioDe: vi.fn() }));

import { cartReducer, type CartState } from './CartContext';
import type { Producto } from '../data/types';

const prod = (stock: number, id = 'p1') => ({ id, stock }) as unknown as Producto;
const vacio: CartState = { items: [], isOpen: false };

describe('cartReducer', () => {
  it('ADD a carrito vacío añade 1 ítem y abre', () => {
    const s = cartReducer(vacio, { type: 'ADD', producto: prod(3) });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].cantidad).toBe(1);
    expect(s.isOpen).toBe(true);
  });

  it('ADD repetido suma 1', () => {
    let s = cartReducer(vacio, { type: 'ADD', producto: prod(3) });
    s = cartReducer(s, { type: 'ADD', producto: prod(3) });
    expect(s.items).toHaveLength(1);
    expect(s.items[0].cantidad).toBe(2);
  });

  it('ADD no supera el stock', () => {
    let s = cartReducer(vacio, { type: 'ADD', producto: prod(1) });
    s = cartReducer(s, { type: 'ADD', producto: prod(1) });
    expect(s.items[0].cantidad).toBe(1);
  });

  it('ADD con stock 0 no añade ítem pero abre', () => {
    const s = cartReducer(vacio, { type: 'ADD', producto: prod(0) });
    expect(s.items).toHaveLength(0);
    expect(s.isOpen).toBe(true);
  });

  it('UPDATE_QTY con 0 elimina', () => {
    const s0 = cartReducer(vacio, { type: 'ADD', producto: prod(3) });
    const s = cartReducer(s0, { type: 'UPDATE_QTY', id: 'p1', cantidad: 0 });
    expect(s.items).toHaveLength(0);
  });

  it('UPDATE_QTY se limita al stock', () => {
    const s0 = cartReducer(vacio, { type: 'ADD', producto: prod(3) });
    const s = cartReducer(s0, { type: 'UPDATE_QTY', id: 'p1', cantidad: 99 });
    expect(s.items[0].cantidad).toBe(3);
  });

  it('REMOVE quita el ítem', () => {
    const s0 = cartReducer(vacio, { type: 'ADD', producto: prod(3) });
    expect(cartReducer(s0, { type: 'REMOVE', id: 'p1' }).items).toHaveLength(0);
  });

  it('CLEAR vacía ítems y conserva isOpen', () => {
    const s0 = cartReducer(vacio, { type: 'ADD', producto: prod(3) });
    const s = cartReducer(s0, { type: 'CLEAR' });
    expect(s.items).toHaveLength(0);
    expect(s.isOpen).toBe(true);
  });

  it('TOGGLE alterna', () => {
    const a = cartReducer(vacio, { type: 'TOGGLE' });
    expect(a.isOpen).toBe(true);
    expect(cartReducer(a, { type: 'TOGGLE' }).isOpen).toBe(false);
  });
});
