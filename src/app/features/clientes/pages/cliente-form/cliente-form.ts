import { Component, inject, input, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClienteRequest } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { erroresDeValidacion, mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-cliente-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './cliente-form.html',
  styleUrl: './cliente-form.css',
})
export class ClienteForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly service = inject(ClienteService);
  private readonly router = inject(Router);
  readonly id = input<string>();
  protected readonly guardando = signal(false);
  protected readonly cargando = signal(false);
  protected readonly disponible = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly erroresServidor = signal<Record<string, string>>({});
  protected readonly form = this.fb.group({
    dni: ['', [Validators.required, Validators.pattern(/^[0-9]{8}$/)]],
    nombres: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    apellidos: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.maxLength(150), Validators.email]],
    telefono: ['', [Validators.pattern(/^[0-9]{9}$/)]],
    direccion: ['', [Validators.maxLength(250)]],
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
          dni: c.dni ?? '',
          nombres: c.nombres ?? '',
          apellidos: c.apellidos ?? '',
          email: c.email ?? '',
          telefono: c.telefono ?? '',
          direccion: c.direccion ?? '',
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
    const dto: ClienteRequest = {
      dni: valores.dni.trim(),
      nombres: valores.nombres.trim(),
      apellidos: valores.apellidos.trim(),
      email: valores.email.trim(),
      telefono: valores.telefono.trim() || null,
      direccion: valores.direccion.trim() || null,
      estado: valores.estado,
    };
    const id = this.id();
    const peticion = id ? this.service.actualizar(Number(id), dto) : this.service.crear(dto);
    this.guardando.set(true);
    peticion.subscribe({
      next: () => {
        void this.router.navigate(['/clientes'], {
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
