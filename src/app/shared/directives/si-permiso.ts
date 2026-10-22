import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/auth/auth-service';
import { Permiso } from '../../core/auth/auth.model';
@Directive({ selector: '[appSiPermiso]' })
export class SiPermiso {
  readonly appSiPermiso = input.required<Permiso>();
  private readonly auth = inject(AuthService);
  private readonly template = inject(TemplateRef);
  private readonly container = inject(ViewContainerRef);
  private visible = false;
  constructor() {
    effect(() => {
      const mostrar = this.auth.tienePermiso(this.appSiPermiso());
      if (mostrar && !this.visible) this.container.createEmbeddedView(this.template);
      if (!mostrar && this.visible) this.container.clear();
      this.visible = mostrar;
    });
  }
}
