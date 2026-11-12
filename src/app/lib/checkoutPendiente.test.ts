import { describe, it, expect } from 'vitest';
import { almacenMemoria } from '../../test/almacenMemoria';
import { guardarPendingCheckout, leerPendingCheckout, borrarPendingCheckout } from './checkoutPendiente';

describe('checkoutPendiente', () => {
  it('guarda, lee y borra', () => {
    const a = almacenMemoria();
    guardarPendingCheckout(a, 1_700_000_000_000);
    expect(a.getItem('c3lect-pending-checkout')).toBe('{"creadoEn":1700000000000}');
    expect(leerPendingCheckout(a)).toEqual({ creadoEn: 1_700_000_000_000 });
    borrarPendingCheckout(a);
    expect(leerPendingCheckout(a)).toBeNull();
  });
  it.each(['{roto', '{"creadoEn":"x"}', 'null'])('valor inválido %s → null', (v) => {
    const a = almacenMemoria();
    a.setItem('c3lect-pending-checkout', v);
    expect(leerPendingCheckout(a)).toBeNull();
  });
});
