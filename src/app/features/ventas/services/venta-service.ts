import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PaginaResponse } from '../../../core/models/pagina-response';
import { FiltroVentas, Venta, VentaRequest } from '../models/venta.model';

@Injectable({ providedIn: 'root' })
export class VentaService {
  private readonly http = inject(HttpClient);
  private readonly url = `${environment.apiUrl}/ventas`;
  registrar(dto: VentaRequest) {
    return this.http.post<Venta>(this.url, dto);
  }
  obtener(id: number) {
    return this.http.get<Venta>(`${this.url}/${id}`);
  }
  buscar(filtro: FiltroVentas, pagina = 0, tamanio = 10) {
    let params = new HttpParams()
      .set('pagina', pagina)
      .set('tamanio', tamanio)
      .set('ordenarPor', 'fechaRegistro')
      .set('direccion', 'desc');
    for (const [campo, valor] of Object.entries(filtro)) {
      if (valor !== null && valor !== '') params = params.set(campo, valor);
    }
    return this.http.get<PaginaResponse<Venta>>(`${this.url}/buscar`, { params });
  }
}
