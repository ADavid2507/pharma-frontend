import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CategoriaForm } from './categoria-form';
import { environment } from '../../../../../environments/environment';
describe('CategoriaForm', () => {
  let fixture: ComponentFixture<CategoriaForm>;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/categorias`;
  const dto = { nombre: 'Vitaminas', descripcion: null, estado: true };
  const record = { ...dto, id_categoria: 7, fechaCreacion: '', fechaModificacion: null };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [CategoriaForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(CategoriaForm);
  });
  afterEach(() => http.verify());
  function fill() {
    fixture.detectChanges();
    for (const [key, value] of Object.entries(dto)) {
      const input = fixture.nativeElement.querySelector(`[formControlName="${key}"]`);
      if (typeof value === 'string') {
        input.value = value;
        input.dispatchEvent(new Event('input'));
      }
    }
  }
  it('rejects empty required fields without making requests', () => {
    fixture.detectChanges();
    fixture.componentInstance.guardar();
    http.expectNone(url);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error')).not.toBeNull();
  });
  it('creates and prevents duplicate submissions', () => {
    fill();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.guardar();
    fixture.componentInstance.guardar();
    const req = http.expectOne({ url, method: 'POST' });
    expect(req.request.body).toEqual(dto);
    req.flush(record);
    expect(navigate).toHaveBeenCalled();
  });
  it('preloads and updates an existing record', () => {
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
    http.expectOne(`${url}/7`).flush(record);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.guardar();
    const req = http.expectOne({ url: `${url}/7`, method: 'PUT' });
    expect(req.request.body).toEqual(dto);
    req.flush(record);
  });
  it('blocks saving when the record was not found', () => {
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();
    http
      .expectOne(`${url}/7`)
      .flush({ message: 'No encontrado' }, { status: 404, statusText: 'Not Found' });
    fixture.componentInstance.guardar();
    http.expectNone(url);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No encontrado');
    expect(fixture.nativeElement.querySelector('[type=submit]').disabled).toBe(true);
  });
  it('shows backend conflicts', () => {
    fill();
    fixture.componentInstance.guardar();
    http
      .expectOne(url)
      .flush({ message: 'El registro ya existe' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('El registro ya existe');
  });
  it('shows field errors from a 400 response', () => {
    fill();
    fixture.componentInstance.guardar();
    http
      .expectOne(url)
      .flush(
        { message: 'Error de validación', validationErrors: { nombre: 'Valor rechazado' } },
        { status: 400, statusText: 'Bad Request' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Valor rechazado');
  });
  it('rejects invalid route identifiers without loading or saving', () => {
    fixture.componentRef.setInput('id', 'abc');
    fixture.detectChanges();
    fixture.componentInstance.guardar();
    http.expectNone((req) => req.url.startsWith(url));
  });
});
