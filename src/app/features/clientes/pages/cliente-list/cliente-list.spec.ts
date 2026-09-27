import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ClienteList } from './cliente-list';
import { environment } from '../../../../../environments/environment';
describe('ClienteList', () => {
  let fixture: ComponentFixture<ClienteList>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/clientes`;
  const record = {
    ...{
      dni: '12345678',
      nombres: 'Ana',
      apellidos: 'Perez',
      email: 'ana@example.com',
      telefono: null,
      direccion: null,
      estado: true,
    },
    id: 7,
    fechaCreacion: '',
    fechaModificacion: null,
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClienteList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ClienteList);
    fixture.detectChanges();
  });
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });
  it('filters locally without a second GET', () => {
    http
      .expectOne((req) => req.url === url)
      .flush({
        contenido: [record],
        pagina: 0,
        tamanio: 10,
        totalElementos: 1,
        totalPaginas: 1,
        ultima: true,
      });
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'no-match';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody .acciones').length).toBe(0);
    http.expectNone((req) => req.url === url);
  });
  it('does not delete when confirmation is cancelled', () => {
    http
      .expectOne((req) => req.url === url)
      .flush({
        contenido: [record],
        pagina: 0,
        tamanio: 10,
        totalElementos: 1,
        totalPaginas: 1,
        ultima: true,
      });
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.eliminar(record);
    http.expectNone(`${url}/7`);
  });
  it('reloads and keeps the inactive row after a 204 response', () => {
    http
      .expectOne((req) => req.url === url)
      .flush({
        contenido: [record],
        pagina: 0,
        tamanio: 10,
        totalElementos: 1,
        totalPaginas: 1,
        ultima: true,
      });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.eliminar(record);
    http
      .expectOne({ url: `${url}/7`, method: 'DELETE' })
      .flush(null, { status: 204, statusText: 'No Content' });
    http
      .expectOne((req) => req.url === url)
      .flush({
        contenido: [{ ...record, estado: false }],
        pagina: 0,
        tamanio: 10,
        totalElementos: 1,
        totalPaginas: 1,
        ultima: true,
      });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody .acciones').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('Inactivo');
    http.expectNone((req) => req.url === url);
  });
  it('keeps the row when deletion conflicts', () => {
    http
      .expectOne((req) => req.url === url)
      .flush({
        contenido: [record],
        pagina: 0,
        tamanio: 10,
        totalElementos: 1,
        totalPaginas: 1,
        ultima: true,
      });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.eliminar(record);
    http
      .expectOne(`${url}/7`)
      .flush({ message: 'Tiene registros asociados' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tiene registros asociados');
    expect(fixture.nativeElement.querySelectorAll('tbody .acciones').length).toBe(1);
  });
  it('shows a connection error', () => {
    http.expectOne((req) => req.url === url).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo conectar con el servidor');
  });
  it('changes size, moves forward and backward, and disables boundary navigation', () => {
    http
      .expectOne((req) => req.url === url)
      .flush({
        contenido: [record],
        pagina: 0,
        tamanio: 10,
        totalElementos: 6,
        totalPaginas: 1,
        ultima: true,
      });
    fixture.componentInstance.cambiarPagina(-1);
    http.expectNone((req) => req.url === url);
    fixture.componentInstance.cambiarTamanio('5');
    const first = http.expectOne((req) => req.url === url);
    expect(first.request.params.get('pagina')).toBe('0');
    expect(first.request.params.get('tamanio')).toBe('5');
    first.flush({
      contenido: [record],
      pagina: 0,
      tamanio: 5,
      totalElementos: 6,
      totalPaginas: 2,
      ultima: false,
    });
    fixture.componentInstance.cambiarPagina(1);
    const second = http.expectOne((req) => req.url === url);
    expect(second.request.params.get('pagina')).toBe('1');
    second.flush({
      contenido: [record],
      pagina: 1,
      tamanio: 5,
      totalElementos: 6,
      totalPaginas: 2,
      ultima: true,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Página 2 de 2 · 6 clientes');
    fixture.componentInstance.cambiarPagina(1);
    http.expectNone((req) => req.url === url);
    fixture.componentInstance.cambiarPagina(-1);
    const previous = http.expectOne((req) => req.url === url);
    expect(previous.request.params.get('pagina')).toBe('0');
    previous.flush({
      contenido: [record],
      pagina: 0,
      tamanio: 5,
      totalElementos: 6,
      totalPaginas: 2,
      ultima: false,
    });
  });

  it('toggles surname sorting and starts DNI sorting ascending', () => {
    const page = {
      contenido: [record],
      pagina: 0,
      tamanio: 10,
      totalElementos: 1,
      totalPaginas: 1,
      ultima: true,
    };
    http.expectOne((req) => req.url === url).flush(page);
    for (const [campo, direccion] of [
      ['apellidos', 'desc'],
      ['apellidos', 'asc'],
      ['dni', 'asc'],
    ] as const) {
      fixture.componentInstance.ordenar(campo);
      const req = http.expectOne((req) => req.url === url);
      expect(req.request.params.get('ordenarPor')).toBe(campo);
      expect(req.request.params.get('direccion')).toBe(direccion);
      req.flush(page);
    }
  });
});
