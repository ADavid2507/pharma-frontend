import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

import { RouterLink } from '@angular/router';
import { Cliente } from '../../models/cliente.model';
import { ClienteService } from '../../services/cliente-service';
import { mensajeError } from '../../../../core/utils/http-error';

@Component({
  selector: 'app-cliente-list',
  imports: [RouterLink],
  templateUrl: './cliente-list.html',
  styleUrl: './cliente-list.css',
})
export class ClienteList implements OnInit {
  private readonly clienteService = inject(ClienteService);

  protected readonly clientes = signal<Cliente[]>([]);
  protected readonly pagina = signal(0);
  protected readonly tamanio = signal(10);
  protected readonly ordenarPor = signal<'dni' | 'apellidos'>('apellidos');
  protected readonly direccion = signal<'asc' | 'desc'>('asc');
  protected readonly totalElementos = signal(0);
  protected readonly totalPaginas = signal(0);
  protected readonly ultima = signal(true);
  protected readonly cargando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly filtro = signal('');
  protected readonly eliminando = signal<number | null>(null);
  protected readonly exito = signal<string | null>(
    typeof history !== 'undefined' ? (history.state?.mensaje ?? null) : null,
  );

  protected readonly filtradas = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    return this.clientes().filter((c) =>
      `${c.dni} ${c.nombres} ${c.apellidos}`.toLowerCase().includes(texto),
    );
  });

  ngOnInit(): void {
    if (typeof history !== 'undefined' && history.state?.mensaje)
      history.replaceState({ ...history.state, mensaje: null }, '');
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.clienteService
      .listar(this.pagina(), this.tamanio(), this.ordenarPor(), this.direccion())
      .subscribe({
        next: (datos) => {
          this.clientes.set(datos.contenido);
          this.pagina.set(datos.pagina);
          this.totalElementos.set(datos.totalElementos);
          this.totalPaginas.set(datos.totalPaginas);
          this.ultima.set(datos.ultima);
          this.cargando.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.clientes.set([]);
          this.error.set(mensajeError(err));
          this.cargando.set(false);
        },
      });
  }

  eliminar(cliente: Cliente): void {
    if (this.eliminando() !== null) return;
    if (!confirm(`¿Dar de baja al cliente "${cliente.nombres} ${cliente.apellidos}"?`)) {
      return;
    }
    this.error.set(null);
    this.exito.set(null);
    this.eliminando.set(cliente.id);
    this.clienteService.eliminar(cliente.id).subscribe({
      next: () => {
        this.eliminando.set(null);
        this.exito.set('Cliente dado de baja correctamente.');
        this.cargar();
      },
      error: (err: HttpErrorResponse) => {
        this.eliminando.set(null);
        this.error.set(mensajeError(err));
      },
    });
  }

  cambiarPagina(paso: number): void {
    if (
      this.cargando() ||
      this.eliminando() !== null ||
      (paso < 0 && this.pagina() === 0) ||
      (paso > 0 && this.ultima())
    )
      return;
    this.pagina.update((pagina) => pagina + paso);
    this.cargar();
  }

  cambiarTamanio(valor: string): void {
    const tamanio = Number(valor);
    if (this.cargando() || this.eliminando() !== null || ![5, 10, 20].includes(tamanio)) return;
    this.tamanio.set(tamanio);
    this.pagina.set(0);
    this.cargar();
  }

  ordenar(campo: 'dni' | 'apellidos'): void {
    if (this.cargando() || this.eliminando() !== null) return;
    this.direccion.set(this.ordenarPor() === campo && this.direccion() === 'asc' ? 'desc' : 'asc');
    this.ordenarPor.set(campo);
    this.pagina.set(0);
    this.cargar();
  }
}
