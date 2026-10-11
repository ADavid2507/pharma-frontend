import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Injector,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { catchError, map, of, Subscription, switchMap } from 'rxjs';
import { mensajeError } from '../../../../core/utils/http-error';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

@Component({
  selector: 'app-venta-detalle',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './venta-detalle.html',
  styleUrl: '../ventas.css',
})
export class VentaDetalle {
  private readonly ventas = inject(VentaService);
  private readonly clientes = inject(ClienteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  readonly id = input.required<string>();
  readonly nueva = input<string>();
  readonly imprimir = input<string>();
  readonly venta = signal<Venta | null>(null);
  readonly cliente = signal<Cliente | null>(null);
  readonly error = signal<string | null>(null);
  readonly cargando = signal(true);
  readonly fechaImpresion = signal(new Date());
  readonly numero = computed(() => String(this.venta()?.id ?? '').padStart(6, '0'));
  readonly unidades = computed(
    () => this.venta()?.detalles.reduce((s, d) => s + d.cantidad, 0) ?? 0,
  );
  private peticion?: Subscription;
  constructor() {
    effect((onCleanup) => {
      const id = this.id();
      const imprimir = this.imprimir() === '1';
      this.venta.set(null);
      this.cliente.set(null);
      this.error.set(null);
      this.cargando.set(true);
      if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) {
        this.error.set('El identificador de venta no es válido.');
        this.cargando.set(false);
        return;
      }
      let activo = true;
      this.peticion = this.ventas
        .obtener(Number(id))
        .pipe(
          switchMap((venta) =>
            this.clientes.obtener(venta.clienteId).pipe(
              catchError(() => of(null)),
              map((cliente) => ({ venta, cliente })),
            ),
          ),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: ({ venta, cliente }) => {
            this.venta.set(venta);
            this.cliente.set(cliente);
            this.cargando.set(false);
            if (imprimir)
              afterNextRender(
                () => {
                  if (activo) this.imprimirComprobante();
                },
                { injector: this.injector },
              );
          },
          error: (e: HttpErrorResponse) => {
            this.error.set(mensajeError(e));
            this.cargando.set(false);
          },
        });
      onCleanup(() => {
        activo = false;
        this.peticion?.unsubscribe();
      });
    });
  }
  imprimirComprobante() {
    if (!this.venta()) return;
    this.fechaImpresion.set(new Date());
    afterNextRender(() => window.print(), { injector: this.injector });
  }
}
