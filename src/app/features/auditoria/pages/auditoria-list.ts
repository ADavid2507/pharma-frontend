import { Component, computed, inject, linkedSignal } from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Paginador } from '../../../shared/components/paginador/paginador';
import { mensajeError } from '../../../core/utils/http-error';
import { HttpErrorResponse } from '@angular/common/http';
import { AuditoriaEvento, AuditoriaService, FiltroAuditoria } from '../auditoria-service';
import { PaginaResponse } from '../../../core/models/pagina-response';
@Component({
  selector: 'app-auditoria-list',
  imports: [DatePipe, ReactiveFormsModule, Paginador],
  templateUrl: './auditoria-list.html',
  styleUrl: './auditoria-list.css',
})
export class AuditoriaList {
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(AuditoriaService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly query = toSignal(this.ruta.queryParamMap, {
    initialValue: this.ruta.snapshot.queryParamMap,
  });
  readonly filtros = this.fb.group({ usuario: [''], accion: [''], desde: [''], hasta: [''] });
  readonly acciones = [
    'LOGIN_EXITOSO',
    'LOGIN_FALLIDO',
    'VENTA_REGISTRADA',
    'PRECIO_MODIFICADO',
    'PRODUCTO_ELIMINADO',
    'CLIENTE_REGISTRADO',
    'CATEGORIA_ELIMINADA',
  ];
  readonly consulta = computed<FiltroAuditoria>(() => {
    const q = this.query();
    const numero = (v: string | null, defecto: number) =>
      v !== null && /^\d+$/.test(v) && Number.isSafeInteger(Number(v)) ? Number(v) : defecto;
    const t = numero(q.get('tamanio'), 20);
    return {
      usuario: q.get('usuario') ?? '',
      accion: q.get('accion') ?? '',
      desde: q.get('desde') ?? '',
      hasta: q.get('hasta') ?? '',
      pagina: numero(q.get('pagina'), 0),
      tamanio: [10, 20, 50, 100].includes(t) ? t : 20,
    };
  });
  readonly rangoInvalido = computed(() => {
    const q = this.consulta();
    return !!q.desde && !!q.hasta && q.desde > q.hasta;
  });
  readonly recurso = rxResource({
    params: () => (this.rangoInvalido() ? undefined : this.consulta()),
    stream: ({ params }) => this.service.buscar(params),
  });
  readonly pagina = linkedSignal<PaginaResponse<AuditoriaEvento> | undefined, PaginaResponse<AuditoriaEvento> | undefined>({
    source: () => (this.recurso.hasValue() ? this.recurso.value() : undefined),
    computation: (nueva, previa) => nueva ?? previa?.value,
  });
  readonly error = computed(() => {
    if (this.rangoInvalido()) return 'La fecha desde no puede ser posterior a hasta.';
    const e = this.recurso.error();
    return e ? mensajeError(e as HttpErrorResponse) : null;
  });
  constructor() {
    // Sincroniza formulario al usar F5 o los botones atras y adelante del navegador.
    this.ruta.queryParamMap.pipe(takeUntilDestroyed()).subscribe((q) =>
      this.filtros.patchValue(
        {
          usuario: q.get('usuario') ?? '',
          accion: q.get('accion') ?? '',
          desde: q.get('desde') ?? '',
          hasta: q.get('hasta') ?? '',
        },
        { emitEvent: false },
      ),
    );
  }
  buscar() {
    const f = this.filtros.getRawValue();
    this.navegar({
      usuario: f.usuario.trim() || null,
      accion: f.accion || null,
      desde: f.desde || null,
      hasta: f.hasta || null,
      pagina: 0,
    });
  }
  limpiar() {
    this.filtros.reset();
    this.buscar();
  }
  irA(pagina: number) {
    this.navegar({ pagina });
  }
  cambiarTamanio(tamanio: number) {
    if ([10, 20, 50, 100].includes(tamanio)) this.navegar({ tamanio, pagina: 0 });
  }
  private navegar(cambios: Record<string, string | number | null>) {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
    });
  }
}

