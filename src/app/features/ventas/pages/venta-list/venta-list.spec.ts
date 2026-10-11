import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { VentaList } from './venta-list';
import { environment } from '../../../../../environments/environment';

describe('Consulta de ventas', () => {
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/ventas/buscar`;
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [VentaList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => http.verify());
  function iniciar() {
    const fixture = TestBed.createComponent(VentaList);
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.endsWith('/clientes'))
      .flush({
        contenido: [],
        pagina: 0,
        tamanio: 100,
        totalElementos: 0,
        totalPaginas: 0,
        ultima: true,
      });
    return fixture;
  }
  it('bloquea fechas invertidas antes de enviar la consulta', () => {
    const fixture = iniciar();
    const list = fixture.componentInstance;
    http
      .expectOne((r) => r.url === url)
      .flush({
        contenido: [],
        pagina: 0,
        tamanio: 10,
        totalElementos: 0,
        totalPaginas: 0,
        ultima: true,
      });
    list.filtros.patchValue({ desde: '2026-10-11', hasta: '2026-10-01' });
    list.buscar();
    expect(list.error()).toContain('posterior');
    http.expectNone((r) => r.url === url);
    fixture.destroy();
  });
  it('excluye anuladas del total y conserva los filtros aplicados al paginar', () => {
    const fixture = iniciar();
    const list = fixture.componentInstance;
    http
      .expectOne((r) => r.url === url)
      .flush({
        contenido: [
          { estado: 'REGISTRADA', total: 37.5 },
          { estado: 'ANULADA', total: 100 },
        ],
        pagina: 0,
        tamanio: 10,
        totalElementos: 11,
        totalPaginas: 2,
        ultima: false,
      });
    expect(list.totalPagina()).toBe(37.5);
    list.filtros.patchValue({ estado: 'ANULADA' });
    list.irA(1);
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.get('pagina')).toBe('1');
    expect(req.request.params.has('estado')).toBe(false);
    req.flush({
      contenido: [],
      pagina: 1,
      tamanio: 10,
      totalElementos: 11,
      totalPaginas: 2,
      ultima: true,
    });
    fixture.destroy();
  });
  it('avisa si la instancia del backend todavía usa el contrato anterior', () => {
    const fixture = iniciar();
    http.expectOne((r) => r.url === url).flush([]);
    expect(fixture.componentInstance.error()).toContain('Reinicie PharmaBackend');
    expect(fixture.componentInstance.resultado()).toBeNull();
    fixture.destroy();
  });
});
