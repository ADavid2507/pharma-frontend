import { SiPermiso } from '../../shared/directives/si-permiso';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, SiPermiso],
  templateUrl: './inicio.html',
})
export class Inicio {}
