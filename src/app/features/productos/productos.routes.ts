import { permisoGuardGuard } from '../../core/guards/permiso-guard-guard';
import { Routes } from '@angular/router';
import { ProductoList } from './pages/producto-list/producto-list';
import { ProductoForm } from './pages/producto-form/producto-form';

export const PRODUCTOS_ROUTES: Routes = [
  {
    path: '',
    component: ProductoList,
    title: 'Productos',
  },
  {
    path: 'nuevo',
    canActivate: [permisoGuardGuard],
    data: { permiso: 'CATALOGO_ESCRIBIR' },
    component: ProductoForm,
    title: 'Nuevo Producto',
  },
  {
    path: ':id/editar',
    canActivate: [permisoGuardGuard],
    data: { permiso: 'CATALOGO_ESCRIBIR' },
    component: ProductoForm,
    title: 'Editar Producto',
  },
];
