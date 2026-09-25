import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { CategoriaService } from './categoria-service';
import { environment } from '../../../../environments/environment';
describe('CategoriaService contract', () => {
  let service: CategoriaService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/categorias`;
  const dto = { nombre: 'Vitaminas', descripcion: null, estado: true };
  const record = { ...dto, id_categoria: 7, fechaCreacion: '2026-09-24', fechaModificacion: null };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoriaService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('lists backend records', () => {
    service.listar().subscribe((data) => expect(data).toEqual([record]));
    http.expectOne({ url, method: 'GET' }).flush([record]);
  });
  it('loads by ID', () => {
    service.obtener(7).subscribe((data) => expect(data.id_categoria).toBe(7));
    http.expectOne({ url: `${url}/7`, method: 'GET' }).flush(record);
  });
  it('posts only the request DTO', () => {
    service.crear(dto).subscribe();
    const req = http.expectOne({ url, method: 'POST' });
    expect(req.request.body).toEqual(dto);
    req.flush(record, { status: 201, statusText: 'Created' });
  });
  it('updates by ID', () => {
    service.actualizar(7, dto).subscribe();
    const req = http.expectOne({ url: `${url}/7`, method: 'PUT' });
    expect(req.request.body).toEqual(dto);
    req.flush(record);
  });
  it('deletes by ID', () => {
    service.eliminar(7).subscribe();
    http
      .expectOne({ url: `${url}/7`, method: 'DELETE' })
      .flush(null, { status: 204, statusText: 'No Content' });
  });
});
