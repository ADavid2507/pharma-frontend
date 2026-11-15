# Actividad autónoma S14

La SPA incorpora la consulta de auditoría en `/auditoria`, protegida por `USUARIOS_ADMINISTRAR`, con filtros en URL y el paginador compartido. El backend debe estar actualizado con los eventos `CLIENTE_REGISTRADO` y `CATEGORIA_ELIMINADA`.

La documentación de entrega se concentra en el backend:

- [Índice técnico](https://github.com/ADavid2507/PharmaDB/blob/feature/integracion-estabilizacion-asmat/docs/README.md)
- [Resultados y límites de la revisión](https://github.com/ADavid2507/PharmaDB/blob/feature/integracion-estabilizacion-asmat/docs/resultados-pruebas.md)
- [Registro de seis incidencias](https://github.com/ADavid2507/PharmaDB/blob/feature/integracion-estabilizacion-asmat/docs/incidencias.md)
- [Guion de demostración](https://github.com/ADavid2507/PharmaDB/blob/feature/integracion-estabilizacion-asmat/docs/guion-demostracion.md)
- [Capturas paso a paso](https://github.com/ADavid2507/PharmaDB/blob/feature/integracion-estabilizacion-asmat/docs/guia-capturas.md)

## Comprobación local

```powershell
npm test -- --watch=false
npx tsc -p e2e/tsconfig.json --noEmit
npm run build
```

Para E2E, arrancar primero el laboratorio backend con `tools/iniciar-e2e.ps1` desde PharmaBackend. En esta carpeta:

```powershell
$env:E2E_AISLADO='1'
npm run e2e:estable
```

Son 14 escenarios y tres repeticiones, sin reintentos. El laboratorio utiliza Angular en 14200 y H2 en 18080; no valida Oracle ni Redis. No ejecutar la colección Postman al mismo tiempo, pues ambas suites modifican el stock del laboratorio. Reiniciar el backend H2 restablece los datos ficticios.

La práctica S14 anterior conserva sus documentos y evidencia Oracle en `docs/entrega-s14/evidencias/`. No se sustituyeron por los resultados de la actividad autónoma. El video, las capturas y los registros humanos se completan personalmente antes de exportar el PDF final y publicar la versión elegida.
