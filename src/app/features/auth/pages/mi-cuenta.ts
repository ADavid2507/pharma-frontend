import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/auth/auth-service';
import { PerfilUsuario, Permiso } from '../../../core/auth/auth.model';
import { mensajeError } from '../../../core/utils/http-error';

interface GrupoPermisos {
  modulo: string;
  permisos: { codigo: Permiso; etiqueta: string }[];
}

@Component({
  selector: 'app-mi-cuenta',
  templateUrl: './mi-cuenta.html',
  styleUrl: './mi-cuenta.css',
})
export class MiCuenta implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly perfil = signal<PerfilUsuario | null>(null);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly permisosCambiaron = computed(() => {
    const perfil = this.perfil();
    const sesion = this.auth.sesion();
    if (!perfil || !sesion) return false;
    const servidor = new Set(perfil.permisos);
    const guardados = new Set(sesion.permisos);
    return servidor.size !== guardados.size || [...servidor].some((p) => !guardados.has(p));
  });
  protected readonly grupos: GrupoPermisos[] = [
    {
      modulo: 'Catálogo',
      permisos: [
        { codigo: 'CATALOGO_LEER', etiqueta: 'Consultar catálogo' },
        { codigo: 'CATALOGO_ESCRIBIR', etiqueta: 'Modificar catálogo' },
      ],
    },
    {
      modulo: 'Clientes',
      permisos: [
        { codigo: 'CLIENTES_LEER', etiqueta: 'Consultar clientes' },
        { codigo: 'CLIENTES_ESCRIBIR', etiqueta: 'Modificar clientes' },
      ],
    },
    {
      modulo: 'Ventas',
      permisos: [
        { codigo: 'VENTAS_LEER', etiqueta: 'Consultar ventas' },
        { codigo: 'VENTAS_REGISTRAR', etiqueta: 'Registrar ventas' },
      ],
    },
    { modulo: 'Reportes', permisos: [{ codigo: 'REPORTES_VER', etiqueta: 'Ver reportes' }] },
    {
      modulo: 'Usuarios',
      permisos: [{ codigo: 'USUARIOS_ADMINISTRAR', etiqueta: 'Administrar usuarios' }],
    },
  ];

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    if (this.cargando()) return;
    this.cargando.set(true);
    this.error.set(null);
    this.perfil.set(null);
    this.auth
      .obtenerPerfil()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (perfil) => {
          this.perfil.set(perfil);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  salir(): void {
    this.auth.cerrarSesion();
  }
}
