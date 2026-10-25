import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from './auth-service';
import { environment } from '../../../environments/environment';

describe('Aviso y ciclo de vida de la sesión', () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const respuesta = {
    token: 'token-de-prueba',
    tipo: 'Bearer',
    expiraEnSegundos: 180,
    username: 'vendedor',
    nombreCompleto: 'Vendedor',
    roles: ['VENDEDOR'],
    permisos: ['CATALOGO_LEER'],
  };
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });
  afterEach(() => {
    auth.ngOnDestroy();
    http.verify();
    sessionStorage.clear();
    vi.useRealTimers();
  });
  function entrar() {
    auth.login({ username: 'vendedor', password: 'prueba' }).subscribe();
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);
  }
  it('B-01 aparece al quedar 120 segundos y B-02 actualiza cada segundo', () => {
    entrar();
    expect(auth.segundosRestantes()).toBe(180);
    expect(auth.porVencer()).toBe(false);
    vi.advanceTimersByTime(59000);
    expect(auth.porVencer()).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(auth.segundosRestantes()).toBe(120);
    expect(auth.porVencer()).toBe(true);
    vi.advanceTimersByTime(13000);
    expect(auth.segundosRestantes()).toBe(107);
  });
  it('B-03 mantiene el aviso oculto hasta la siguiente sesión', () => {
    entrar();
    vi.advanceTimersByTime(60000);
    auth.ocultarAvisoSesion();
    vi.advanceTimersByTime(1000);
    expect(auth.avisoSesionOculto()).toBe(true);
    auth.cerrarSesion();
    entrar();
    expect(auth.avisoSesionOculto()).toBe(false);
  });
  it('B-04 al vencer vuelve al login y limpia ambos temporizadores', () => {
    entrar();
    vi.advanceTimersByTime(180000);
    expect(auth.sesion()).toBeNull();
    expect(auth.segundosRestantes()).toBe(0);
    expect(auth.porVencer()).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(
      ['/login'],
      expect.objectContaining({
        queryParams: expect.objectContaining({ expirada: '1', returnUrl: '/' }),
      }),
    );
  });
  it('cerrar sesión manualmente elimina el intervalo y no redirige después', () => {
    entrar();
    auth.cerrarSesion();
    expect(vi.getTimerCount()).toBe(0);
    vi.mocked(TestBed.inject(Router).navigate).mockClear();
    vi.advanceTimersByTime(180000);
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });
  it('reemplazar la sesión cancela el temporizador anterior', () => {
    entrar();
    vi.advanceTimersByTime(60000);
    entrar();
    vi.advanceTimersByTime(120000);
    expect(auth.autenticado()).toBe(true);
    expect(auth.segundosRestantes()).toBe(60);
    auth.ngOnDestroy();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('recupera la cuenta regresiva de sessionStorage al recargar', () => {
    auth.ngOnDestroy();
    TestBed.resetTestingModule();
    sessionStorage.setItem(
      'pharmasoft.sesion',
      JSON.stringify({ ...respuesta, expiraEn: Date.now() + 90000 }),
    );
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    expect(auth.segundosRestantes()).toBe(90);
    expect(auth.porVencer()).toBe(true);
    vi.advanceTimersByTime(1000);
    expect(auth.segundosRestantes()).toBe(89);
  });
});
