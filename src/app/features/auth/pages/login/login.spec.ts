import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { AuthService } from '../../../../core/auth/auth-service';
import { environment } from '../../../../../environments/environment';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [Login],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

// Casos de la matriz que deben conservar el comportamiento de la guía práctica.
describe('Login de la actividad autónoma', () => {
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;
  let router: Router;
  beforeEach(async () => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(Login);
    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();
  });
  afterEach(() => {
    http.verify();
    TestBed.inject(AuthService).ngOnDestroy();
    sessionStorage.clear();
  });
  function rellenar() {
    for (const [campo, valor] of [
      ['username', 'vendedor'],
      ['password', 'prueba'],
    ]) {
      const input = fixture.nativeElement.querySelector(
        `[formControlName="${campo}"]`,
      ) as HTMLInputElement;
      input.value = valor;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  function enviar() {
    fixture.nativeElement
      .querySelector('form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  }
  const respuesta = {
    token: 'token-prueba',
    tipo: 'Bearer',
    expiraEnSegundos: 180,
    username: 'vendedor',
    nombreCompleto: 'Vendedor',
    roles: ['VENDEDOR'],
    permisos: ['CATALOGO_LEER'],
  };
  it('L-01 no hace peticiones con el formulario vacío', () => {
    enviar();
    http.expectNone(`${environment.apiUrl}/auth/login`);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ingrese su usuario.');
  });
  it('L-03 evita dos POST aunque se envíe el formulario dos veces', () => {
    rellenar();
    enviar();
    enviar();
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    req.flush(respuesta);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/inicio');
  });
  for (const url of ['https://sitio-falso.com', '//sitio-falso.com']) {
    it(`rechaza returnUrl externo ${url}`, () => {
      fixture.componentRef.setInput('returnUrl', url);
      rellenar();
      enviar();
      http.expectOne(`${environment.apiUrl}/auth/login`).flush(respuesta);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/inicio');
    });
  }
  it('L-02 conserva el usuario y borra contraseña ante 401', () => {
    rellenar();
    enviar();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush(
        { message: 'Usuario o contraseña incorrectos' },
        { status: 401, statusText: 'Unauthorized' },
      );
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[formControlName="username"]').value).toBe(
      'vendedor',
    );
    expect(fixture.nativeElement.querySelector('[formControlName="password"]').value).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Usuario o contraseña incorrectos');
  });
});
