import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { RouterLink } from '@angular/router';
import { Categoria } from '../../models/categoria.model';
import { CategoriaService } from '../../services/categoria-service';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-categoria-list',
  imports: [RouterLink],
  templateUrl: './categoria-list.html',
  styleUrl: './categoria-list.css',
})
export class CategoriaList implements OnInit {
  private readonly categoriaService = inject(CategoriaService);

  protected readonly categorias = signal<Categoria[]>([]);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');
  protected readonly eliminando = signal<number | null>(null);
  protected readonly exito = signal<string | null>(
    typeof history !== 'undefined' ? (history.state?.mensaje ?? null) : null,
  );

  protected readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.categorias().filter((c) => c.nombre.toLowerCase().includes(texto));
  });

  ngOnInit(): void {
    if (typeof history !== 'undefined' && history.state?.mensaje)
      history.replaceState({ ...history.state, mensaje: null }, '');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.categoriaService.listar().subscribe({
      next: (datos) => {
        this.categorias.set(datos);
        this.cargando.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.error.set(mensajeError(err));
        this.cargando.set(false);
      },
    });
  }

  eliminar(categoria: Categoria): void {
    if (this.eliminando() !== null) return;
    if (!confirm(`¿Dar de baja a la categoría "${categoria.nombre}"?`)) {
      return;
    }
    this.error.set(null);
    this.exito.set(null);
    this.eliminando.set(categoria.id_categoria);
    this.categoriaService.eliminar(categoria.id_categoria).subscribe({
      next: () => {
        this.eliminando.set(null);
        this.exito.set('Categoría dada de baja correctamente.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }
}
