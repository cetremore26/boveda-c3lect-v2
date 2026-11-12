import { describe, it, expect, vi, beforeEach } from 'vitest';

type Modulo = typeof import('./resetToken');
let m: Modulo;

beforeEach(async () => {
  vi.resetModules();
  m = await import('./resetToken');
});

describe('extraerTokenDeReset', () => {
  it('prefiere el fragmento', () =>
    expect(m.extraerTokenDeReset('#token=abc.def', '?token=viejo')).toBe('abc.def'));
  it('acepta ?token= de la API vieja', () =>
    expect(m.extraerTokenDeReset('', '?token=viejo')).toBe('viejo'));
  it('sin token → null', () => expect(m.extraerTokenDeReset('', '')).toBeNull());
  it('token vacío → null', () => expect(m.extraerTokenDeReset('#token=', '?token=')).toBeNull());
});

describe('capturarTokenDeReset', () => {
  it('captura y limpia la URL en /reset-password', () => {
    const hist = { state: null, replaceState: vi.fn() };
    m.capturarTokenDeReset({ pathname: '/reset-password', hash: '#token=t1', search: '' }, hist);
    expect(hist.replaceState).toHaveBeenCalledWith(null, '', '/reset-password');
    expect(m.tokenDeResetCapturado()).toBe('t1');
    expect(m.tokenDeResetCapturado()).toBe('t1');
  });
  it('no toca otras rutas', () => {
    const hist = { state: null, replaceState: vi.fn() };
    m.capturarTokenDeReset({ pathname: '/', hash: '#token=x', search: '' }, hist);
    expect(hist.replaceState).not.toHaveBeenCalled();
    expect(m.tokenDeResetCapturado()).toBeNull();
  });
});
