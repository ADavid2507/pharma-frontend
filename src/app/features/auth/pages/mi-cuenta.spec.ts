import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../../core/auth/auth-service';
import { MiCuenta } from './mi-cuenta';
import { environment } from '../../../../environments/environment';

describe('MiCuenta con datos del servidor', () => {
  let http: HttpTestingController;
  let auth: AuthService;
  const url = `${environment.apiUrl}/auth/me`;
  const datos = {
    username: 'vendedor',
    nombreCompleto: 'Nombre del servidor',
    roles: ['VENDEDOR'],
    permisos: ['VENTAS_LEER', 'CATALOGO_LEER'],
  };
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      imports: [MiCuenta],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
    auth.login({ username: 'vendedor', password: 'prueba' }).subscribe();
    http
      .expectOne(`${environment.apiUrl}/auth/login`)
      .flush({
        ...datos,
        token: 'prueba',
        tipo: 'Bearer',
        expiraEnSegundos: 3600,
        nombreCompleto: 'Nombre de la sesión',
      });
  });
  afterEach(() => {
    http.verify();
    auth.ngOnDestroy();
    sessionStorage.clear();
  });
  it('muestra carga y luego nombre, roles y cinco módulos con permisos concedidos y denegados', async () => {
    const f = TestBed.createComponent(MiCuenta);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Cargando');
    http
      .expectOne(url)
      .flush({ ...datos, nombreCompleto: undefined, empleadoNombre: 'Empleado del backend local' });
    await f.whenStable();
    const texto = f.nativeElement.textContent;
    for (const esperado of [
      'Empleado del backend local',
      'VENDEDOR',
      'Catálogo',
      'Clientes',
      'Ventas',
      'Reportes',
      'Usuarios',
      '✔',
      '✘',
    ])
      expect(texto).toContain(esperado);
    expect(texto).not.toContain('Sus permisos cambiaron');
    expect(texto).not.toContain('Nombre de la sesión');
  });
  it('compara permisos sin depender del orden y no reemplaza la sesión', async () => {
    const f = TestBed.createComponent(MiCuenta);
    await f.whenStable();
    const antes = sessionStorage.getItem('pharmasoft.sesion');
    http.expectOne(url).flush({ ...datos, permisos: [...datos.permisos].reverse() });
    await f.whenStable();
    expect(f.nativeElement.textContent).not.toContain('Sus permisos cambiaron');
    expect(sessionStorage.getItem('pharmasoft.sesion')).toBe(antes);
  });
  it('avisa si el servidor agrega o elimina permisos', async () => {
    const f = TestBed.createComponent(MiCuenta);
    await f.whenStable();
    http.expectOne(url).flush({ ...datos, permisos: ['CATALOGO_LEER', 'VENTAS_REGISTRAR'] });
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain(
      'Sus permisos cambiaron. Cierre sesión y vuelva a ingresar para actualizarlos',
    );
    expect(auth.tienePermiso('VENTAS_REGISTRAR')).toBe(false);
  });
  it('muestra error de conexión y permite reintentar', async () => {
    const f = TestBed.createComponent(MiCuenta);
    await f.whenStable();
    http.expectOne(url).error(new ProgressEvent('error'));
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'No se pudo conectar',
    );
    const botones = Array.from(f.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    botones.find((b) => b.textContent?.includes('Reintentar'))!.click();
    await f.whenStable();
    http.expectOne(url).flush(datos);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Nombre del servidor');
    expect(auth.autenticado()).toBe(true);
  });
});
