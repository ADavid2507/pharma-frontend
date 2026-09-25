import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoriaRequest } from '../../models/categoria.model';
import { CategoriaService } from '../../services/categoria-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-categoria-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './categoria-form.html',
  styleUrl: './categoria-form.css',
})
export class CategoriaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(CategoriaService);
  private readonly router = inject(Router);
  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly cargando = signal(false);
  protected readonly disponible = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30)]],
    descripcion: ['', [Validators.maxLength(200)]],
    estado: [true],
  });
  protected esEdicion(): boolean {
    return !!this.id();
  }
  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.disponible.set(false);
    if (!/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id))) {
      this.error.set('El identificador no es válido.');
      return;
    }
    this.cargando.set(true);
    this.service.obtener(Number(id)).subscribe({
      next: (c) => {
        this.form.setValue({
          nombre: c.nombre ?? '',
          descripcion: c.descripcion ?? '',
          estado: c.estado,
        });
        this.disponible.set(true);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }
  guardar(): void {
    if (this.guardando() || this.cargando() || !this.disponible()) return;
    // Validate the same trimmed values that will be sent to the API.
    for (const control of Object.values(this.form.controls)) {
      if (typeof control.value === 'string') control.setValue(control.value.trim() as never);
    }
    this.error.set(null);
    this.erroresServidor.set({});
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valores = this.form.getRawValue();
    const dto: CategoriaRequest = {
      nombre: valores.nombre.trim(),
      descripcion: valores.descripcion.trim() || null,
      estado: valores.estado,
    };
    const id = this.id();
    const peticion = id ? this.service.actualizar(Number(id), dto) : this.service.crear(dto);
    this.guardando.set(true);
    peticion.subscribe({
      next: () => {
        void this.router.navigate(['/categorias'], {
          state: {
            mensaje: id ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.',
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.guardando.set(false);
        this.error.set(mensajeError(err));
        this.erroresServidor.set(erroresDeValidacion(err));
      },
    });
  }
}
