import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
export interface VentaPorCategoria {
  idCategoria: number;
  categoriaNombre: string;
  /** El backend devuelve SUM(cantidad): unidades vendidas, no número de boletas. */
  cantidadVentas: number;
  subtotalVentas: number;
}
@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);
  ventasPorCategoria(desde: string | null, hasta: string | null) {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http.get<VentaPorCategoria[]>(
      `${environment.apiUrl}/reportes/ventas-por-categoria`,
      { params },
    );
  }
}
