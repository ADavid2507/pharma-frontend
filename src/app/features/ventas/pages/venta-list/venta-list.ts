import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { cargarPaginas } from '../../../../core/utils/cargar-paginas';
import { redondear } from '../../../../core/utils/numeros';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { EstadoVenta, FiltroVentas, Venta } from '../../models/venta.model';
import { VentaService } from '../../services/venta-service';

@Component({
  selector: 'app-venta-list',
  imports: [SiPermiso, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe],
  templateUrl: './venta-list.html',
  styleUrl: '../ventas.css',
})
export class VentaList implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventas = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly destroyRef = inject(DestroyRef);
  readonly clientes = signal<Cliente[]>([]);
  readonly resultado = signal<PaginaResponse<Venta> | null>(null);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly errorClientes = signal<string | null>(null);
  readonly filtros = this.fb.group({
    clienteId: this.fb.control<number | null>(null),
    estado: this.fb.control<EstadoVenta | null>(null),
    desde: this.fb.control<string | null>(null),
    hasta: this.fb.control<string | null>(null),
  });
  readonly aplicados = signal<FiltroVentas>({
    clienteId: null,
    estado: null,
    desde: null,
    hasta: null,
  });
  readonly ahora = signal(new Date());
  readonly totalPagina = computed(() =>
    redondear(
      (this.resultado()?.contenido ?? [])
        .filter((v) => v.estado === 'REGISTRADA')
        .reduce((s, v) => s + v.total, 0),
    ),
  );
  readonly resumenFiltros = computed(() => {
    const f = this.aplicados();
    const c = this.clientes().find((c) => c.id === f.clienteId);
    return (
      [
        f.clienteId ? `Cliente: ${c ? c.apellidos + ', ' + c.nombres : f.clienteId}` : '',
        f.estado ? `Estado: ${f.estado}` : '',
        f.desde ? `Desde: ${f.desde}` : '',
        f.hasta ? `Hasta: ${f.hasta}` : '',
      ]
        .filter(Boolean)
        .join(' · ') || 'Todas las ventas'
    );
  });
  ngOnInit() {
    cargarPaginas((p) => this.clienteService.listar(p, 100))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => this.clientes.set(c),
        error: (e: HttpErrorResponse) => this.errorClientes.set(mensajeError(e)),
      });
    this.cargar(0);
  }
  buscar() {
    if (this.cargando()) return;
    const f = this.filtros.getRawValue();
    if (f.desde && f.hasta && f.desde > f.hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.aplicados.set(f);
    this.cargar(0);
  }
  limpiar() {
    if (!this.cargando()) {
      this.filtros.reset();
      this.buscar();
    }
  }
  irA(pagina: number) {
    if (!this.cargando() && pagina >= 0 && pagina < (this.resultado()?.totalPaginas ?? 0))
      this.cargar(pagina);
  }
  private cargar(pagina: number) {
    this.cargando.set(true);
    this.error.set(null);
    this.resultado.set(null);
    this.ventas
      .buscar(this.aplicados(), pagina, 10)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (r) => {
          if (Array.isArray(r)) {
            this.error.set(
              'El backend devuelve la consulta anterior sin paginación. Reinicie PharmaBackend con el código actualizado.',
            );
            this.cargando.set(false);
            return;
          }
          this.resultado.set(r);
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }
  imprimirConsulta() {
    if (this.cargando() || !this.resultado()?.contenido.length) return;
    this.ahora.set(new Date());
    setTimeout(() => window.print());
  }
}
