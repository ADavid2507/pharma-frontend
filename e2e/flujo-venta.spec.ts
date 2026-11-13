import { expect } from '@playwright/test';
import { test, iniciarSesion, USUARIOS } from './apoyo';
test('flujo principal: registra una venta y el catalogo refleja el stock', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(process.env['E2E_CLIENTE'] ?? 'Mamani');
  await page.getByTestId('opcion-cliente').first().click();
  const nombre = process.env['E2E_PRODUCTO'] ?? 'Paracetamol';
  await page.getByTestId('buscar-producto').fill(nombre);
  const opcion = page.getByTestId('opcion-producto').first();
  await expect(opcion).toBeVisible();
  const stockAntes = Number(await opcion.getAttribute('data-stock'));
  expect(stockAntes).toBeGreaterThanOrEqual(2);
  const nombreCompleto = await opcion.locator('strong').innerText();
  await opcion.click();
  await page.getByTestId('cantidad').last().fill('2');
  await expect(page.getByTestId('total-venta')).not.toHaveText(/S\/\s*0[.,]00/);
  // El proyecto tiene revision y confirmacion separadas: se conserva ese flujo.
  await page.getByRole('button', { name: 'Revisar venta', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Imprimir el comprobante al registrar' }).uncheck();
  const registro = page.waitForResponse(
    (r) => r.url().endsWith('/api/v1/ventas') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Confirmar venta', exact: true }).click();
  const respuestaRegistro = await registro;
  expect(respuestaRegistro.status()).toBe(201);
  const venta = await respuestaRegistro.json();
  const requestId = respuestaRegistro.headers()['x-request-id'];
  await expect(page.getByText('Venta registrada correctamente.', { exact: true })).toBeVisible();
  // Navega mediante el menu de la SPA, sin recargar la aplicacion.
  await page.getByRole('link', { name: 'Productos', exact: true }).click();
  const fila = page
    .getByTestId('tabla-productos')
    .locator('tbody tr')
    .filter({ has: page.getByRole('cell', { name: nombreCompleto, exact: true }) });
  await expect(fila).toHaveCount(1);
  await expect(fila.locator('td').nth(3)).toHaveText(String(stockAntes - 2));
  // La misma venta debe aparecer en auditoria y en el reporte del administrador.
  const api = respuestaRegistro.url().replace(/\/ventas$/, '');
  const loginAdmin = await page.request.post(`${api}/auth/login`, {
    data: { username: USUARIOS.admin.usuario, password: USUARIOS.admin.clave },
  });
  expect(loginAdmin.status()).toBe(200);
  const { token } = await loginAdmin.json();
  const headers = { Authorization: `Bearer ${token}` };
  const auditoria = await page.request.get(`${api}/auditoria?accion=VENTA_REGISTRADA&tamanio=100`, {
    headers,
  });
  expect(auditoria.status()).toBe(200);
  const eventos = (await auditoria.json()).contenido;
  expect(eventos).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        entidadId: venta.id,
        usuario: USUARIOS.vendedor.usuario,
        requestId,
      }),
    ]),
  );
  const reporte = await page.request.get(`${api}/reportes/productos-mas-vendidos`, { headers });
  expect(reporte.status()).toBe(200);
  expect(await reporte.json()).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        productoId: venta.detalles[0].productoId,
        cantidadVendida: expect.any(Number),
      }),
    ]),
  );
});
