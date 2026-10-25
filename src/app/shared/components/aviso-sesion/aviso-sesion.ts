import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../../../core/auth/auth-service';

@Component({
  selector: 'app-aviso-sesion',
  templateUrl: './aviso-sesion.html',
  styleUrl: './aviso-sesion.css',
})
export class AvisoSesion {
  protected readonly auth = inject(AuthService);
  protected readonly tiempoRestante = computed(() => {
    const segundos = this.auth.segundosRestantes();
    const minutos = Math.floor(segundos / 60);
    return `${String(minutos).padStart(2, '0')}:${String(segundos % 60).padStart(2, '0')}`;
  });
}
