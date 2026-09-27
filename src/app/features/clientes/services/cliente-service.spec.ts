import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ClienteService } from './cliente-service';
import { environment } from '../../../../environments/environment';
describe('ClienteService contract', () => {
  let service: ClienteService;
  let http: HttpTestingController;
  const url = `${environment.apiUrl}/clientes`;
  const dto = {
    dni: '12345678',
    nombres: 'Ana',
    apellidos: 'Perez',
    email: 'ana@example.com',
    telefono: null,
    direccion: null,
    estado: true,
  };
  const record = { ...dto, id: 7, fechaCreacion: '2026-09-24', fechaModificacion: null };
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClienteService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('lists backend records', () => {
    const pagina = {
      contenido: [record],
      pagina: 0,
      tamanio: 10,
      totalElementos: 1,
      totalPaginas: 1,
      ultima: true,
    };
    service.listar().subscribe((data) => expect(data).toEqual(pagina));
    const req = http.expectOne((req) => req.url === url && req.method === 'GET');
    expect(req.request.params.get('pagina')).toBe('0');
    expect(req.request.params.get('tamanio')).toBe('10');
    expect(req.request.params.get('ordenarPor')).toBe('apellidos');
    expect(req.request.params.get('direccion')).toBe('asc');
    req.flush(pagina);
  });
  it('loads by ID', () => {
    service.obtener(7).subscribe((data) => expect(data.id).toBe(7));
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
