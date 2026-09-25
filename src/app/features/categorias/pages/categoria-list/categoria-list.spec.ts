import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriaList } from './categoria-list';
import { environment } from '../../../../../environments/environment';
describe('CategoriaList', () => {
  let fixture: ComponentFixture<CategoriaList>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/categorias`;
  const record = {
    ...{ nombre: 'Vitaminas', descripcion: null, estado: true },
    id_categoria: 7,
    fechaCreacion: '',
    fechaModificacion: null,
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriaList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CategoriaList);
    fixture.detectChanges();
  });
  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });
  it('filters locally without a second GET', () => {
    http.expectOne(url).flush([record]);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input');
    input.value = 'no-match';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody .acciones').length).toBe(0);
    http.expectNone(url);
  });
  it('does not delete when confirmation is cancelled', () => {
    http.expectOne(url).flush([record]);
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    fixture.componentInstance.eliminar(record);
    http.expectNone(`${url}/7`);
  });
  it('removes the row after a 204 response without reloading', () => {
    http.expectOne(url).flush([record]);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fixture.componentInstance.eliminar(record);
    http
      .expectOne({ url: `${url}/7`, method: 'DELETE' })
      .flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody .acciones').length).toBe(0);
    http.expectNone(url);
  });
  it('keeps the row when deletion conflicts', () => {
    http.expectOne(url).flush([record]);
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
    http.expectOne(url).error(new ProgressEvent('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudo conectar con el servidor');
  });
});
