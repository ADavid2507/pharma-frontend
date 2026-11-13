# Codigo S14: pasos 5 a 10

No es el informe de entrega. Resume como ejecutar el codigo y sus pruebas.

## Backend de desarrollo con Oracle

Reiniciar PharmaBackend con el perfil dev habitual. Flyway aplica V4__auditoria.sql antes de la validacion JPA. No ejecutar V4 manualmente si Flyway ya la aplico. No se editaron V2 ni se inventaron V1/V3, ausentes en este checkout. Si la validacion de Flyway informa una migracion anterior no disponible, recuperar ese archivo original; no desactivar la validacion ni editar su checksum.

La migracion agrega creado_por/modificado_por, la bitacora y los indices de la guia. Las filas anteriores conservan auditoria nula. Los nuevos DTO incluyen estos campos. Los eventos cubren login exitoso/fallido, venta registrada, precio modificado y baja logica del producto. Los eventos de negocio se registran AFTER_COMMIT con REQUIRES_NEW; el login se audita directamente. GET /api/v1/auditoria acepta usuario, accion, desde, hasta, pagina y tamanio; exige USUARIOS_ADMINISTRAR. Hasta incluye el dia completo.

## Pruebas de la guia contra el entorno habitual

Backend en 8080, Redis de desarrollo disponible y frontend en 4200:

```powershell
npm run e2e
npm run e2e:estable
npx playwright show-report
```

Playwright inicia Angular si no esta disponible. Usa Chromium, un worker y cero reintentos. Conserva trazas, capturas y videos de fallos. `e2e:estable` repite cada una de las siete pruebas tres veces.

Las cuentas de ejemplo del curso se pueden cambiar con E2E_ADMIN_USUARIO/E2E_ADMIN_CLAVE, E2E_VENDEDOR_USUARIO/E2E_VENDEDOR_CLAVE y E2E_ALMACEN_USUARIO/E2E_ALMACEN_CLAVE. E2E_CLIENTE y E2E_PRODUCTO configuran los textos a buscar (por defecto Mamani y Paracetamol). La prueba descuenta 2 unidades por ejecucion y comprueba auditoria y reportes. Usar datos de desarrollo con stock suficiente. El producto debe estar visible en la primera pagina de Productos para la comprobacion final del stock, como en el ejemplo de la guia.

## Entorno aislado que no escribe en Oracle

Terminal en PharmaBackend:

```powershell
.\tools\iniciar-e2e.ps1
```

Terminal en pharma-frontend:

```powershell
$env:E2E_AISLADO='1'
npm run e2e:estable
Remove-Item Env:E2E_AISLADO
```

Usa Spring Boot en 18080 y Angular en 14200. El backend carga H2 en memoria, sin Flyway ni Redis, con cuentas de laboratorio y datos sinteticos; el inicializador vive en src/test y rechaza una conexion distinta de H2 en memoria. Al detenerlo se pierden esos datos. Este modo valida la aplicacion real con navegador y persistencia H2, pero no valida la migracion Oracle ni Redis. Las pruebas Java verifican ademas commit/rollback, columnas de auditoria, login fallido, filtros y permisos.

Para instalar el navegador, `npx playwright install chromium --no-shell` basta porque la configuracion selecciona el canal chromium. La instalacion de la guia sin --no-shell tambien funciona.

El formulario conserva las dos etapas existentes: Revisar venta y Confirmar venta; no se elimina la confirmacion ni se cambian los permisos. Los buscadores actuales siguen cargando sus catalogos completos; no se ha agregado un contrato nuevo de busqueda al servidor.

Incidencias tecnicas en docs/incidencias.md. Commits, PR, PDF, capturas y matriz formal de entrega quedan para la siguiente actividad.

## Resultado de verificacion local

12/11/2026: compilacion de produccion Angular y compilacion Java correctas; Angular 114/114; backend 59 aprobadas y 5 pruebas Redis omitidas; Chromium 21/21 con --repeat-each=3 y retries=0 sobre H2. Las pruebas de auditoria incluyen rollback sin evento, login fallido persistido, permisos, filtros, stock y cambio de precio. No se ejecuto V4 en Oracle.
