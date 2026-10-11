export interface VentaPorCategoria {
  categoriaId: number;
  categoriaNombre: string;
  cantidadVendida: number;
  montoTotal: number;
}

/** Contrato actual del backend; cantidadVentas representa unidades vendidas. */
export interface VentaPorCategoriaResponse {
  idCategoria: number;
  categoriaNombre: string;
  cantidadVentas: number;
  subtotalVentas: number;
}
