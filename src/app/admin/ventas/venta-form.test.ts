import { describe, it, expect } from 'vitest';
import { recalcEstado, datosDesdeForm, EMPTY_FORM } from './venta-form';

const base = { ...EMPTY_FORM, precioVenta: '100000' };

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
    const f = { ...EMPTY_FORM, precioVenta: pv, abono: '5', estado: 'Uso Personal' };
    expect(recalcEstado(f)).toEqual(f);
  });
});

describe('datosDesdeForm', () => {
  it('convierte números y vacíos opcionales a undefined', () => {
    const d = datosDesdeForm({
      ...EMPTY_FORM,
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
