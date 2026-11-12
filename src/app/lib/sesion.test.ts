import { afterEach, describe, it, expect, vi } from 'vitest';
import { debeCerrarSesionAlArrancar, esRutaProtegida, escucharSesionCerrada, emitirSesionCerrada } from './sesion';

describe('esRutaProtegida', () => {
  it.each(['/cuenta', '/cuenta/datos', '/admin', '/admin/productos/1', '/checkout'])('%s es protegida', (r) =>
    expect(esRutaProtegida(r)).toBe(true));
  it.each(['/', '/catalog', '/product/1', '/login', '/checkout/success', '/checkout/failure', '/checkout/pending', '/cuentas', '/administrar'])(
    '%s es pública', (r) => expect(esRutaProtegida(r)).toBe(false));
});

describe('evento de sesión cerrada', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('entrega el motivo al listener y deja de llamarlo al desuscribirse', () => {
    vi.stubGlobal('window', new EventTarget());
    const visto: string[] = [];
    const quitar = escucharSesionCerrada((m) => visto.push(m));
    emitirSesionCerrada('expirada');
    quitar();
    emitirSesionCerrada('logout');
    expect(visto).toEqual(['expirada']);
  });
});

describe('debeCerrarSesionAlArrancar', () => {
  it.each([401, 403])('%s cierra la sesión', (status) =>
    expect(debeCerrarSesionAlArrancar({ response: { status } })).toBe(true));
  it('500 no cierra la sesión', () =>
    expect(debeCerrarSesionAlArrancar({ response: { status: 500 } })).toBe(false));
  it('error de red sin response no cierra la sesión', () =>
    expect(debeCerrarSesionAlArrancar(new Error('Network Error'))).toBe(false));
  it('undefined no cierra la sesión', () =>
    expect(debeCerrarSesionAlArrancar(undefined)).toBe(false));
});
