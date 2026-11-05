import { AuthService } from '../../core/auth/auth-service';
import { MasVendidos } from './mas-vendidos';
import { SiPermiso } from '../../shared/directives/si-permiso';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, SiPermiso, MasVendidos],
  templateUrl: './inicio.html',
})
export class Inicio {
  protected readonly auth = inject(AuthService);
}
