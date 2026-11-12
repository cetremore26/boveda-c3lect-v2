import { describe, it, expect } from 'vitest';
import { destinoSeguro, rutaDeAcceso, PARAM_VOLVER } from './volver';

describe('destinoSeguro', () => {
  it('acepta rutas internas', () => {
    expect(destinoSeguro('/cuenta/pedidos')).toBe('/cuenta/pedidos');
    expect(destinoSeguro('/producto/1?a=b#c')).toBe('/producto/1?a=b#c');
  });

  it.each([null, undefined, ''])('vacío (%s) devuelve /catalog', (v) => {
    expect(destinoSeguro(v)).toBe('/catalog');
  });

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'evil'])(
    'rechaza destino externo o relativo %s',
    (v) => {
      expect(destinoSeguro(v)).toBe('/catalog');
    },
  );

  it.each(['/login', '/register?x=1', '/reset-password#token=abc'])(
    'rechaza pantallas de acceso %s',
    (v) => {
      expect(destinoSeguro(v)).toBe('/catalog');
    },
  );
});

describe('destinoSeguro con URL y origen', () => {
  const O = 'https://tienda.test';
  it.each(['/\t/evil.com', '/\n/evil.com', '/\\evil.com', '//evil.com', 'https://evil.com', 'javascript:alert(1)', '/login', '/reset-password?x=1'])(
    'rechaza %j', (v) => expect(destinoSeguro(v, O)).toBe('/catalog'));
  it('conserva ruta, query y fragmento internos', () =>
    expect(destinoSeguro('/product/1?resenar=1#resenas', O)).toBe('/product/1?resenar=1#resenas'));
});

describe('rutaDeAcceso', () => {
  it('PARAM_VOLVER es "volver"', () => {
    expect(PARAM_VOLVER).toBe('volver');
  });

  it('login recordando destino', () => {
    expect(rutaDeAcceso('/cuenta')).toBe('/login?volver=%2Fcuenta');
  });

  it('register recordando destino', () => {
    expect(rutaDeAcceso('/cuenta', '/register')).toBe('/register?volver=%2Fcuenta');
  });

  it('destino inseguro cae a /login sin parámetro', () => {
    expect(rutaDeAcceso('//evil.com')).toBe('/login');
  });
});
