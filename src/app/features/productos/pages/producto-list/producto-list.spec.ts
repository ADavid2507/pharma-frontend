import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ProductoList } from './producto-list';
import { environment } from '../../../../../environments/environment';

describe('ProductoList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductoList],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('carga el listado paginado y muestra el estado vacío', () => {
    const fixture = TestBed.createComponent(ProductoList);
    fixture.detectChanges();

    http.expectOne(`${environment.apiUrl}/categorias`).flush([]);

    const peticion = http.expectOne(
      (req) => req.url === `${environment.apiUrl}/productos`,
    );

    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.params.get('pagina')).toBe('0');
    expect(peticion.request.params.get('tamanio')).toBe('10');
    expect(peticion.request.params.get('ordenarPor')).toBe('nombre');
    expect(peticion.request.params.get('direccion')).toBe('asc');

    peticion.flush({
      contenido: [],
      pagina: 0,
      tamanio: 10,
      totalElementos: 0,
      totalPaginas: 0,
      ultima: true,
    });

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent)
      .toContain('No hay productos para mostrar');
  });
});