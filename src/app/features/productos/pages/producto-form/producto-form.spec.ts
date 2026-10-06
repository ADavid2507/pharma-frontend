import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';

import { ProductoForm } from './producto-form';
import { environment } from '../../../../../environments/environment';

describe('ProductoForm', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductoForm],
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

  it('avisa cuando no hay categorías activas y no permite guardar', () => {
    const fixture = TestBed.createComponent(ProductoForm);
    fixture.detectChanges();

    http.expectOne(`${environment.apiUrl}/categorias`).flush([]);

    fixture.detectChanges();

    expect(fixture.nativeElement.textContent)
      .toContain('No hay categorías activas');

    expect(fixture.nativeElement.querySelector('form')).toBeNull();

    fixture.componentInstance.guardar();

    http.expectNone(
      (req) => req.url === `${environment.apiUrl}/productos`,
    );
  });
});