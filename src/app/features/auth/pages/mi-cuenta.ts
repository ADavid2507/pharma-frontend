import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../../core/auth/auth-service';
@Component({
  selector: 'app-mi-cuenta',
  imports: [DatePipe],
  template: `<section>
    <h1>Mi cuenta</h1>
    @if (auth.sesion(); as s) {
      <p>{{ s.nombreCompleto }} ({{ s.username }})</p>
      <h2>Roles</h2>
      <p>{{ s.roles.join(' · ') }}</p>
      <h2>Permisos</h2>
      <ul>
        @for (p of s.permisos; track p) {
          <li>{{ p }}</li>
        }
      </ul>
      <p>La sesión vence: {{ s.expiraEn | date: 'dd/MM/yyyy HH:mm:ss' }}</p>
      <button type="button" (click)="auth.cerrarSesion()">Cerrar sesión</button>
    }
  </section>`,
})
export class MiCuenta {
  readonly auth = inject(AuthService);
}
