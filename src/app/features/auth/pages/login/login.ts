import { Component, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth-service';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly returnUrl = input<string>();
  readonly expirada = input<string>();
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.pattern(/\S/)]],
    password: ['', Validators.required],
  });
  ingresar() {
    if (this.cargando()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.error.set(null);
    this.cargando.set(true);
    const datos = this.form.getRawValue();
    this.auth
      .login({ ...datos, username: datos.username.trim() })
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: () => {
          const url = this.returnUrl();
          this.router.navigateByUrl(
            url && /^\/(?![\/\\])/.test(url) && !url.includes('\\') && !url.startsWith('/login')
              ? url
              : '/inicio',
          );
        },
        error: (e: HttpErrorResponse) =>
          this.error.set(
            e.status === 401 || e.status === 403
              ? 'Usuario o contraseña incorrectos'
              : e.status === 0
                ? 'No se pudo conectar con el servidor.'
                : 'No se pudo iniciar sesión. Inténtelo nuevamente.',
          ),
      });
  }
}
