import { Permiso } from '../auth/auth.model';
export interface MenuItem {
  etiqueta: string;
  ruta: string;
  icono: string;
  permiso?: Permiso;
}

export const MENU: MenuItem[] = [
  { etiqueta: 'Inicio', ruta: '/inicio', icono: '🏠' },
  { etiqueta: 'Categorías', ruta: '/categorias', permiso: 'CATALOGO_LEER', icono: '🗂️' },
  { etiqueta: 'Clientes', ruta: '/clientes', permiso: 'CLIENTES_LEER', icono: '👥' },
  { etiqueta: 'Productos', ruta: '/productos', permiso: 'CATALOGO_LEER', icono: '💊' },
  { etiqueta: 'Ventas', ruta: '/ventas', permiso: 'VENTAS_LEER', icono: '🧾' },
  {
    etiqueta: 'Reportes',
    ruta: '/reportes/ventas-por-categoria',
    permiso: 'REPORTES_VER',
    icono: '📊',
  },
];
