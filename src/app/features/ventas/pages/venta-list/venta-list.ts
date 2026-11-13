import { Paginador } from '../../../../shared/components/paginador/paginador';
import { Subscription } from 'rxjs';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  imports: [SiPermiso, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, Paginador],
  templateUrl: './venta-list.html',
  styleUrl: '../ventas.css',
})
export class VentaList implements OnInit {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private peticion?: Subscription;
  readonly tamanio = signal(20);
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
    this.ruta.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((q) => {
      const numero = (v: string | null, defecto: number) =>
        v !== null && /^\d+$/.test(v) && Number.isSafeInteger(Number(v)) ? Number(v) : defecto;
      const estado = q.get('estado');
      const fecha = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
      const filtros: FiltroVentas = {
        clienteId: numero(q.get('clienteId'), 0) || null,
        estado: estado === 'REGISTRADA' || estado === 'ANULADA' ? estado : null,
        desde: fecha(q.get('desde')),
        hasta: fecha(q.get('hasta')),
      };
      this.aplicados.set(filtros);
      this.filtros.patchValue(filtros);
      const t = numero(q.get('tamanio'), 20);
      this.tamanio.set([10, 20, 50, 100].includes(t) ? t : 20);
      if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
        this.peticion?.unsubscribe();
        this.cargando.set(false);
        this.resultado.set(null);
        this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
        return;
      }
      this.cargar(numero(q.get('pagina'), 0));
    });
  }
  buscar() {
    if (this.cargando()) return;
    const f = this.filtros.getRawValue();
    if (f.desde && f.hasta && f.desde > f.hasta) {
      this.error.set('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    this.navegar({ ...f, pagina: 0 });
  }
  limpiar() {
    if (!this.cargando()) {
      this.filtros.reset();
      this.buscar();
    }
  }
  irA(pagina: number) {
    if (!this.cargando() && pagina >= 0 && pagina < (this.resultado()?.totalPaginas ?? 0))
      this.navegar({ pagina });
  }
  cambiarTamanio(tamanio: number) {
    if (!this.cargando() && [10, 20, 50, 100].includes(tamanio))
      this.navegar({ tamanio, pagina: 0 });
  }
  private navegar(cambios: Record<string, string | number | null>) {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
    });
  }
  private cargar(pagina: number) {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.error.set(null);
    this.peticion = this.ventas
      .buscar(this.aplicados(), pagina, this.tamanio())
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
