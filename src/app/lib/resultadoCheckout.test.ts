import { describe, it, expect } from 'vitest';
import { estadoDesdeRuta, numeroDePedidoVisible, efectoDelResultado, TEXTOS_RESULTADO } from './resultadoCheckout';

describe('resultadoCheckout', () => {
  it.each([
    ['/checkout/success', 'success'],
    ['/checkout/failure', 'failure'],
    ['/checkout/pending', 'pending'],
  ])('%s → %s', (r, e) => expect(estadoDesdeRuta(r)).toBe(e));
  it('el número de pedido solo se muestra en success', () => {
    expect(numeroDePedidoVisible('success', '?external_reference=C-1')).toBe('C-1');
    expect(numeroDePedidoVisible('failure', '?external_reference=C-1')).toBeNull();
    expect(numeroDePedidoVisible('pending', '?external_reference=C-1')).toBeNull();
  });
  it('success con pendiente vacía el carrito y borra el pendiente', () =>
    expect(efectoDelResultado('success', { creadoEn: 1 })).toEqual({ vaciarCarrito: true, borrarPendiente: true }));
  it('success sin pendiente (entrada por URL) no vacía nada', () =>
    expect(efectoDelResultado('success', null)).toEqual({ vaciarCarrito: false, borrarPendiente: false }));
  it('failure conserva el carrito y borra el pendiente', () =>
    expect(efectoDelResultado('failure', { creadoEn: 1 })).toEqual({ vaciarCarrito: false, borrarPendiente: true }));
  it('pending no toca nada', () =>
    expect(efectoDelResultado('pending', { creadoEn: 1 })).toEqual({ vaciarCarrito: false, borrarPendiente: false }));
  it('los textos de failure ya no hablan de un pedido cancelado', () =>
    expect(TEXTOS_RESULTADO.failure.cuerpo).not.toMatch(/cancelad/i));
});
