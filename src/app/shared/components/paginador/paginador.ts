import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
@Component({
  selector: 'app-paginador',
  imports: [FormsModule],
  templateUrl: './paginador.html',
  styleUrl: './paginador.css',
})
export class Paginador {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly totalElementos = input.required<number>();
  readonly tamanio = input.required<number>();
  readonly tamanios = input<number[]>([10, 20, 50, 100]);
  readonly deshabilitado = input(false);
  readonly cambioPagina = output<number>();
  readonly cambioTamanio = output<number>();
  protected readonly desde = computed(() =>
    this.totalElementos() === 0 ? 0 : this.pagina() * this.tamanio() + 1,
  );
  protected readonly hasta = computed(() =>
    Math.min((this.pagina() + 1) * this.tamanio(), this.totalElementos()),
  );
  protected ir(pagina: number): void {
    if (
      !this.deshabilitado() &&
      pagina >= 0 &&
      pagina < this.totalPaginas() &&
      pagina !== this.pagina()
    )
      this.cambioPagina.emit(pagina);
  }
}
