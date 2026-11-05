import { Injectable, signal } from '@angular/core';
export interface OpcionesConfirmacion {
  titulo?: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
}
@Injectable({ providedIn: 'root' })
export class ConfirmacionService {
  private readonly estado = signal<OpcionesConfirmacion | null>(null);
  readonly opciones = this.estado.asReadonly();
  private accion?: () => void;
  solicitar(opciones: OpcionesConfirmacion, accion: () => void): void {
    if (this.estado()) return;
    this.accion = accion;
    this.estado.set(opciones);
  }
  responder(confirmado: boolean): void {
    const accion = this.accion;
    this.accion = undefined;
    this.estado.set(null);
    if (confirmado) accion?.();
  }
}
