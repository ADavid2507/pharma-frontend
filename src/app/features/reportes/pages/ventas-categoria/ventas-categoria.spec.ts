import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { VentasPorCategoria } from './ventas-categoria';
import { environment } from '../../../../../environments/environment';

describe('Reporte de ventas por categoría', () => {
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/reportes/ventas-por-categoria`;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [VentasPorCategoria],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function iniciar() {
    const fixture = TestBed.createComponent(VentasPorCategoria);
    fixture.detectChanges();
    return fixture;
  }
  it('consulta el histórico sin filtros y representa unidades, importes y barras relativas al máximo', () => {
    const fixture = iniciar();
    const req = http.expectOne(url);
    expect(req.request.params.keys()).toEqual([]);
    req.flush([
      { idCategoria: 1, categoriaNombre: 'A', cantidadVentas: 3, subtotalVentas: 56.7 },
      { idCategoria: 2, categoriaNombre: 'B', cantidadVentas: 2, subtotalVentas: 113.4 },
    ]);
    fixture.detectChanges();
    const reporte = fixture.componentInstance;
    expect(reporte.filas()[0].categoriaId).toBe(1);
    expect(reporte.unidades()).toBe(5);
    expect(reporte.total()).toBe(170.1);
    const barras = fixture.nativeElement.querySelectorAll('.barra') as NodeListOf<HTMLElement>;
    expect(barras[0].style.width).toBe('50%');
    expect(barras[1].style.width).toBe('100%');
    fixture.destroy();
  });
  it('valida fechas invertidas y envía solamente las fechas informadas', () => {
    const fixture = iniciar();
    http.expectOne(url).flush([]);
    const reporte = fixture.componentInstance;
    reporte.filtros.patchValue({ desde: '2026-10-11', hasta: '2026-10-01' });
    reporte.buscar();
    expect(reporte.error()).toContain('posterior');
    http.expectNone((r) => r.url === url);
    reporte.filtros.patchValue({ hasta: null });
    reporte.buscar();
    const req = http.expectOne((r) => r.url === url);
    expect(req.request.params.keys()).toEqual(['desde']);
    expect(req.request.params.get('desde')).toBe('2026-10-11');
    req.flush([]);
    fixture.destroy();
  });
  it('muestra el estado vacío y evita porcentajes inválidos cuando todos los importes son cero', () => {
    const fixture = iniciar();
    http.expectOne(url).flush([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay ventas en el periodo seleccionado');
    const reporte = fixture.componentInstance;
    reporte.buscar();
    http
      .expectOne(url)
      .flush([{ idCategoria: 1, categoriaNombre: 'A', cantidadVentas: 1, subtotalVentas: 0 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.barra').style.width).toBe('0%');
    expect(reporte.total()).toBe(0);
    fixture.destroy();
  });
  it('permite volver a generar el reporte después de un error HTTP', () => {
    const fixture = iniciar();
    http
      .expectOne(url)
      .flush({ mensaje: 'No se pudo consultar' }, { status: 500, statusText: 'Error' });
    expect(fixture.componentInstance.cargando()).toBe(false);
    expect(fixture.componentInstance.error()).toBeTruthy();
    fixture.componentInstance.buscar();
    http.expectOne(url).flush([]);
    expect(fixture.componentInstance.error()).toBeNull();
    fixture.destroy();
  });
});
