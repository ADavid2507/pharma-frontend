# Sesion 14: pasos 1 a 4

## Estado

1. Ambos proyectos estan en feature/integracion-estabilizacion-asmat.
2. Script preparado en PharmaBackend/docs/sql/volumen_pruebas.sql; NO ejecutado por el asistente. Faltan carga y mediciones reales.
3. Se reutiliza PaginaResponse (mismos campos que Pagina de la guia); ConsultaPagina documenta los parametros. ProductoService ya enviaba los cuatro parametros al servidor. Paginador compartido en shared.
4. Productos y Ventas usan el paginador y guardan pagina/tamanio en URL. Productos conserva orden/dir; Ventas conserva clienteId/estado/desde/hasta. Cambiar filtros aplicados, orden o tamanio vuelve a pagina 0. Se conserva la tabla anterior durante la carga y se cancela la peticion anterior al navegar.

## Carga y mediciones pendientes

La guia remite a V4 antes de cargar datos, pero V4 esta en el paso 5, no en el 4. El script local se adapto al esquema actual: productos.id_categoria y ventas.fecha_registro; omite creado_por mientras no exista auditoria. No modifica migraciones aplicadas.

1. Conectar SQL Developer al esquema de DESARROLLO. Ejecutar primero las consultas de comprobacion del script por separado. Verificar categoria y cliente existentes, tipos y nombres reales. Para ESTADO NUMBER usar 1 en lugar de true.
2. Ejecutar la carga una sola vez, como script (F5). Genera 5000 productos y 20000 ventas sin detalles; estas ventas no sirven para comprobar reportes. No volver a ejecutarlo sobre el mismo conjunto.
3. Invalidar las claves de cache de productos del entorno de pruebas. Si Redis es exclusivo del laboratorio, el comando de la guia es `docker exec pharma-redis redis-cli FLUSHALL`; borra TODAS las claves de esa instancia.
4. Arrancar backend en dev y frontend. En Postman enviar token Bearer valido y anotar tiempo/bytes/SQL de las consultas siguientes.

| Consulta | Resultado real |
|---|---|
| Conteo de productos / ventas tras carga | Pendiente |
| GET /api/v1/productos?pagina=0&tamanio=20 | Pendiente: tiempo, bytes y SQL |
| GET /api/v1/productos?pagina=0&tamanio=100 | Pendiente |
| GET /api/v1/productos?pagina=0&tamanio=500 | Pendiente: se espera 409 |
| GET /api/v1/productos?pagina=ULTIMA&tamanio=20 | Pendiente: tiempo y SQL |
| GET /api/v1/ventas/buscar?desde=2026-11-01&hasta=2026-11-12&pagina=0 | Pendiente |

Calcular ULTIMA como ceil(totalElementos / 20) - 1; 249 solo corresponde exactamente a 5000 productos. El proyecto ya contiene registros anteriores.

## Comprobacion manual

Abrir /productos?pagina=1&tamanio=20&orden=precio&dir=desc, verificar peticion en Red y recargar F5: conserva pagina y orden. Probar Anterior/Siguiente/Primera/Ultima y tamanio. En Ventas aplicar fechas, ir a otra pagina y cambiar filtros: vuelve a pagina 0; F5 conserva los filtros aplicados. Probar enlaces atras/adelante.

El filtro de categoria de Productos sigue aplicandose a la pagina actual y asi lo indica la pantalla; no es busqueda global del catalogo. La consulta de clientes para los filtros conserva el comportamiento anterior.

No se han ejecutado cargas Oracle, limpiado Redis, creado commits ni publicado cambios.
