import { describe, it, expect, vi } from 'vitest';
import { recalcEstado, datosDesdeForm, formVacio, puedeEliminarVenta } from './venta-form';

const base = { ...formVacio(), precioVenta: '100000' };

describe('recalcEstado', () => {
  it('abono completo -> Pagado', () => {
    expect(recalcEstado({ ...base, abono: '100000', estado: 'Pendiente' }).estado).toBe('Pagado');
  });
  it('abono parcial -> Abonado', () => {
    expect(recalcEstado({ ...base, abono: '50000' }).estado).toBe('Abonado');
  });
  it('sin abono -> Pendiente', () => {
    expect(recalcEstado({ ...base, abono: '' }).estado).toBe('Pendiente');
  });
  it.each(['', '0'])('precioVenta "%s" conserva el estado', (pv) => {
    const f = { ...formVacio(), precioVenta: pv, abono: '5', estado: 'Uso Personal' };
    expect(recalcEstado(f)).toEqual(f);
  });
});

describe('datosDesdeForm', () => {
  it('convierte números y vacíos opcionales a undefined', () => {
    const d = datosDesdeForm({
      ...formVacio(),
      precioVenta: '100000',
      costoProducto: '60000',
      costoEnvio: '5000',
      abono: '20000',
      celular: '',
      estilo: '',
      fuente: '',
    });
    expect(d.precioVenta).toBe(100000);
    expect(d.costoProducto).toBe(60000);
    expect(d.costoEnvio).toBe(5000);
    expect(d.abono).toBe(20000);
    expect(d.celular).toBeUndefined();
    expect(d.estilo).toBeUndefined();
    expect(d.fuente).toBeUndefined();
  });
});

describe('formVacio', () => {
  it('fecha con el día de hoy en cada llamada', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 10, 3, 9));
    expect(formVacio().fecha).toBe('2026-11-03');
    vi.setSystemTime(new Date(2026, 10, 5, 21));
    expect(formVacio().fecha).toBe('2026-11-05');
    vi.useRealTimers();
  });
});

describe('puedeEliminarVenta', () => {
  it('permite borrar una venta manual', () => {
    expect(puedeEliminarVenta({ orderId: null })).toBe(true);
    expect(puedeEliminarVenta({})).toBe(true);
  });
  it('no permite borrar una venta que viene de un pedido', () => {
    expect(puedeEliminarVenta({ orderId: 'ord-1' })).toBe(false);
  });
});
