import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { SiPermiso } from './si-permiso';
import { AuthService } from '../../core/auth/auth-service';
@Component({
  imports: [SiPermiso],
  template: `<button *appSiPermiso="'CATALOGO_ESCRIBIR'">Editar</button>`,
})
class Host {}
it('muestra y retira acciones al cambiar permisos', async () => {
  const permitido = signal(false);
  TestBed.configureTestingModule({
    imports: [Host],
    providers: [{ provide: AuthService, useValue: { tienePermiso: () => permitido() } }],
  });
  const f = TestBed.createComponent(Host);
  await f.whenStable();
  expect(f.nativeElement.querySelector('button')).toBeNull();
  permitido.set(true);
  await f.whenStable();
  expect(f.nativeElement.querySelector('button')).not.toBeNull();
  permitido.set(false);
  await f.whenStable();
  expect(f.nativeElement.querySelector('button')).toBeNull();
});
