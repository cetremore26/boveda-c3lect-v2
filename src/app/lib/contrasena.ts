// Mismo patrón que PASSWORD_REGEX en RegisterDto/ResetPasswordDto de la API
// (c3lect-api/src/modules/auth/infrastructure/http/dto/reset-password.dto.ts).
// eslint-disable-next-line no-useless-escape -- copia literal del regex de la API
export const PATRON_CONTRASENA =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\|,.<>/?]).{8,}$/;

export function validarNuevaContrasena(nueva: string, confirmacion: string): string | null {
  if (nueva !== confirmacion) return 'Las contraseñas no coinciden.';
  if (!PATRON_CONTRASENA.test(nueva)) {
    return 'La contraseña debe tener mínimo 8 caracteres, una mayúscula, un número y un carácter especial.';
  }
  return null;
}
