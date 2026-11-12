import { describe, it, expect } from 'vitest';
import { hoyLocal } from './format';

describe('hoyLocal', () => {
  it('usa el día local, no el de UTC', () =>
    expect(hoyLocal(new Date(2026, 9, 31, 20, 0))).toBe('2026-10-31'));
  it('rellena mes y día con cero', () =>
    expect(hoyLocal(new Date(2026, 0, 5, 8, 0))).toBe('2026-01-05'));
});
