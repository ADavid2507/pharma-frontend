import { expect } from '@playwright/test';
import { test, iniciarSesion } from './apoyo';
test('productos se paginan en servidor y F5 conserva la pagina', async ({ page }) => {
  await iniciarSesion(page, 'admin', '/productos');
  const filas = page.getByTestId('tabla-productos').locator('tbody tr');
  await expect(filas).toHaveCount(20);
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 1 de \d+/);
  await expect(page.getByLabel('Filas').locator('option:checked')).toHaveText('20');
  const respuesta = page.waitForResponse(
    (r) =>
      r.url().includes('/api/v1/productos?') && new URL(r.url()).searchParams.get('pagina') === '1',
  );
  await page.getByRole('button', { name: 'Siguiente', exact: true }).click();
  expect((await respuesta).status()).toBe(200);
  await expect(page).toHaveURL(/pagina=1/);
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 2 de/);
  await page.reload();
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 2 de/);
  // Mantiene selector y rango coherentes al cambiar el tamaño.
  await page.getByLabel('Filas').selectOption({ label: '5' });
  await expect(page).toHaveURL(/pagina=0/);
  await expect(filas).toHaveCount(5);
  await expect(page.getByTestId('resumen-paginacion')).toHaveText(/^1–5 de/);
});
