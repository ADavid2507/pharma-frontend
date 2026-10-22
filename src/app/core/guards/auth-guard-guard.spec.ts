import { TestBed } from '@angular/core/testing';
import {
  provideRouter,
  Router,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { authGuardGuard, invitadoGuard } from './auth-guard-guard';
describe('Guards de sesión', () => {
  let token: string | null;
  beforeEach(() => {
    token = null;
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: { token: () => token } }],
    });
  });
  it('recuerda la ruta solicitada al exigir login', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuardGuard({} as ActivatedRouteSnapshot, { url: '/ventas' } as RouterStateSnapshot),
    );
    expect(TestBed.inject(Router).serializeUrl(result as any)).toBe('/login?returnUrl=%2Fventas');
  });
  it('permite entrar con token vigente y evita regresar al login', () => {
    token = 'vigente';
    expect(
      TestBed.runInInjectionContext(() =>
        authGuardGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
      ),
    ).toBe(true);
    const result = TestBed.runInInjectionContext(() =>
      invitadoGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(TestBed.inject(Router).serializeUrl(result as any)).toBe('/inicio');
  });
});
