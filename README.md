# PharmaSoft - práctica LP2, sesión 7

SPA Angular 22 con los retos de Categorías y Clientes. Código organizado en `core`, `shared`, `layout` y `features`.

## Ejecutar

Desde esta carpeta, con Node 24 LTS y npm disponibles:

```powershell
npm install
npm start
```

Abrir **http://localhost:4200**. Iniciar PharmaBackend y Oracle por separado. La API se configura en `src/environments/environment.ts` y `environment.development.ts`: `http://localhost:8080/api/v1`.

Si npm no está en PATH pero las dependencias ya están instaladas:

```powershell
node node_modules/@angular/cli/bin/ng.js serve
```

## Verificar

```powershell
npm run build
npm test -- --watch=false
```

Comandos equivalentes sin npm:

```powershell
node node_modules/@angular/cli/bin/ng.js build
node node_modules/@angular/cli/bin/ng.js test --watch=false
```

Resultado de la revisión del 24/09/2026: compilación correcta; 41 pruebas automatizadas aprobadas. HTTP se simula en las pruebas unitarias; no prueban Oracle ni CORS. Se comprobó en Edge la navegación, menú, 404, validación sin POST y error de conexión. Las capturas están en `output/evidencias`.

## Organización

- `core/config/menu.ts`: menú único para Inicio, Categorías y Clientes.
- `core/models` y `core/utils`: contrato de errores y traducción de respuestas HTTP.
- `layout`: Header emite el evento del menú; MainLayout mantiene su estado y aloja RouterOutlet; Sidebar recorre MENU.
- `shared/pages/no-encontrado`: página 404.
- `features/categorias` y `features/clientes`: modelos, servicio HTTP, listado, formulario y rutas propias.
- `app.config.ts`: registra HttpClient, Router y enlace de parámetros a inputs.
- `app.routes.ts`: MainLayout como padre, inicio y features diferidas, redirección inicial y comodín 404.

Los listados usan signals para datos/carga/error y computed para filtrar sin nuevas peticiones. Los formularios reactivos comparten registro y edición, reciben `id` desde la ruta, validan valores recortados, muestran errores del servidor y evitan envíos duplicados. Un error al precargar impide guardar un formulario incompleto.

## Contrato real del backend local

La guía ilustra `Categoria.id` y nombres de 3 a 50 caracteres. **Tu backend local devuelve `id_categoria` y admite de 3 a 30**. El frontend sigue sus DTO; no se modificó PharmaBackend.

Clientes: DNI de 8 dígitos; nombres/apellidos de 2 a 100; correo obligatorio válido hasta 150; teléfono opcional de 9 dígitos; dirección opcional hasta 250. Los opcionales vacíos se envían como null. Categorías: descripción opcional hasta 200. Ambos tienen estado booleano.

Cada servicio concentra GET colección, GET por ID, POST, PUT por ID y DELETE por ID. Se muestran los mensajes del backend, incluidos 400, 404 y 409, y un mensaje comprensible para status 0.

## Pendientes para entregar

1. Mantener PharmaBackend con Oracle iniciado en el puerto 8080. La conexión de Categorías y Clientes devolvió HTTP 200 y CORS autorizó http://localhost:4200 tras corregir la URL del frontend.
2. Realizar las doce pruebas del paso 11; completar capturas con F12 > Red en las que corresponda. Consultar `output/PLAN_DE_EVIDENCIAS.md`.
3. Completar apellido y datos del estudiante en el informe. El PDF actual contiene evidencias parciales y no sustituye las doce capturas exigidas.
4. Crear la rama solicitada por el docente, registrar al menos cuatro commits y publicar en tu repositorio. No hay remoto Git configurado; no se han creado commits ni publicado cambios.

No es necesario repetir `git init`: el proyecto ya tiene repositorio. Conviene separar commits de configuración/layout, Categorías, Clientes y pruebas/documentación. Agregar explícitamente archivos nuevos antes de cada commit.

## Sesión 11: seguridad frontend (22/10/2026)

Implementada en `feature/seguridad-frontend-asmat`, conservando la rama existente y el backend.

- Login reactivo con validación y mensaje genérico ante credenciales inválidas o cuenta inactiva.
- Sesión en signal y `sessionStorage` (`pharmasoft.sesion`), recuperación al recargar, descarte de datos dañados, temporizador de expiración y aviso un minuto antes.
- Bearer solo para la API configurada, excluyendo el login. Un 401 de la API cierra la sesión; 403 conserva la sesión y llega al componente.
- Guards de sesión y permiso para lectura y escritura; retorno a rutas internas tras el login.
- Menú y acciones por permisos, incluidos Clientes y Reportes. Encabezado con nombre, roles, vencimiento y cierre de sesión.
- `/mi-cuenta`: nombre, usuario, roles, permisos y expiración; nunca muestra el token.

Verificación: compilación de producción correcta y 84 pruebas aprobadas (29 archivos). HTTP y el reloj se simulan en las pruebas de seguridad. También se comprobó la API local con los cinco usuarios de la guía y se probaron los flujos de navegación en el navegador.

Informe: `output/pdf/Asmat_LP2_S11_Practica.pdf`. Capturas: `output/evidencias-s11`. El informe tiene 12 capturas de los casos de la guía y una de Mi cuenta. Faltan las evidencias manuales de los casos 6, 7, 15 y 16; el PDF explica cómo obtenerlas. Completar los datos del estudiante antes de entregar. Los apartados anteriores corresponden a sesiones previas.

Si el entorno de Windows causa ENOENT en el directorio temporal del ejecutor de pruebas:

```powershell
New-Item -ItemType Directory -Force .tmp | Out-Null
$env:TEMP=(Resolve-Path .tmp).Path
$env:TMP=$env:TEMP
node node_modules/@angular/cli/bin/ng.js test --watch=false
```
