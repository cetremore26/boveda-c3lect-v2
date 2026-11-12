import { describe, it, expect } from 'vitest';
import { moverEnOrden, cambiosDeOrden } from './orden-destacados';

describe('orden-destacados', () => {
  it('moverEnOrden mueve el activo a la posición del destino', () =>
    expect(moverEnOrden(['a', 'b', 'c'], 'c', 'a')).toEqual(['c', 'a', 'b']));
  it('moverEnOrden con id desconocido no cambia nada', () =>
    expect(moverEnOrden(['a', 'b'], 'z', 'a')).toEqual(['a', 'b']));
  it('cambiosDeOrden solo devuelve las posiciones que cambian', () =>
    expect(cambiosDeOrden(['b', 'a', 'c'], [{ id: 'a', destacadoOrden: 1 }, { id: 'b', destacadoOrden: 2 }, { id: 'c', destacadoOrden: 3 }]))
      .toEqual([{ id: 'b', destacadoOrden: 1 }, { id: 'a', destacadoOrden: 2 }]));
});
