# Restaurantes de Google Maps — versión 16

Revisión del 27/10/2026. Se añade `maps-reader.cjs` y se amplía el modelo y la ficha de restaurantes. No se modifica el almacenamiento del usuario ni se publican cambios en GitHub.

## Implementación

- Sigue redirecciones de enlaces cortos con el lector público existente. Detecta Maps por host y ruta, no por una coincidencia parcial de dominio.
- Consulta únicamente el enlace `/maps/preview/place` publicado por la página y del mismo origen. Mantiene protección SSRF, TLS y límites de tiempo/tamaño.
- Lee JSON sin evaluar JavaScript. Comprueba que el identificador del establecimiento coincide con el enlace y que la categoría corresponde a restauración. El formato interno de Google no es una API estable; si cambia, falla de forma explícita.
- Recupera título, dirección, zona, categoría, puntuación y número de reseñas, teléfono, web y horario publicado. La descripción usa la descripción editorial cuando existe; en su ausencia es una frase básica de categoría y ubicación, no un resumen generado por IA ni una interpretación de reseñas.
- Solo admite precios generales del establecimiento y fotografías con texto que las identifique como comida. No utiliza el gasto de una reseña como precio del local ni fotografías sin identificar como si fueran platos. Campos ausentes llevan avisos persistentes y se limpian en el reanálisis si no fueron editados manualmente.
- Los nuevos campos aparecen en el detalle; la puntuación también en la tarjeta. Web y teléfono incluyen enlaces discretos. Se conservan al guardar/exportar y se respetan los campos manuales al reanalizar.

## Validación y límite del ejemplo

Lectura real del enlace de Casa Maria aportado por el usuario: se recuperaron nombre, dirección en Barcelona, puntuación y recuento, teléfono, Facebook y horario. **No se recuperaron automáticamente el precio general ni una foto identificada como comida.** Aunque el precio aparece en la captura del usuario, no se ha fijado esa respuesta en código. Tampoco se han guardado datos de reseñadores ni respuestas completas de Maps en el repositorio.

La integración de Maps usa extracción determinista; no llama a IA. No requiere una clave de Google, pero su respuesta pública puede ser incompleta o dejar de estar disponible. No resuelve consentimientos, acceso privado ni CAPTCHA. Una integración con una fuente estable de datos y una clasificación visual de fotografías siguen pendientes si se necesita mayor cobertura. No prometer lectura universal.

Pruebas ejecutadas: `node --test tests/*.test.cjs` (35 pruebas); `node tests/browser-maps.cjs` (captura en viewport móvil, contactos, descripción, puntuación, guardado/recarga y protección de teléfono manual). La prueba móvil usa servidor efímero y navegador nuevos; no lee la colección real. La batería cultural móvil antigua se actualizó a la versión 16, pero no se volvió a ejecutar en esta revisión.

No se reinició el servidor habitual: se rechazó el permiso para consultar el proceso que ocupa 4173. Reiniciar el servidor propio con `node server.cjs` y recargar la app para cargar el código nuevo. Abrir una ficha antigua la reanaliza; pulsar Guardar persiste el resultado.
