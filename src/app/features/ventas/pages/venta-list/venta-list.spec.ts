import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
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
  it('excluye anuladas del total y conserva los filtros aplicados al paginar', async () => {
    const fixture = iniciar();
    const list = fixture.componentInstance;
    http
      .expectOne((r) => r.url === url)
      .flush({
        contenido: [
          {
            id: 1,
            fechaRegistro: '2026-11-12T09:00:00',
            detalles: [],
            estado: 'REGISTRADA',
            total: 37.5,
          },
          {
            id: 2,
            fechaRegistro: '2026-11-12T09:00:00',
            detalles: [],
            estado: 'ANULADA',
            total: 100,
          },
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
    await fixture.whenStable();
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
  it('restaura filtros de URL y vuelve a pagina cero al buscar', async () => {
    const fixture = iniciar();
    http
      .expectOne((r) => r.url === url)
      .flush({
        contenido: [],
        pagina: 0,
        tamanio: 20,
        totalElementos: 0,
        totalPaginas: 0,
        ultima: true,
      });
    await TestBed.inject(Router).navigateByUrl(
      '/?pagina=4&tamanio=50&estado=REGISTRADA&desde=2026-11-01',
    );
    const anterior = http.expectOne((r) => r.url === url);
    expect(anterior.request.params.get('pagina')).toBe('4');
    expect(anterior.request.params.get('tamanio')).toBe('50');
    expect(anterior.request.params.get('estado')).toBe('REGISTRADA');
    anterior.flush({
      contenido: [],
      pagina: 4,
      tamanio: 50,
      totalElementos: 250,
      totalPaginas: 5,
      ultima: true,
    });
    fixture.componentInstance.filtros.patchValue({ desde: '2026-11-05' });
    fixture.componentInstance.buscar();
    await fixture.whenStable();
    const nueva = http.expectOne((r) => r.url === url);
    expect(nueva.request.params.get('pagina')).toBe('0');
    expect(nueva.request.params.get('desde')).toBe('2026-11-05');
    expect(TestBed.inject(Router).url).toContain('pagina=0');
    nueva.flush({
      contenido: [],
      pagina: 0,
      tamanio: 50,
      totalElementos: 0,
      totalPaginas: 0,
      ultima: true,
    });
    fixture.destroy();
  });
});
