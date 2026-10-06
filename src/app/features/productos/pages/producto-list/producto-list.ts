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
import { RouterLink } from '@angular/router';

import { PaginaResponse } from '../../../../core/models/pagina-response';
import { mensajeError } from '../../../../core/utils/http-error';
import { Categoria } from '../../../categorias/models/categoria.model';
import { CategoriaService } from '../../../categorias/services/categoria-service';
import { Direccion, OrdenProducto, Producto } from '../../models/producto.model';

import { ProductoService } from '../../services/producto-service';

@Component({
  selector: 'app-producto-list',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './producto-list.html',
  styleUrl: './producto-list.css',
})
export class ProductoList implements OnInit, OnChanges, OnDestroy {
  readonly categoriaId = input<string>();
  private peticionListado?: Subscription;
  private readonly productoService = inject(ProductoService);
  private readonly categoriaService = inject(CategoriaService);

  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
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

    this.cargar();
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
    this.tamanio.set(valido ? 100 : 10);
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

    this.pagina.set(pagina);
    this.cargar();
  }

  cambiarTamanio(valor: string): void {
    const tamanio = Number(valor);

    if (this.ocupado() || ![5, 10, 20, 100].includes(tamanio)) return;

    this.tamanio.set(tamanio);
    this.pagina.set(0);
    this.cargar();
  }

  ordenar(campo: OrdenProducto): void {
    if (this.ocupado()) return;

    if (this.ordenarPor() === campo) {
      this.direccion.update((actual) => (actual === 'asc' ? 'desc' : 'asc'));
    } else {
      this.ordenarPor.set(campo);
      this.direccion.set('asc');
    }

    this.pagina.set(0);
    this.cargar();
  }

  filtrarPorCategoria(valor: string): void {
    this.filtroDesdeRuta.set(false);
    this.categoriaFiltro.set(valor === '' ? null : Number(valor));
  }

  darDeBaja(producto: Producto): void {
    if (this.ocupado() || !producto.estado) return;

    if (!confirm(`¿Dar de baja al producto "${producto.nombre}"?`)) {
      return;
    }

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
  }
}
