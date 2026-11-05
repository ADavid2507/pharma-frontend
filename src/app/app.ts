import { Confirmacion } from './shared/components/confirmacion/confirmacion';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Confirmacion],
  template: '<router-outlet /><app-confirmacion />',
})
export class App {}
