import { describe, it, expect } from 'vitest';
import { validarNuevaContrasena } from './contrasena';

describe('validarNuevaContrasena', () => {
  it('no coinciden', () =>
    expect(validarNuevaContrasena('Clave123!', 'Clave123?')).toBe('Las contraseñas no coinciden.'));
  it('débil', () => expect(validarNuevaContrasena('clave', 'clave')).toMatch(/mínimo 8 caracteres/));
  it('válida', () => expect(validarNuevaContrasena('Clave123!', 'Clave123!')).toBeNull());
});
