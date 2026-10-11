import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { mensajeError } from '../../../../core/utils/http-error';
import { redondear } from '../../../../core/utils/numeros';
import { coincide } from '../../../../core/utils/texto';
import { cargarPaginas } from '../../../../core/utils/cargar-paginas';
import { Cliente } from '../../../clientes/models/cliente.model';
import { ClienteService } from '../../../clientes/services/cliente-service';
import { Producto } from '../../../productos/models/producto.model';
import { ProductoService } from '../../../productos/services/producto-service';
import { VentaService } from '../../services/venta-service';

interface LineaForm {
  productoId: FormControl<number>;
  cantidad: FormControl<number>;
}
@Component({
  selector: 'app-venta-form',
  imports: [ReactiveFormsModule, RouterLink, CurrencyPipe],
  templateUrl: './venta-form.html',
  styleUrl: '../ventas.css',
})
export class VentaForm implements OnInit {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly ventas = inject(VentaService);
  private readonly clienteService = inject(ClienteService);
  private readonly productoService = inject(ProductoService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly clientes = signal<Cliente[]>([]);
  readonly productos = signal<Producto[]>([]);
  readonly cargando = signal(true);
  readonly confirmando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly imprimirAlRegistrar = signal(true);
  readonly form = this.fb.group({
    clienteId: this.fb.control<number | null>(null, Validators.required),
    detalles: this.fb.array<FormGroup<LineaForm>>([], Validators.required),
  });
  get detalles() {
    return this.form.controls.detalles;
  }
  readonly buscarCliente = new FormControl('', { nonNullable: true });
  readonly buscarProducto = new FormControl('', { nonNullable: true });
  private readonly textoCliente = toSignal(this.buscarCliente.valueChanges, { initialValue: '' });
  private readonly textoProducto = toSignal(this.buscarProducto.valueChanges, { initialValue: '' });
  readonly clientesEncontrados = computed(() =>
    this.textoCliente().trim()
      ? this.clientes()
          .filter((c) => coincide(this.textoCliente(), c.nombres, c.apellidos, c.dni))
          .slice(0, 6)
      : [],
  );
  readonly productosEncontrados = computed(() =>
    this.textoProducto().trim()
      ? this.productos()
          .filter((p) => coincide(this.textoProducto(), p.nombre, p.categoriaNombre))
          .slice(0, 6)
      : [],
  );
  private readonly valor = toSignal(this.form.valueChanges, { initialValue: this.form.value });
  private readonly productoPorId = computed(() => new Map(this.productos().map((p) => [p.id, p])));
  readonly lineas = computed(() =>
    (this.valor().detalles ?? []).map((d) => {
      const producto = this.productoPorId().get(d.productoId ?? 0);
      const cantidad = Number(d.cantidad) || 0;
      const precio = producto?.precio ?? 0;
      return {
        producto,
        precio,
        subtotal: redondear(precio * cantidad),
        excedeStock: !!producto && cantidad > producto.stock,
      };
    }),
  );
  readonly total = computed(() => redondear(this.lineas().reduce((s, l) => s + l.subtotal, 0)));
  readonly hayExcesoDeStock = computed(() => this.lineas().some((l) => l.excedeStock));
  readonly clienteElegido = computed(() =>
    this.clientes().find((c) => c.id === this.valor().clienteId),
  );
  ngOnInit() {
    this.cargarCatalogos();
  }
  private cargarCatalogos() {
    this.cargando.set(true);
    forkJoin({
      clientes: cargarPaginas((p) => this.clienteService.listar(p, 100)),
      productos: cargarPaginas((p) => this.productoService.listar(p, 100)),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ clientes, productos }) => {
          this.clientes.set(clientes.filter((c) => c.estado));
          this.productos.set(productos.filter((p) => p.estado && p.stock > 0));
          this.cargando.set(false);
        },
        error: (e: HttpErrorResponse) => {
          this.error.set(mensajeError(e));
          this.cargando.set(false);
        },
      });
  }
  elegirCliente(c: Cliente) {
    if (!this.confirmando() && !this.guardando()) {
      this.form.controls.clienteId.setValue(c.id);
      this.buscarCliente.setValue('');
    }
  }
  cambiarCliente() {
    if (!this.confirmando() && !this.guardando()) this.form.controls.clienteId.setValue(null);
  }
  agregarProducto(p: Producto) {
    if (this.confirmando() || this.guardando()) return;
    const existente = this.detalles.controls.find((l) => l.controls.productoId.value === p.id);
    if (existente)
      existente.controls.cantidad.setValue(Number(existente.controls.cantidad.value) + 1);
    else
      this.detalles.push(
        this.fb.group({
          productoId: this.fb.control(p.id, Validators.required),
          cantidad: this.fb.control(1, [
            Validators.required,
            Validators.min(1),
            Validators.pattern(/^\d+$/),
          ]),
        }),
      );
    this.buscarProducto.setValue('');
  }
  agregarPrimero(e: Event) {
    e.preventDefault();
    const p = this.productosEncontrados()[0];
    if (p) this.agregarProducto(p);
  }
  quitarLinea(i: number) {
    if (!this.confirmando() && !this.guardando()) this.detalles.removeAt(i);
  }
  cantidadEnDetalle(id: number) {
    return this.valor().detalles?.find((d) => d.productoId === id)?.cantidad ?? 0;
  }
  private validar() {
    this.form.markAllAsTouched();
    return (
      this.form.valid &&
      !this.hayExcesoDeStock() &&
      !!this.clienteElegido() &&
      this.lineas().every((l) => !!l.producto)
    );
  }
  revisar() {
    if (this.guardando() || this.cargando() || !this.validar()) return;
    this.error.set(null);
    this.confirmando.set(true);
  }
  volver() {
    if (!this.guardando()) this.confirmando.set(false);
  }
  confirmar() {
    if (!this.confirmando() || this.guardando() || !this.validar()) return;
    const v = this.form.getRawValue();
    this.guardando.set(true);
    this.ventas
      .registrar({
        clienteId: Number(v.clienteId),
        detalles: v.detalles.map((d) => ({
          productoId: Number(d.productoId),
          cantidad: Number(d.cantidad),
        })),
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (venta) => {
          void this.router.navigate(['/ventas', venta.id], {
            queryParams: this.imprimirAlRegistrar() ? { nueva: 1, imprimir: 1 } : { nueva: 1 },
          });
        },
        error: (e: HttpErrorResponse) => {
          this.guardando.set(false);
          this.confirmando.set(false);
          this.error.set(mensajeError(e));
          if (e.status === 409) this.cargarCatalogos();
        },
      });
  }
}
