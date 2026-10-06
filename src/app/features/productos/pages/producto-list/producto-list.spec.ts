import { TestBed } from '@angular/core/testing';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { ProductoService } from '../../services/producto-service';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ProductoList } from './producto-list';
import { environment } from '../../../../../environments/environment';

describe('ProductoList', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductoList],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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

    const peticion = http.expectOne((req) => req.url === `${environment.apiUrl}/productos`);

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

    expect(fixture.nativeElement.textContent).toContain('No hay productos para mostrar');
  });
});

describe('ProductoList desde Categorías', () => {
  const categorias = [
    { id_categoria: 7, nombre: 'Vitaminas', estado: true },
    { id_categoria: 8, nombre: 'Analgésicos', estado: false },
  ];
  const productos = [
    {
      id: 1,
      nombre: 'Producto A',
      categoriaId: 7,
      categoriaNombre: 'Vitaminas',
      precio: 2,
      stock: 1,
      estado: true,
    },
    {
      id: 2,
      nombre: 'Producto B',
      categoriaId: 8,
      categoriaNombre: 'Analgésicos',
      precio: 3,
      stock: 1,
      estado: false,
    },
  ];
  let listar: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    listar = vi.fn((pagina: number, tamanio: number) =>
      of({
        contenido: productos,
        pagina,
        tamanio,
        totalElementos: 2,
        totalPaginas: 1,
        ultima: true,
      }),
    );
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'productos', component: ProductoList }],
          withComponentInputBinding(),
        ),
        { provide: ProductoService, useValue: { listar } },
        { provide: CategoriaService, useValue: { listar: () => of(categorias) } },
      ],
    });
  });

  it('binds the query parameter, requests 100 rows and preselects the category', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/productos?categoriaId=7', ProductoList);
    harness.detectChanges();
    expect(listar).toHaveBeenCalledWith(0, 100, 'nombre', 'asc');
    expect(harness.routeNativeElement?.querySelector('select')?.value).toBe('7');
    expect(harness.routeNativeElement?.textContent).toContain(
      'Mostrando productos de la categoría Vitaminas en los primeros 100 registros',
    );
    expect(harness.routeNativeElement?.querySelector('tbody')?.textContent).toContain('Producto A');
    expect(harness.routeNativeElement?.querySelector('tbody')?.textContent).not.toContain(
      'Producto B',
    );
  });

  it('updates reused routes and restores the default when the parameter is removed', async () => {
    const harness = await RouterTestingHarness.create();
    const first = await harness.navigateByUrl('/productos?categoriaId=7', ProductoList);
    const second = await harness.navigateByUrl('/productos?categoriaId=8', ProductoList);
    expect(second).toBe(first);
    harness.detectChanges();
    expect(harness.routeNativeElement?.querySelector('select')?.value).toBe('8');
    expect(harness.routeNativeElement?.querySelector('tbody')?.textContent).toContain('Producto B');
    await harness.navigateByUrl('/productos', ProductoList);
    harness.detectChanges();
    expect(listar).toHaveBeenLastCalledWith(0, 10, 'nombre', 'asc');
    expect(harness.routeNativeElement?.querySelector('select')?.value).toBe('');
  });

  it('rejects malformed query parameters without requesting an invalid page size', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/productos?categoriaId=abc', ProductoList);
    harness.detectChanges();
    expect(listar).toHaveBeenCalledWith(0, 10, 'nombre', 'asc');
    expect(harness.routeNativeElement?.textContent).toContain(
      'El identificador de categoría no es válido',
    );
  });

  it('keeps manual filtering local and removes the first-100 note after changing page size', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/productos?categoriaId=7', ProductoList);
    component.cambiarTamanio('5');
    harness.detectChanges();
    expect(harness.routeNativeElement?.textContent).not.toContain('en los primeros 100 registros');
    const requests = listar.mock.calls.length;
    component.filtrarPorCategoria('8');
    harness.detectChanges();
    expect(listar.mock.calls.length).toBe(requests);
    expect(harness.routeNativeElement?.querySelector('tbody')?.textContent).toContain('Producto B');
  });
});
