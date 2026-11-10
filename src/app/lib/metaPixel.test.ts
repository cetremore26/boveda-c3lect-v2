import { describe, it, expect } from 'vitest';
import { esRutaExcluida } from './metaPixel';

describe('esRutaExcluida', () => {
  it.each(['/admin', '/admin/ventas', '/reset-password'])('excluye %s', (p) =>
    expect(esRutaExcluida(p)).toBe(true));
  it.each(['/', '/product/1', '/login'])('no excluye %s', (p) =>
    expect(esRutaExcluida(p)).toBe(false));
});
