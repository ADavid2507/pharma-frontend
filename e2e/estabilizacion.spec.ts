import { expect } from '@playwright/test';
import { randomInt, randomUUID } from 'node:crypto';
import { test, iniciarSesion, USUARIOS } from './apoyo';

async function prepararLinea(page: import('@playwright/test').Page) {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(process.env['E2E_CLIENTE'] ?? 'Mamani');
  await page.getByTestId('opcion-cliente').first().click();
  await page.getByTestId('buscar-producto').fill(process.env['E2E_PRODUCTO'] ?? 'Paracetamol');
  const opcion = page.getByTestId('opcion-producto').first();
  await expect(opcion).toBeVisible();
  const stock = Number(await opcion.getAttribute('data-stock'));
  const nombre = await opcion.locator('strong').innerText();
  await opcion.click();
  return { stock, nombre };
}

test('E2E-08 stock excedido bloquea la revision y el API rechaza con 409', async ({ page }) => {
  const { stock, nombre } = await prepararLinea(page);
  await page.getByTestId('cantidad').fill(String(stock + 1));
  await page.getByRole('button', { name: 'Revisar venta', exact: true }).click();
  await expect(page.getByText(/Supera el stock/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar venta', exact: true })).toHaveCount(0);
  const sesion = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('pharmasoft.sesion')!),
  );
  const api =
    process.env['E2E_AISLADO'] === '1'
      ? 'http://localhost:18080/api/v1'
      : 'http://localhost:8080/api/v1';
  const headers = { Authorization: `Bearer ${sesion.token}` };
  const catalogo = await page.request.get(`${api}/productos?pagina=0&tamanio=100`, { headers });
  const producto = (await catalogo.json()).contenido.find(
    (p: { nombre: string }) => p.nombre === nombre,
  );
  expect(producto).toBeTruthy();
  const cliente = await page.request.get(`${api}/clientes?pagina=0&tamanio=100`, { headers });
  const clienteId = (await cliente.json()).contenido.find((c: { estado: boolean }) => c.estado).id;
  const antes = await page.request.get(`${api}/ventas/buscar?pagina=0&tamanio=1`, { headers });
  const totalAntes = (await antes.json()).totalElementos;
  const fallo = await page.request.post(`${api}/ventas`, {
    headers,
    data: { clienteId, detalles: [{ productoId: producto.id, cantidad: stock + 1 }] },
  });
  expect(fallo.status()).toBe(409);
  expect(await fallo.text()).toContain('Stock insuficiente');
  const despues = await page.request.get(`${api}/ventas/buscar?pagina=0&tamanio=1`, { headers });
  expect((await despues.json()).totalElementos).toBe(totalAntes);
});

test('E2E-09 no permite confirmar una venta sin productos', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/ventas/nueva');
  await expect(page.getByTestId('buscar-cliente')).toBeVisible();
  let posts = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/ventas')) posts++;
  });
  await page.getByRole('button', { name: 'Revisar venta', exact: true }).click();
  await expect(page.getByText('Agregue al menos un producto.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirmar venta', exact: true })).toHaveCount(0);
  expect(posts).toBe(0);
});

test('E2E-10 un cliente nuevo aparece inmediatamente en Nueva venta', async ({ page }) => {
  await iniciarSesion(page, 'admin', '/clientes/nuevo');
  const dni = String(randomInt(60000000, 89999999));
  const apellido = 'E2E' + randomUUID().replaceAll('-', '').slice(0, 10);
  await page.getByLabel('DNI', { exact: true }).fill(dni);
  await page.getByLabel('Nombres', { exact: true }).fill('Cliente Prueba');
  await page.getByLabel('Apellidos', { exact: true }).fill(apellido);
  await page
    .getByLabel('Correo electrónico', { exact: true })
    .fill(`${apellido.toLowerCase()}@example.invalid`);
  const guardado = page.waitForResponse(
    (r) => r.request().method() === 'POST' && r.url().endsWith('/clientes'),
  );
  await page.getByRole('button', { name: 'Registrar', exact: true }).click();
  expect((await guardado).status()).toBe(201);
  await page.goto('/ventas/nueva');
  await page.getByTestId('buscar-cliente').fill(dni);
  await expect(page.getByTestId('opcion-cliente').filter({ hasText: apellido })).toBeVisible();
});

test('E2E-11 fechas de Ventas reinician la pagina y sobreviven a F5', async ({ page }) => {
  await iniciarSesion(page, 'admin', '/ventas?pagina=2&tamanio=20');
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 3 de/);
  await page.getByLabel('Desde', { exact: true }).fill('2000-01-01');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page).toHaveURL(/pagina=0/);
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 1 de/);
  await page.reload();
  await expect(page.getByLabel('Desde', { exact: true })).toHaveValue('2000-01-01');
  await expect(page.getByTestId('pagina-actual')).toHaveText(/Página 1 de/);
});

test('E2E-12 admin consulta la bitacora con filtros en URL', async ({ page }) => {
  await iniciarSesion(
    page,
    'admin',
    '/auditoria?accion=LOGIN_EXITOSO&usuario=' + encodeURIComponent(USUARIOS.admin.usuario),
  );
  await expect(page.getByTestId('tabla-auditoria')).toBeVisible();
  await expect(page.getByTestId('tabla-auditoria').locator('tbody tr').first()).toContainText(
    'LOGIN_EXITOSO',
  );
  await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue(USUARIOS.admin.usuario);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Acción', exact: true })).toHaveValue('LOGIN_EXITOSO');
  await expect(page.getByTestId('tabla-auditoria').locator('tbody tr').first()).toContainText(
    USUARIOS.admin.usuario,
  );
});

test('E2E-13 vendedor no ve Auditoria y su URL esta protegida', async ({ page }) => {
  await iniciarSesion(page, 'vendedor');
  await expect(page.getByRole('link', { name: 'Auditoría', exact: true })).toHaveCount(0);
  await page.goto('/auditoria');
  await expect(page.getByRole('heading', { name: /Acceso denegado/ })).toBeVisible();
});

test('E2E-14 token alterado vuelve al login con aviso de sesion expirada', async ({ page }) => {
  await iniciarSesion(page, 'vendedor', '/productos');
  await expect(page.getByTestId('tabla-productos')).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(sessionStorage.getItem('pharmasoft.sesion')!);
    s.token = 'token-alterado-para-prueba';
    sessionStorage.setItem('pharmasoft.sesion', JSON.stringify(s));
  });
  await page.reload();
  await expect(page).toHaveURL(/\/login\?.*expirada=1/);
  await expect(page.getByText('Su sesión expiró. Inicie sesión nuevamente.')).toBeVisible();
});

