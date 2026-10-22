import { computed, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse, Permiso, Sesion } from './auth.model';
const CLAVE = 'pharmasoft.sesion';
@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly actual = signal<Sesion | null>(this.leer());
  private temporizador?: ReturnType<typeof setTimeout>;
  private aviso?: ReturnType<typeof setTimeout>;
  readonly sesion = this.actual.asReadonly();
  readonly autenticado = computed(() => this.actual() !== null);
  readonly porVencer = signal(false);
  constructor() {
    const s = this.actual();
    if (s) this.programar(s);
  }
  login(datos: LoginRequest) {
    return this.http.post<LoginResponse>(`${environment.apiUrl}/auth/login`, datos).pipe(
      map((r) => ({
        token: r.token,
        expiraEn: Date.now() + r.expiraEnSegundos * 1000,
        username: r.username,
        nombreCompleto: r.nombreCompleto,
        roles: r.roles,
        permisos: r.permisos,
      })),
      tap((s) => {
        sessionStorage.setItem(CLAVE, JSON.stringify(s));
        this.actual.set(s);
        this.programar(s);
      }),
    );
  }
  cerrarSesion(motivo?: 'expirada', volverA?: string) {
    this.ngOnDestroy();
    this.porVencer.set(false);
    sessionStorage.removeItem(CLAVE);
    this.actual.set(null);
    this.router.navigate(['/login'], {
      queryParams: {
        ...(motivo ? { expirada: '1' } : {}),
        ...(volverA && !volverA.startsWith('/login') ? { returnUrl: volverA } : {}),
      },
    });
  }
  token() {
    const s = this.actual();
    return s && Date.now() < s.expiraEn ? s.token : null;
  }
  tienePermiso(permiso: Permiso) {
    return !!this.token() && (this.actual()?.permisos.includes(permiso) ?? false);
  }
  ngOnDestroy() {
    clearTimeout(this.temporizador);
    clearTimeout(this.aviso);
  }
  private programar(s: Sesion) {
    this.ngOnDestroy();
    this.porVencer.set(false);
    const restante = s.expiraEn - Date.now();
    this.aviso = setTimeout(() => this.porVencer.set(true), Math.max(0, restante - 60000));
    this.temporizador = setTimeout(
      () => this.cerrarSesion('expirada', this.router.url),
      Math.max(0, restante),
    );
  }
  private leer(): Sesion | null {
    try {
      const s = JSON.parse(sessionStorage.getItem(CLAVE) ?? 'null');
      if (
        s &&
        typeof s.token === 'string' &&
        s.token.length &&
        Number.isFinite(s.expiraEn) &&
        s.expiraEn > Date.now() &&
        typeof s.username === 'string' &&
        typeof s.nombreCompleto === 'string' &&
        Array.isArray(s.roles) &&
        s.roles.every((r: unknown) => typeof r === 'string') &&
        Array.isArray(s.permisos) &&
        s.permisos.every((r: unknown) => typeof r === 'string')
      )
        return s;
    } catch {
      /* Una sesión dañada se descarta. */
    }
    sessionStorage.removeItem(CLAVE);
    return null;
  }
}
