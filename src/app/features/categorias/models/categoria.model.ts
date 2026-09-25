export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
  fechaCreacion: string;
  fechaModificacion: string | null;
}

export interface CategoriaRequest {
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}
