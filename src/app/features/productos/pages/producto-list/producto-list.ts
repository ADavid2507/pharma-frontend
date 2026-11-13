import { Paginador } from '../../../../shared/components/paginador/paginador';
import { ConfirmacionService } from '../../../../shared/components/confirmacion/confirmacion-service';
import { SiPermiso } from '../../../../shared/directives/si-permiso';
import {
  Component,
  computed,
  inject,
  input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';

import { ProductoService } from '../../services/producto-service';

@Component({
  selector: 'app-producto-list',
  imports: [SiPermiso, RouterLink, CurrencyPipe, Paginador],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit, OnChanges, OnDestroy {
  readonly categoriaId = input<string>();
  private peticionListado?: Subscription;
  private rutaSubscription?: Subscription;
  private readonly ruta = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirmacion = inject(ConfirmacionService);
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(20);
  protected readonly ordenarPor = signal<OrdenProducto>('nombre');
  protected readonly direccion = signal<Direccion>('asc');

  protected readonly resultado = signal<PaginaResponse<Producto> | null>(null);
  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly categoriaFiltro = signal<number | null>(null);
  protected readonly filtroDesdeRuta = signal(false);
  protected readonly avisoRuta = signal<string | null>(null);
  protected readonly categoriaDisponible = computed(() =>
    this.categorias().some((c) => c.id_categoria === this.categoriaFiltro()),
  );
  protected readonly nombreCategoria = computed(
    () =>
      this.categorias().find((c) => c.id_categoria === this.categoriaFiltro())?.nombre ??
      `ID ${this.categoriaFiltro()}`,
  );
  protected readonly primeraCentena = computed(
    () => this.filtroDesdeRuta() && this.pagina() === 0 && this.tamanio() === 100,
  );

  protected readonly cargando = signal(false);
  protected readonly dandoDeBaja = signal<number | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly errorCategorias = signal<string | null>(null);

  protected readonly ocupado = computed(() => this.cargando() || this.dandoDeBaja() != null);

  protected readonly productos = computed(() => {
    const lista = this.resultado()?.contenido ?? [];
    const categoriaId = this.categoriaFiltro();

    return categoriaId === null ? lista : lista.filter((p) => p.categoriaId === categoriaId);
  });

  ngOnInit(): void {
    this.aplicarCategoriaRuta();
    this.categoriaService.listar().subscribe({
      next: (categorias) => this.categorias.set(categorias),
      error: (err: HttpErrorResponse) => this.errorCategorias.set(mensajeError(err)),
    });

    this.rutaSubscription = this.ruta.queryParamMap.subscribe((q) => {
      const entero = (v: string | null, defecto: number) =>
        v !== null && /^\d+$/.test(v) && Number.isSafeInteger(Number(v)) ? Number(v) : defecto;
      this.pagina.set(entero(q.get('pagina'), 0));
      const t = entero(q.get('tamanio'), this.filtroDesdeRuta() ? 100 : 20);
      this.tamanio.set([5, 10, 20, 50, 100].includes(t) ? t : 20);
      const orden = q.get('orden');
      this.ordenarPor.set(
        ['id', 'nombre', 'precio', 'stock'].includes(orden ?? '')
          ? (orden as OrdenProducto)
          : 'nombre',
      );
      this.direccion.set(q.get('dir') === 'desc' ? 'desc' : 'asc');
      this.peticionListado?.unsubscribe();
      this.cargando.set(false);
      this.cargar();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoriaId'] && !changes['categoriaId'].firstChange) {
      // Angular puede reutilizar esta página al cambiar solo la query string.
      this.peticionListado?.unsubscribe();
      this.cargando.set(false);
      this.aplicarCategoriaRuta();
      this.cargar();
    }
  }

  ngOnDestroy(): void {
    this.peticionListado?.unsubscribe();
    this.rutaSubscription?.unsubscribe();
  }

  private aplicarCategoriaRuta(): void {
    const valor = this.categoriaId();
    const valido =
      valor !== undefined && /^[1-9]\d*$/.test(valor) && Number.isSafeInteger(Number(valor));
    this.categoriaFiltro.set(valido ? Number(valor) : null);
    this.filtroDesdeRuta.set(valido);
    this.avisoRuta.set(
      valor !== undefined && !valido
        ? 'El identificador de categoría no es válido. Se muestran todas las categorías.'
        : null,
    );
    this.pagina.set(0);
    this.tamanio.set(valido ? 100 : 20);
  }

  cargar(): void {
    if (this.cargando()) return;

    this.cargando.set(true);
    this.error.set(null);

    this.peticionListado = this.productoService
      .listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion())
      .subscribe({
        next: (resultado) => {
          this.resultado.set(resultado);
          this.pagina.set(resultado.pagina);
          this.tamanio.set(resultado.tamanio);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.resultado.set(null);
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  irA(pagina: number): void {
    const resultado = this.resultado();

    if (this.ocupado() || !resultado || pagina < 0 || pagina >= resultado.totalPaginas) {
      return;
    }

    this.navegar({ pagina });
  }

  cambiarTamanio(valor: string): void {
    const tamanio = Number(valor);

    if (this.ocupado() || ![5, 10, 20, 50, 100].includes(tamanio)) return;

    this.navegar({ tamanio, pagina: 0 });
  }

  ordenar(campo: OrdenProducto): void {
    if (this.ocupado()) return;

    if (this.ordenarPor() === campo) {
      this.direccion.update((actual) => (actual === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }

    this.navegar({ orden: this.ordenarPor(), dir: this.direccion(), pagina: 0 });
  }

  private navegar(cambios: Record<string, string | number>): void {
    void this.router.navigate([], {
      relativeTo: this.ruta,
      queryParams: cambios,
      queryParamsHandling: 'merge',
    });
  }

  filtrarPorCategoria(valor: string): void {
    this.filtroDesdeRuta.set(false);
    this.categoriaFiltro.set(valor === '' ? null : Number(valor));
  }

  darDeBaja(producto: Producto): void {
    if (this.ocupado() || !producto.estado) return;

    this.confirmacion.solicitar(
      {
        titulo: 'Dar de baja al producto',
        mensaje: `¿Dar de baja al producto "${producto.nombre}"?`,
        textoConfirmar: 'Dar de baja',
      },
      () => {
        this.error.set(null);
        this.dandoDeBaja.set(producto.id);

        this.productoService.darDeBaja(producto.id).subscribe({
          next: () => {
            this.dandoDeBaja.set(null);
            this.cargar();
          },
          error: (err: HttpErrorResponse) => {
            this.dandoDeBaja.set(null);
            this.error.set(mensajeError(err));
          },
        });
      },
    );
  }
}
