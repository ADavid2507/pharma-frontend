import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ReporteService } from '../../services/reporte-service';
import { VentaPorCategoria } from '../../models/reporte.model';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';

@Component({
  selector: 'app-ventas-por-categoria',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './ventas-categoria.html',
  styleUrls: ['../../../ventas/pages/ventas.css', './ventas-categoria.css'],
})
export class VentasPorCategoria implements OnInit {
  private readonly servicio = inject(ReporteService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(NonNullableFormBuilder);
  readonly filtros = this.fb.group({
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });
  readonly filas = signal<VentaPorCategoria[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly resumen = signal('Histórico completo');
  readonly ahora = signal(new Date());
  readonly total = computed(() => redondear(this.filas().reduce((s, f) => s + f.montoTotal, 0)));
  readonly unidades = computed(() => this.filas().reduce((s, f) => s + f.cantidadVendida, 0));
  readonly montoMaximo = computed(() =>
    Math.max(0, ...this.filas().map((fila) => fila.montoTotal)),
  );
  porcentaje(monto: number): number {
    const maximo = this.montoMaximo();
    return maximo > 0 ? Math.min(100, Math.max(0, (monto / maximo) * 100)) : 0;
  }
  ngOnInit() {
    this.buscar();
  }
  buscar() {
    if (this.cargando()) return;
    const { desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    this.filas.set([]);
    this.servicio
      .ventasPorCategoria(desde, hasta)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (filas) => {
          this.filas.set(filas);
          this.resumen.set(
            [desde ? `Desde: ${desde}` : '', hasta ? `Hasta: ${hasta}` : '']
              .filter(Boolean)
              .join(' · ') || 'Histórico completo',
          );
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }
  limpiar() {
    if (!this.cargando()) {
      this.filtros.reset();
      this.buscar();
    }
  }
  imprimir() {
    if (!this.cargando() && this.filas().length) {
      this.ahora.set(new Date());
      setTimeout(() => window.print());
    }
  }
}
