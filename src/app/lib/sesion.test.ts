import { describe, it, expect, vi } from 'vitest';
import { esRutaProtegida, escucharSesionCerrada, emitirSesionCerrada } from './sesion';

describe('esRutaProtegida', () => {
  it.each(['/cuenta', '/cuenta/datos', '/admin', '/admin/productos/1', '/checkout'])('%s es protegida', (r) =>
    expect(esRutaProtegida(r)).toBe(true));
  it.each(['/', '/catalog', '/product/1', '/login', '/checkout/success', '/checkout/failure', '/checkout/pending', '/cuentas', '/administrar'])(
    '%s es pública', (r) => expect(esRutaProtegida(r)).toBe(false));
});

describe('evento de sesión cerrada', () => {
  it('entrega el motivo al listener y deja de llamarlo al desuscribirse', () => {
    vi.stubGlobal('window', new EventTarget());
    const visto: string[] = [];
    const quitar = escucharSesionCerrada((m) => visto.push(m));
    emitirSesionCerrada('expirada');
    quitar();
    emitirSesionCerrada('logout');
    expect(visto).toEqual(['expirada']);
    vi.unstubAllGlobals();
  });
});
