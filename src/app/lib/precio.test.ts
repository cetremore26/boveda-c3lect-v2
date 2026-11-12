import { describe, it, expect } from 'vitest';
import { precioEfectivo } from './precio';
import type { Producto } from '../data/types';

const precios = {
  invitado: { final: 90000, descuento: 10 },
  cuenta: { final: 80000, descuento: 20 },
} as unknown as Producto['precios'];

describe('precioEfectivo', () => {
  it('invitado usa precios.invitado.final', () => {
    const r = precioEfectivo({ precio: 100000, precios }, false);
    expect(r.precioFinal).toBe(90000);
    expect(r.descuentoPorcentaje).toBe(10);
  });

  it('autenticado usa precios.cuenta.final', () => {
    const r = precioEfectivo({ precio: 100000, precios }, true);
    expect(r.precioFinal).toBe(80000);
    expect(r.descuentoPorcentaje).toBe(20);
  });

  it('descuento > 0 marca enPromocion', () => {
    expect(precioEfectivo({ precio: 100000, precios }, true).enPromocion).toBe(true);
  });

  it('descuento 0 no está en promoción', () => {
    const p = {
      invitado: { final: 100000, descuento: 0 },
      cuenta: { final: 100000, descuento: 0 },
    } as unknown as Producto['precios'];
    expect(precioEfectivo({ precio: 100000, precios: p }, false).enPromocion).toBe(false);
  });

  it('producto sin precios usa precio', () => {
    expect(precioEfectivo({ precio: 100000 }, true)).toEqual({
      precioOriginal: 100000,
      precioFinal: 100000,
      descuentoPorcentaje: 0,
      enPromocion: false,
    });
  });

  it('precioOriginal siempre es producto.precio', () => {
    expect(precioEfectivo({ precio: 100000, precios }, false).precioOriginal).toBe(100000);
    expect(precioEfectivo({ precio: 100000, precios }, true).precioOriginal).toBe(100000);
    expect(precioEfectivo({ precio: 5 }, false).precioOriginal).toBe(5);
  });
});
