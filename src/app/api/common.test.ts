import { describe, it, expect } from 'vitest';
import { mensajeDeError, params } from './common';

describe('params', () => {
  it('omite vacíos, undefined y convierte a string', () => {
    expect(params({ a: 1, b: '', c: undefined })).toEqual({ a: '1' });
  });
});

describe('mensajeDeError', () => {
  it('devuelve el message de la respuesta', () => {
    expect(mensajeDeError({ response: { data: { message: 'Stock insuficiente' } } }, 'x')).toBe('Stock insuficiente');
  });
  it('une un arreglo de mensajes', () => {
    expect(
      mensajeDeError({ response: { data: { message: ['a debe ser texto', 'b es obligatorio'] } } }, 'x'),
    ).toBe('a debe ser texto, b es obligatorio');
  });
  it('usa el fallback con Error sin response', () => {
    expect(mensajeDeError(new Error('boom'), 'Error al guardar')).toBe('Error al guardar');
  });
  it('usa el fallback con valores no objeto', () => {
    expect(mensajeDeError(undefined, 'f')).toBe('f');
    expect(mensajeDeError(null, 'f')).toBe('f');
    expect(mensajeDeError('texto', 'f')).toBe('f');
  });
  it('usa el fallback con message vacío o ausente', () => {
    expect(mensajeDeError({ response: { data: { message: '' } } }, 'f')).toBe('f');
    expect(mensajeDeError({ response: {} }, 'f')).toBe('f');
  });
});
