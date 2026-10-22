import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { permisoGuardGuard } from './permiso-guard-guard';
describe('Guard de permisos', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { tienePermiso: (p: string) => p === 'CATALOGO_LEER' } },
      ],
    }),
  );
  it('autoriza lectura y rechaza escritura sin cerrar sesión', () => {
    for (const permiso of ['CATALOGO_LEER', 'CATALOGO_ESCRIBIR']) {
      const result = TestBed.runInInjectionContext(() =>
        permisoGuardGuard(
          { data: { permiso } } as unknown as ActivatedRouteSnapshot,
          {} as RouterStateSnapshot,
        ),
      );
      if (permiso === 'CATALOGO_LEER') expect(result).toBe(true);
      else expect(TestBed.inject(Router).serializeUrl(result as any)).toBe('/acceso-denegado');
    }
  });
});
