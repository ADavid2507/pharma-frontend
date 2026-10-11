import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { VentaDetalle } from './venta-detalle';
import { environment } from '../../../../../environments/environment';

describe('Comprobante de venta', () => {
  let http: HttpTestingController;
  const url = environment.apiUrl;
  const venta = {
    id: 7,
    clienteId: 1,
    clienteNombre: 'Ana Huamán',
    estado: 'ANULADA',
    fechaRegistro: '2026-10-11T10:00:00',
    total: 37.5,
    detalles: [
      { productoId: 2, productoNombre: 'Paracetamol', cantidad: 3, precio: 12.5, subtotal: 37.5 },
    ],
  };
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [VentaDetalle],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });
  it('muestra montos del servidor y conserva el comprobante si falla el DNI', async () => {
    const fixture = TestBed.createComponent(VentaDetalle);
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
    http.expectOne(`${url}/ventas/7`).flush(venta);
    http
      .expectOne(`${url}/clientes/1`)
      .flush({ message: 'No encontrado' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.venta()?.total).toBe(37.5);
    expect(fixture.nativeElement.textContent).toContain('ANULADA');
    expect(fixture.nativeElement.textContent).toContain('S/ 37.50');
    expect(fixture.componentInstance.cliente()).toBeNull();
    fixture.destroy();
  });
  it('imprime automáticamente cuando los datos ya están renderizados', async () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const fixture = TestBed.createComponent(VentaDetalle);
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('id', '7');
    fixture.componentRef.setInput('imprimir', '1');
    fixture.detectChanges();
    expect(print).not.toHaveBeenCalled();
    http.expectOne(`${url}/ventas/7`).flush(venta);
    http.expectOne(`${url}/clientes/1`).flush({ id: 1, dni: '12345678' });
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(print).toHaveBeenCalledTimes(1);
    fixture.destroy();
  });
  it('rechaza identificadores inválidos sin consultar el servidor', () => {
    const fixture = TestBed.createComponent(VentaDetalle);
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('id', 'abc');
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toContain('no es válido');
    http.expectNone((r) => r.url.startsWith(`${url}/ventas`));
    fixture.destroy();
  });
});
