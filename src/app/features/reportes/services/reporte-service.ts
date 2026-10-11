import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VentaPorCategoria, VentaPorCategoriaResponse } from '../models/reporte.model';

@Injectable({ providedIn: 'root' })
export class ReporteService {
  private readonly http = inject(HttpClient);

  ventasPorCategoria(desde: string | null, hasta: string | null): Observable<VentaPorCategoria[]> {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return this.http
      .get<VentaPorCategoriaResponse[]>(`${environment.apiUrl}/reportes/ventas-por-categoria`, {
        params,
      })
      .pipe(
        map((filas) =>
          filas.map((fila) => ({
            categoriaId: fila.idCategoria,
            categoriaNombre: fila.categoriaNombre,
            cantidadVendida: fila.cantidadVentas,
            montoTotal: fila.subtotalVentas,
          })),
        ),
      );
  }
}
