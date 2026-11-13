# Incidencias S14

Registro tecnico del paso 10. Los cambios aun no tienen commits; no se declaran cerrados para entrega.

| ID | Modulo | Descripcion y reproduccion | Severidad | Causa | Correccion | Estado |
|---|---|---|---|---|---|---|
| INC-01 | Productos API | Solicitar tamanio=500 permitia superar el maximo de la guia | Media | Faltaba limite superior en listar | Rechazar tamanios fuera de 1..100; prueba de integracion | Corregida en codigo; commit pendiente |
| INC-02 | Paginador | Mostrar 20 filas mientras el selector indicaba 5 | Media | Opciones dinamicas sin sincronizacion de formularios; ademas URL rechazaba 5 | ngModel/ngValue y normalizacion coherente; prueba E2E verifica selector y rango | Corregida y verificada con Chromium; commit pendiente |
| INC-03 | Productos/Ventas | Recargar F5 perdia pagina y filtros | Media | Estado guardado solo en signals | Navegacion con queryParams y lectura reactiva de URL; pruebas de rutas | Corregida en codigo; commit pendiente |

La suite del paso 9 tiene siete pruebas y se ejecuta sin reintentos. El formulario real conserva dos etapas: Revisar venta y Confirmar venta. La prueba del stock usa navegacion por el menu de la SPA, sin F5.

Verificacion del 12/11/2026: 114 pruebas Angular aprobadas; backend 59 aprobadas y 5 de Redis omitidas; Playwright Chromium 21/21 (7 pruebas x 3, cero reintentos) contra el entorno H2 aislado. La migracion Oracle y el flujo con Redis real quedan pendientes de comprobar en desarrollo.

Verificacion posterior en Oracle y Redis: 21/21 en Chromium, cero reintentos, tres ventas autorizadas (40142, 40143 y 40144), producto 26 con stock 19 a 13. API: Productos 20/100 HTTP 200, tamaño 500 HTTP 409; auditoria admin 200, vendedor 403 y sin token 401. I-08 comprobado en navegador: pagina=4 a pagina=0 al aplicar fechas. Reportes y mediciones en docs/entrega-s14/evidencias/Oracle. Los hashes de Git siguen pendientes.
