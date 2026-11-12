import { describe, expect, it } from 'vitest';
import { accionResenar } from './resenas';

const base = { authCargando: false, autenticado: true, pendientesCargando: false, consultadoConSesion: true, puedeResenar: true };

describe('accionResenar', () => {
  it('espera mientras carga la sesión', () => expect(accionResenar({ ...base, authCargando: true })).toBe('esperar'));
  it('espera mientras cargan los pendientes', () => expect(accionResenar({ ...base, pendientesCargando: true })).toBe('esperar'));
  it('espera si los pendientes son de la consulta de invitado', () =>
    expect(accionResenar({ ...base, consultadoConSesion: false })).toBe('esperar'));
  it('abre si puede reseñar', () => expect(accionResenar(base)).toBe('abrir'));
  it('descarta si no puede', () => expect(accionResenar({ ...base, puedeResenar: false })).toBe('descartar'));
  it('invitado ya resuelto descarta', () =>
    expect(accionResenar({ ...base, autenticado: false, consultadoConSesion: false, puedeResenar: false })).toBe('descartar'));
});
