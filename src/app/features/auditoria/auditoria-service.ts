import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PaginaResponse } from '../../core/models/pagina-response';
export interface AuditoriaEvento {
  id: number;
  fecha: string;
  usuario: string;
  accion: string;
  entidad: string;
  entidadId: number | null;
  detalle: string | null;
  requestId: string | null;
}
export interface FiltroAuditoria {
  usuario: string;
  accion: string;
  desde: string;
  hasta: string;
  pagina: number;
  tamanio: number;
}
@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  buscar(filtro: FiltroAuditoria) {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtro))
      if (valor !== '') params = params.set(clave, valor);
    return this.http.get<PaginaResponse<AuditoriaEvento>>(`${environment.apiUrl}/auditoria`, {
      params,
    });
  }
}
