import { describe, expect, it } from 'vitest';
import { leerEstadoRegistro } from './autenticacion';

describe('leerEstadoRegistro', () => {
  it('lee email y token del state', () =>
    expect(leerEstadoRegistro({ email: 'a@x.com', registrationToken: 't' })).toEqual({ email: 'a@x.com', registrationToken: 't' }));
  it('acepta state sin token (API vieja)', () =>
    expect(leerEstadoRegistro({ email: 'a@x.com' })).toEqual({ email: 'a@x.com' }));
  it.each([null, undefined, 'x', {}, { email: '' }, { email: 3 }])('ignora %p', (s) =>
    expect(leerEstadoRegistro(s)).toBeNull());
});
