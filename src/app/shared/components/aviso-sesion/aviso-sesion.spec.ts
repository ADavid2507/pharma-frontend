import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { AvisoSesion } from './aviso-sesion';
import { AuthService } from '../../../core/auth/auth-service';

describe('AvisoSesion', () => {
  it('muestra mm:ss, permite ocultarlo y ofrece cerrar sesión', async () => {
    const segundos = signal(107),
      oculto = signal(false),
      porVencer = signal(true);
    const cerrar = vi.fn();
    TestBed.configureTestingModule({
      imports: [AvisoSesion],
      providers: [
        {
          provide: AuthService,
          useValue: {
            segundosRestantes: segundos,
            porVencer,
            avisoSesionOculto: oculto,
            ocultarAvisoSesion: () => oculto.set(true),
            cerrarSesion: cerrar,
          },
        },
      ],
    });
    const f = TestBed.createComponent(AvisoSesion);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role="status"]').textContent).toContain('01:47');
    segundos.set(9);
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('00:09');
    f.nativeElement.querySelector('button').click();
    expect(cerrar).toHaveBeenCalledOnce();
    f.nativeElement.querySelector('[aria-label="Ocultar aviso de sesión"]').click();
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role="status"]')).toBeNull();
    oculto.set(false);
    porVencer.set(false);
    await f.whenStable();
    expect(f.nativeElement.querySelector('[role="status"]')).toBeNull();
  });
});
