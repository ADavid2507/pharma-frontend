# Evidencias del paso 11

Fecha de revisión: 24/09/2026. Las pruebas unitarias usan HTTP simulado. Las capturas en esta carpeta provienen del navegador real con la API apagada. No se inventaron registros ni respuestas de Oracle.

| N.º | Prueba | Estado y evidencia |
|---|---|---|
| 1 | Redirección a Inicio y menú activo | Verificado: evidencias/01-inicio.png |
| 2 | Categorías iguales a Swagger, GET 200 | Pendiente: iniciar API y comparar con Swagger |
| 3 | Búsqueda local sin nuevas peticiones | Verificado en pruebas unitarias; falta captura con datos reales y Red |
| 4 | Nombre An inválido, sin POST | Verificado en navegador: evidencias/04-validacion-categoria.png; falta pestaña Red visible |
| 5 | Nombre repetido, POST 409 | Manejo probado con HTTP simulado; falta API real y captura |
| 6 | Registro válido, POST 201 | Manejo probado con HTTP simulado; falta API real y captura |
| 7 | Edición a inactivo, PUT 200 | Precarga/PUT probados con HTTP simulado; falta escenario real y captura |
| 8 | Eliminar categoría con productos, DELETE 409 | Manejo probado con HTTP simulado; falta registro relacionado y captura |
| 9 | Eliminar categoría sin productos, DELETE 204 | Manejo probado con HTTP simulado; falta API real y captura |
| 10 | Backend apagado | Verificado: evidencias/10-sin-conexion.png |
| 11 | /xyz muestra 404 | Verificado: evidencias/11-pagina-404.png |
| 12 | Menú se oculta y vuelve sin recarga | Verificado: evidencias/12-menu-oculto.png |

## Cómo completar las capturas

1. Iniciar Oracle y PharmaBackend. Verificar GET http://localhost:8080/api/v1/categorias.
2. Abrir http://localhost:4200 y F12 > Red (Network). Filtrar por Fetch/XHR, activar conservar registro cuando haya navegación.
3. Ejecutar cada caso con datos de prueba reconocibles. Capturar pantalla incluyendo aplicación, método, URL y código HTTP cuando corresponda.
4. Para validar búsqueda local y nombre An, limpiar primero la red y comprobar que no aparece una nueva petición.
5. Para DELETE 409 usar una categoría que ya tenga productos. No eliminar datos de uso real para obtener evidencia.
6. Guardar cada imagen con el número de caso e incorporarla al PDF final Apellido_LP2_S7_Practica.pdf.

## Clientes (Reto 02)

Además de la captura `evidencias/clientes-validacion.png`, comprobar alta, listado, búsqueda por DNI/nombre/apellidos, edición, estado y eliminación. Probar DNI repetido, correo inválido y errores de validación devueltos por la API. El teléfono vacío debe viajar como null, no como cadena vacía.

## Versionado pendiente

No hay remoto configurado y solo existe el commit inicial. Faltan el apellido, la URL del repositorio y los commits de entrega. El informe técnico explica las responsabilidades, rutas, menú y adaptación al contrato del backend.
