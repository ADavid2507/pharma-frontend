export interface ConsultaPagina {
  pagina: number;
  tamanio: number;
  ordenarPor: string;
  direccion: 'asc' | 'desc';
}
