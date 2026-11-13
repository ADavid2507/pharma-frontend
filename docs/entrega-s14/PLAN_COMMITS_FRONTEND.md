# Plan de commits S14

Caleb David Asmat Briceño | 202510208

Este es un plan: los comandos NO se han ejecutado. Trabajar en `feature/integracion-estabilizacion-asmat`. Ejecutar cada bloque desde el repositorio indicado y revisar el contenido preparado antes de confirmar. No usar `git add .` al principio: agruparia todo en un solo commit y los siguientes podrian quedar vacios. La migracion V4 se incorpora completa en el primer commit; no dividirla ni editarla si ya esta aplicada.

## Antes de empezar

```powershell
cd C:\Users\David\Downloads\pharma-frontend
git branch --show-current
git status --short
```

## F1 Paginador compartido

```powershell
git add -- src/app/shared/components/paginador src/app/core/models/consulta-pagina.ts
git diff --cached --stat
git commit -m "feat(shared): agrega paginador reutilizable"
```

## F2 Listados y URL

```powershell
git add -- src/app/features/productos/pages/producto-list src/app/features/ventas/pages/venta-list
git diff --cached --stat
git commit -m "feat(listados): conserva paginacion y filtros (INC-02 INC-03)"
```

## F3 Auditoria e integracion

```powershell
git add -- src/app/features/categorias/models/categoria.model.ts src/app/features/clientes/models/cliente.model.ts src/app/features/productos/models/producto.model.ts src/app/features/ventas/models/venta.model.ts src/app/features/productos/pages/producto-form/producto-form.ts src/app/features/productos/pages/producto-form/producto-form.html src/app/features/ventas/pages/venta-detalle/venta-detalle.html src/app/features/ventas/pages/venta-form/venta-form.html
git diff --cached --stat
git commit -m "feat(integracion): muestra autoria y prepara selectores de venta"
```

## F4 Pruebas de navegador

```powershell
git add -- .gitignore package.json package-lock.json angular.json src/environments/environment.e2e.ts playwright.config.ts e2e
git diff --cached --stat
git commit -m "test(e2e): agrega flujo principal permisos y paginacion"
```

## F5 Evidencias e informe

```powershell
git add -- docs/incidencias.md docs/s14 docs/entrega-s14
git diff --cached --stat
git commit -m "docs(s14): incorpora incidencias evidencias e informe editable"
```

F2 cubre el selector coherente con el rango, la admision del tamanio 5 y el reinicio de pagina al cambiar filtros o tamanio. F3 conserva la confirmacion de venta existente.

Antes de F5, completar los campos pendientes del Word y exportar `docs/entrega-s14/Asmat_LP2_S14_Practica.pdf`. Registrar los hashes reales de B2, F2 y de los cambios que correspondan en incidencias y en el Word. Si F5 ya se creo, registrar las incorporaciones finales en un commit adicional. No inventar hashes ni intentar que un commit contenga su propio hash.

## Comprobar y publicar

```powershell
npm run build
npm test -- --watch=false
npm run e2e:estable
git diff --check
git status --short
git log --oneline origin/develop..HEAD
git push -u origin feature/integracion-estabilizacion-asmat
```

La suite de Oracle registra tres ventas y descuenta seis unidades al repetir tres veces el caso de venta. Solo ejecutarla con autorizacion y datos de desarrollo. No repetirla innecesariamente para capturar una pantalla: abrir el reporte guardado. Consultar GUIA_EVIDENCIAS.md para las variables y los pasos.

Crear PR en https://github.com/ADavid2507/pharma-frontend con base `develop` y compare `feature/integracion-estabilizacion-asmat`. Titulo sugerido: `S14 Paginacion integracion y pruebas E2E de PharmaSoft`. Describir el paginador compartido, los listados con URL y los siete casos E2E. Enlazar la PR del backend y distinguir H2 de Oracle/Redis.

No publicar node_modules/, dist/, .tmp/, tokens, claves personales ni un HAR sin revisar. Los reportes seleccionados dentro de docs/entrega-s14 son evidencias; los temporales playwright-report/ y test-results/ siguen ignorados.

## Lista final

- PR de cada repositorio hacia develop y al menos tres commits en cada uno. Este plan propone cuatro backend y cinco frontend.
- Codigo y carpeta e2e/ publicados.
- docs/incidencias.md con causa, correccion, hash real y estado.
- Asmat_LP2_S14_Practica.pdf con tabla de evidencias, matriz I-01 a I-08 e informe de Playwright.
- Word editable como respaldo. No sustituye el PDF solicitado.
