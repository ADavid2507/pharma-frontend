import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inicio } from './inicio';
import { signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth-service';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;
  const puedeVerReporte = signal(false);

  beforeEach(async () => {
    puedeVerReporte.set(false);
    await TestBed.configureTestingModule({
      deferBlockBehavior: DeferBlockBehavior.Manual,
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: AuthService,
          useValue: {
            tienePermiso: (permiso: string) => permiso === 'REPORTES_VER' && puedeVerReporte(),
          },
        },
      ],
      imports: [Inicio],
    }).compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('does not create a deferred block or request the report without permission', async () => {
    expect(await fixture.getDeferBlocks()).toHaveLength(0);
    TestBed.inject(HttpTestingController).expectNone(
      `${environment.apiUrl}/reportes/productos-mas-vendidos`,
    );
  });

  it('requests the report only when the permitted deferred block completes', async () => {
    puedeVerReporte.set(true);
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const [block] = await fixture.getDeferBlocks();
    expect(block).toBeDefined();
    const http = TestBed.inject(HttpTestingController);
    http.expectNone(`${environment.apiUrl}/reportes/productos-mas-vendidos`);
    await block.render(DeferBlockState.Loading);
    expect(fixture.nativeElement.textContent).toContain('Cargando reporte');
    await block.render(DeferBlockState.Complete);
    http.expectOne(`${environment.apiUrl}/reportes/productos-mas-vendidos`).flush([]);
  });
});
