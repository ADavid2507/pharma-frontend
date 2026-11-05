import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { MasVendidos } from './mas-vendidos';
import { environment } from '../../../environments/environment';

describe('MasVendidos', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      imports: [MasVendidos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }),
  );
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('renders the actual report response fields and currency', () => {
    const fixture = TestBed.createComponent(MasVendidos);
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/reportes/productos-mas-vendidos`)
      .flush([
        {
          productoId: 1,
          nombreProducto: 'Paracetamol',
          nombreCategoria: 'Analgésicos',
          cantidadVendida: 3,
          subtotalVendido: 12.5,
        },
      ]);
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tbody tr');
    expect(row.textContent).toContain('Paracetamol');
    expect(row.textContent).toContain('Analgésicos');
    expect(row.textContent).toContain('S/ 12.50');
  });

  it('keeps the guide empty state if the report request fails', () => {
    const fixture = TestBed.createComponent(MasVendidos);
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiUrl}/reportes/productos-mas-vendidos`)
      .flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay ventas registradas.');
  });
});
