import { expand, map, Observable, reduce, EMPTY } from 'rxjs';
import { PaginaResponse } from '../models/pagina-response';

/** Recorre el catálogo completo para no limitar los buscadores a la primera página. */
export function cargarPaginas<T>(
  listar: (pagina: number) => Observable<PaginaResponse<T>>,
): Observable<T[]> {
  return listar(0).pipe(
    expand((p) => (p.ultima || p.pagina + 1 >= p.totalPaginas ? EMPTY : listar(p.pagina + 1))),
    map((p) => p.contenido),
    reduce((todos, pagina) => todos.concat(pagina), [] as T[]),
  );
}
