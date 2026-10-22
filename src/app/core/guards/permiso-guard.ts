import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth-service';
import { Permiso } from '../auth/auth.model';

export const permisoGuard: CanActivateFn = route => {
const permiso = route.data['permiso'] as Permiso | undefined;
if (!permiso || inject(AuthService).tienePermiso(permiso)) {
return true;
}
return inject(Router).createUrlTree(['/acceso-denegado']);
};