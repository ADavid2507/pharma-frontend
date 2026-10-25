import { computed, inject, OnDestroy, Service, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest,
  LoginResponse,
  Permiso,
  PerfilUsuario,
  PerfilResponse,
  Sesion,
} from './auth.model';

const CLAVE_SESION = 'pharmasoft.sesion';

@Service()
export class AuthService implements OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly url = `${environment.apiUrl}/auth`;

  private readonly sesionActual = signal<Sesion | null>(this.leerSesionGuardada());
  private temporizador?: ReturnType<typeof setTimeout>;
  private intervalo?: ReturnType<typeof setInterval>;
  private readonly avisoOculto = signal(false);

  readonly segundosRestantes = signal(0);
  readonly porVencer = computed(() => this.autenticado() && this.segundosRestantes() <= 120);
  readonly avisoSesionOculto = this.avisoOculto.asReadonly();

  readonly sesion = this.sesionActual.asReadonly();
  readonly autenticado = computed(() => this.sesionActual() !== null);

  constructor() {
    const sesion = this.sesionActual();
    if (sesion) this.programarExpiracion(sesion);
  }

  login(credenciales: LoginRequest): Observable<Sesion> {
    return this.http.post<LoginResponse>(`${this.url}/login`, credenciales).pipe(
      map((r) => ({
        token: r.token,
        expiraEn: Date.now() + r.expiraEnSegundos * 1000,
        username: r.username,
        nombreCompleto: r.nombreCompleto,
        roles: r.roles,
        permisos: r.permisos,
      })),
      tap((sesion) => this.iniciar(sesion)),
    );
  }

  cerrarSesion(motivo?: 'expirada', volverA?: string): void {
    this.limpiarTemporizadores();
    this.segundosRestantes.set(0);
    this.avisoOculto.set(false);
    sessionStorage.removeItem(CLAVE_SESION);
    this.sesionActual.set(null);

    const queryParams: Record<string, string> = {};
    if (motivo) queryParams['expirada'] = '1';
    if (volverA && volverA !== '/login') queryParams['returnUrl'] = volverA;
    this.router.navigate(['/login'], { queryParams });
  }

  obtenerPerfil(): Observable<PerfilUsuario> {
    return this.http.get<PerfilResponse>(`${this.url}/me`).pipe(
      map((r) => ({
        username: r.username,
        nombreCompleto: r.nombreCompleto ?? r.empleadoNombre ?? r.username,
        roles: r.roles,
        permisos: r.permisos,
      })),
    );
  }

  ocultarAvisoSesion(): void {
    this.avisoOculto.set(true);
  }

  ngOnDestroy(): void {
    this.limpiarTemporizadores();
  }

  token(): string | null {
    const sesion = this.sesionActual();
    return sesion && Date.now() < sesion.expiraEn ? sesion.token : null;
  }

  tienePermiso(permiso: Permiso): boolean {
    return this.sesionActual()?.permisos.includes(permiso) ?? false;
  }

  private iniciar(sesion: Sesion): void {
    sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesionActual.set(sesion);
    this.avisoOculto.set(false);
    this.programarExpiracion(sesion);
  }

  private programarExpiracion(sesion: Sesion): void {
    this.limpiarTemporizadores();
    const actualizarSegundos = () =>
      this.segundosRestantes.set(Math.max(0, Math.floor((sesion.expiraEn - Date.now()) / 1000)));
    actualizarSegundos();
    this.intervalo = setInterval(actualizarSegundos, 1000);
    const restante = sesion.expiraEn - Date.now();
    this.temporizador = setTimeout(
      () => this.cerrarSesion('expirada', this.router.url),
      Math.max(restante, 0),
    );
  }

  private limpiarTemporizadores(): void {
    clearTimeout(this.temporizador);
    clearInterval(this.intervalo);
    this.temporizador = undefined;
    this.intervalo = undefined;
  }

  private leerSesionGuardada(): Sesion | null {
    try {
      const texto = sessionStorage.getItem(CLAVE_SESION);
      if (!texto) return null;
      const sesion = JSON.parse(texto) as Sesion;
      if (!sesion.token || Date.now() >= sesion.expiraEn) {
        sessionStorage.removeItem(CLAVE_SESION);
        return null;
      }
      return sesion;
    } catch {
      sessionStorage.removeItem(CLAVE_SESION);
      return null;
    }
  }
}
