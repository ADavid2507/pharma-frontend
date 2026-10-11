import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { VentaForm } from './venta-form';
import { environment } from '../../../../../environments/environment';
import { Producto } from '../../../productos/models/producto.model';

describe('Registro de ventas', () => {
  let fixture: ComponentFixture<VentaForm>;
  let form: VentaForm;
  let http: HttpTestingController;
  const base = environment.apiUrl;
  const cliente = {
    id: 1,
    nombres: 'Ana',
    apellidos: 'Huamán',
    dni: '12345678',
    estado: true,
    email: 'ana@example.com',
    telefono: null,
    direccion: null,
    fechaCreacion: '',
    fechaModificacion: null,
  };
  const producto: Producto = {
    id: 2,
    nombre: 'Paracetamol 500 mg',
    categoriaNombre: 'Analgésicos',
    categoriaId: 1,
    precio: 12.5,
    stock: 5,
    estado: true,
    fechaCreacion: '',
    fechaActualizacion: null,
  };
  const page = <T>(contenido: T[]) => ({
    contenido,
    pagina: 0,
    tamanio: 100,
    totalElementos: contenido.length,
    totalPaginas: 1,
    ultima: true,
  });
  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [VentaForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    fixture = TestBed.createComponent(VentaForm);
    form = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url === `${base}/clientes`)
      .flush(page([cliente, { ...cliente, id: 3, estado: false }]));
    http
      .expectOne((r) => r.url === `${base}/productos`)
      .flush(page([producto, { ...producto, id: 4, stock: 0 }]));
    fixture.detectChanges();
  });
  afterEach(() => {
    http.verify();
    fixture.destroy();
  });
  it('bloquea el formulario vacío y cantidades inválidas', () => {
    form.revisar();
    expect(form.confirmando()).toBe(false);
    form.elegirCliente(cliente);
    form.agregarProducto(producto);
    for (const cantidad of [0, -1, 1.5, 6]) {
      form.detalles.at(0).controls.cantidad.setValue(cantidad);
      form.revisar();
      expect(form.confirmando()).toBe(false);
    }
    http.expectNone((r) => r.method === 'POST');
  });
  it('busca sin tildes y excluye registros no disponibles', () => {
    form.buscarCliente.setValue('huaman');
    expect(form.clientesEncontrados().map((c) => c.id)).toEqual([1]);
    form.buscarProducto.setValue('analgesicos para 500');
    expect(form.productosEncontrados().map((p) => p.id)).toEqual([2]);
    form.buscarCliente.setValue('inexistente');
    expect(form.clientesEncontrados()).toEqual([]);
  });
  it('combina duplicados, recalcula y elimina líneas', () => {
    form.agregarProducto(producto);
    form.agregarProducto(producto);
    expect(form.detalles.length).toBe(1);
    expect(form.total()).toBe(25);
    form.detalles.at(0).controls.cantidad.setValue(3);
    expect(form.total()).toBe(37.5);
    form.quitarLinea(0);
    expect(form.total()).toBe(0);
  });
  it('Enter agrega un producto sin confirmar y Volver no hace POST', () => {
    form.elegirCliente(cliente);
    form.buscarProducto.setValue('para');
    const evento = new Event('keydown', { cancelable: true });
    form.agregarPrimero(evento);
    expect(evento.defaultPrevented).toBe(true);
    expect(form.confirmando()).toBe(false);
    form.revisar();
    expect(form.confirmando()).toBe(true);
    form.volver();
    expect(form.confirmando()).toBe(false);
    http.expectNone((r) => r.method === 'POST');
  });
  it('confirma una sola vez y navega al comprobante', () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    form.elegirCliente(cliente);
    form.agregarProducto(producto);
    form.revisar();
    form.confirmar();
    form.confirmar();
    const req = http.expectOne({ url: `${base}/ventas`, method: 'POST' });
    expect(req.request.body).toEqual({ clienteId: 1, detalles: [{ productoId: 2, cantidad: 1 }] });
    req.flush({ id: 7 }, { status: 201, statusText: 'Created' });
    expect(navigate).toHaveBeenCalledWith(['/ventas', 7], {
      queryParams: { nueva: 1, imprimir: 1 },
    });
  });
  it('un 409 permite corregir y recarga la disponibilidad', () => {
    form.elegirCliente(cliente);
    form.agregarProducto(producto);
    form.revisar();
    form.confirmar();
    http
      .expectOne({ url: `${base}/ventas`, method: 'POST' })
      .flush({ message: 'Stock insuficiente' }, { status: 409, statusText: 'Conflict' });
    expect(form.error()).toBe('Stock insuficiente');
    expect(form.guardando()).toBe(false);
    expect(form.confirmando()).toBe(false);
    http.expectOne((r) => r.url === `${base}/clientes`).flush(page([cliente]));
    http.expectOne((r) => r.url === `${base}/productos`).flush(page([{ ...producto, stock: 0 }]));
    form.revisar();
    expect(form.confirmando()).toBe(false);
  });
});
