import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../environments/environment';
import { VentaService } from './venta-service';

describe('Contrato de Ventas', () => {
  let service: VentaService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/ventas`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(VentaService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('envía solo identificadores y cantidades', () => {
    const dto = { clienteId: 1, detalles: [{ productoId: 2, cantidad: 3 }] };
    service.registrar(dto).subscribe();
    const req = http.expectOne({ url, method: 'POST' });
    expect(req.request.body).toEqual(dto);
    req.flush({ id: 1 }, { status: 201, statusText: 'Created' });
  });
  it('omite filtros vacíos y solicita la página del servidor', () => {
    service.buscar({ clienteId: null, estado: null, desde: null, hasta: '' }, 2, 10).subscribe();
    const req = http.expectOne((r) => r.url === `${url}/buscar`);
    expect(req.request.params.keys().sort()).toEqual([
      'direccion',
      'ordenarPor',
      'pagina',
      'tamanio',
    ]);
    expect(req.request.params.get('pagina')).toBe('2');
    req.flush({ contenido: [] });
  });
  it('envía los filtros con sus nombres públicos', () => {
    service
      .buscar({ clienteId: 4, estado: 'ANULADA', desde: '2026-10-01', hasta: '2026-10-11' })
      .subscribe();
    const req = http.expectOne((r) => r.url === `${url}/buscar`);
    expect(req.request.params.get('clienteId')).toBe('4');
    expect(req.request.params.get('estado')).toBe('ANULADA');
    expect(req.request.params.get('desde')).toBe('2026-10-01');
    req.flush({ contenido: [] });
  });
});
