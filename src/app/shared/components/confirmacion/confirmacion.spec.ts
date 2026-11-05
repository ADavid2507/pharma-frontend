import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Confirmacion } from './confirmacion';
import { ConfirmacionService } from './confirmacion-service';

describe('Confirmacion', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Confirmacion], providers: [provideRouter([])] });
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = true;
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      configurable: true,
      value: function (this: HTMLDialogElement) {
        this.open = false;
      },
    });
  });
  afterEach(() => vi.restoreAllMocks());
  function abrir() {
    const fixture = TestBed.createComponent(Confirmacion);
    const service = TestBed.inject(ConfirmacionService);
    const accion = vi.fn();
    service.solicitar(
      { titulo: 'Eliminar categoría', mensaje: '¿Eliminar Vitaminas?', textoConfirmar: 'Eliminar' },
      accion,
    );
    fixture.detectChanges();
    return {
      fixture,
      service,
      accion,
      dialogo: fixture.nativeElement.querySelector('dialog') as HTMLDialogElement,
    };
  }
  it('opens with custom text and only executes after explicit confirmation', () => {
    const { fixture, accion, dialogo } = abrir();
    expect(dialogo.open).toBe(true);
    expect(dialogo.textContent).toContain('¿Eliminar Vitaminas?');
    expect(accion).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('.confirmar').click();
    expect(dialogo.open).toBe(false);
    expect(accion).toHaveBeenCalledTimes(1);
    TestBed.inject(ConfirmacionService).responder(true);
    expect(accion).toHaveBeenCalledTimes(1);
  });
  it('cancels with the cancel button or Escape without executing', () => {
    const { fixture, service, accion, dialogo } = abrir();
    fixture.nativeElement.querySelector('button').click();
    expect(accion).not.toHaveBeenCalled();
    service.solicitar({ mensaje: 'Otra acción' }, accion);
    fixture.detectChanges();
    dialogo.dispatchEvent(new Event('cancel', { cancelable: true }));
    expect(service.opciones()).toBeNull();
    expect(dialogo.open).toBe(false);
    expect(accion).not.toHaveBeenCalled();
  });
  it('keeps the original action when another confirmation is requested', () => {
    const { service, accion } = abrir();
    const otra = vi.fn();
    service.solicitar({ mensaje: 'Otra' }, otra);
    service.responder(true);
    expect(accion).toHaveBeenCalledTimes(1);
    expect(otra).not.toHaveBeenCalled();
  });
  it('discards pending actions on navigation', async () => {
    const { service, accion } = abrir();
    await TestBed.inject(Router).navigateByUrl('/');
    expect(service.opciones()).toBeNull();
    expect(accion).not.toHaveBeenCalled();
  });
});
