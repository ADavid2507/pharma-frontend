import { HttpErrorResponse } from '@angular/common/http';
import { mensajeError } from './http-error';

describe('mensajeError', () => {
  it('includes the server tracking code without losing the business message', () => {
    expect(
      mensajeError(
        new HttpErrorResponse({
          status: 409,
          error: { message: 'Stock insuficiente', requestId: 'a1b2c3d4' },
        }),
      ),
    ).toBe('Stock insuficiente Código de seguimiento: a1b2c3d4');
  });
  it('keeps errors from older servers readable', () => {
    expect(
      mensajeError(new HttpErrorResponse({ status: 400, error: { message: 'Datos inválidos' } })),
    ).toBe('Datos inválidos');
  });
  it('does not append a tracking code to a connection failure', () => {
    expect(mensajeError(new HttpErrorResponse({ status: 0 }))).toContain(
      'No se pudo conectar con el servidor',
    );
  });
});
