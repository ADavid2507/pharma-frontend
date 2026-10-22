import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi, afterEach, beforeEach, describe, it, expect } from 'vitest';
import { AuthService } from './auth-service';
import { environment } from '../../../environments/environment';
import { authInterceptor } from '../interceptors/auth-interceptor';
import { errorInterceptor } from '../interceptors/error-interceptor';
const respuesta = {
  token: 'token-prueba',
  tipo: 'Bearer',
  expiraEnSegundos: 120,
  username: 'vendedor',
  nombreCompleto: 'Vendedor',
  roles: ['VENDEDOR'],
  permisos: ['CATALOGO_LEER'],
};
describe('Seguridad integrada con HTTP simulado', () => {
  let auth: AuthService;
  let http: HttpClient;
  let backend: HttpTestingController;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => {
    backend.verify();
    auth.cerrarSesion();
    sessionStorage.clear();
    vi.useRealTimers();
  });
  function login() {
    auth.login({ username: 'vendedor', password: 'prueba' }).subscribe();
    const req = backend.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush(respuesta);
  }
  it('guarda vencimiento y permisos y agrega Bearer a la API', () => {
    login();
    expect(auth.token()).toBe('token-prueba');
    expect(auth.tienePermiso('CATALOGO_ESCRIBIR')).toBe(false);
    expect(JSON.parse(sessionStorage.getItem('pharmasoft.sesion')!).expiraEn).toBeGreaterThan(
      Date.now(),
    );
    http.get(`${environment.apiUrl}/productos`).subscribe();
    const r = backend.expectOne(`${environment.apiUrl}/productos`);
    expect(r.request.headers.get('Authorization')).toBe('Bearer token-prueba');
    r.flush([]);
  });
  it('no envia el token a destinos ajenos', () => {
    login();
    for (const url of ['https://example.org']) {
      http.get(url).subscribe();
      const r = backend.expectOne(url);
      expect(r.request.headers.has('Authorization')).toBe(false);
      r.flush({});
    }
  });
  it('mantiene la sesión ante 403 y la elimina ante 401', () => {
    login();
    for (const status of [403, 401]) {
      http.get(`${environment.apiUrl}/productos`).subscribe({ error: () => {} });
      backend
        .expectOne(`${environment.apiUrl}/productos`)
        .flush({}, { status, statusText: 'Error' });
      expect(auth.autenticado()).toBe(status === 403);
    }
    expect(sessionStorage.getItem('pharmasoft.sesion')).toBeNull();
  });
  it('un 401 del login no redirige ni identifica el dato incorrecto', () => {
    auth.login({ username: 'x', password: 'x' }).subscribe({ error: () => {} });
    backend
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });
  it('cierra la sesión automáticamente al vencer', () => {
    vi.useFakeTimers();
    login();
    vi.advanceTimersByTime(60000);
    expect(auth.autenticado()).toBe(true);
    vi.advanceTimersByTime(60000);
    expect(auth.token()).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/login'],
      expect.objectContaining({ queryParams: expect.objectContaining({ expirada: '1' }) }),
    );
  });
});
