import { expect, Page, test as base } from '@playwright/test';
// Usuarios de laboratorio de la guia; permite configurar otras claves sin guardarlas.
export const USUARIOS = {
  admin: {
    usuario: process.env['E2E_ADMIN_USUARIO'] ?? 'admin',
    clave: process.env['E2E_ADMIN_CLAVE'] ?? 'Admin2026*',
  },
  vendedor: {
    usuario: process.env['E2E_VENDEDOR_USUARIO'] ?? 'vendedor',
    clave: process.env['E2E_VENDEDOR_CLAVE'] ?? 'Vendedor2026*',
  },
  almacen: {
    usuario: process.env['E2E_ALMACEN_USUARIO'] ?? 'almacen',
    clave: process.env['E2E_ALMACEN_CLAVE'] ?? 'Almacen2026*',
  },
} as const;
// Detecta regresiones del flujo, ademas de las aserciones de cada prueba.
export const test = base.extend<{ vigilarErrores: void }>({
  vigilarErrores: [
    async ({ page }, use) => {
      const errores: string[] = [];
      page.on('pageerror', (e) => errores.push(e.message));
      page.on('response', (r) => {
        if (r.status() >= 500) errores.push(`${r.status()} ${r.url()}`);
      });
      await use();
      expect(errores, 'Sin excepciones de navegador ni respuestas 5xx').toEqual([]);
    },
    { auto: true },
  ],
});
export async function iniciarSesion(page: Page, quien: keyof typeof USUARIOS, ruta = '/inicio') {
  const { usuario, clave } = USUARIOS[quien];
  await page.goto(ruta);
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel('Usuario', { exact: true }).fill(usuario);
  await page.getByLabel('Contraseña', { exact: true }).fill(clave);
  await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: true })).toBeVisible();
}
