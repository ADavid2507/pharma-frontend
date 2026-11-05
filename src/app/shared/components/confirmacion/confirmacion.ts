import { Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConfirmacionService } from './confirmacion-service';
@Component({
  selector: 'app-confirmacion',
  templateUrl: './confirmacion.html',
  styleUrl: './confirmacion.css',
})
export class Confirmacion {
  protected readonly confirmacion = inject(ConfirmacionService);
  private readonly dialogo = viewChild<ElementRef<HTMLDialogElement>>('dialogo');
  constructor() {
    effect(() => {
      const dialogo = this.dialogo()?.nativeElement;
      if (!dialogo) return;
      if (this.confirmacion.opciones()) {
        if (!dialogo.open) dialogo.showModal();
      } else if (dialogo.open) dialogo.close();
    });
    inject(Router)
      .events.pipe(takeUntilDestroyed())
      .subscribe((evento) => {
        if (evento instanceof NavigationStart) this.confirmacion.responder(false);
      });
  }
  protected responder(confirmado: boolean): void {
    this.dialogo()?.nativeElement.close();
    this.confirmacion.responder(confirmado);
  }
}
