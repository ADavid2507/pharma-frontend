export interface ClienteRequest {
  dni: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string | null;
  direccion: string | null;
  estado: boolean;
}
export interface Cliente extends ClienteRequest {
  creadoPor?: string | null;
  modificadoPor?: string | null;
  id: number;
  fechaCreacion: string;
  fechaModificacion: string | null;
}
