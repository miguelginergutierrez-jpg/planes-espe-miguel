# Revisión de extracción 15 — 26 de octubre de 2026

Corrección de los cinco enlaces fallidos aportados por el usuario. Se comprobó la descarga pública, la respuesta de `/api/inspect`, el formato de las cinco imágenes y el volcado en la interfaz móvil aislada. No se modificaron los registros del navegador de uso real.

## Resultados observados

| Fuente | Datos recuperados |
|---|---|
| [Atles Fenosa Barcelona](https://guia.barcelona.cat/es/detall/exposicio-atles-fenosa-barcelona_99400789073.html) | Imagen, título y descripción de la exposición. 14/10–08/12/2026. Lunes a sábado 09:00–19:30; domingos/festivos 09:00–14:30. Gratuita. Palau Robert, Passeig de Gràcia 107, Barcelona. |
| [Ciutats en trànsit](https://guia.barcelona.cat/es/detall/exposicio-ciutats-en-transit-repensar-per-regenerar_99400787912.html) | Imagen, descripción y sede. Periodo propio: 15/09/2026–08/01/2027. Mismos horarios generales y gratuidad publicados en su tabla. |
| [Life in Dailyland. Joan Verdú](https://www.consorcimuseus.gva.es/centro-del-carmen/exposicion/life-in-dailyland-joan-verdu/) | 07/10/2026–17/01/2027. Resumen sobre Joan Verdú y su obra, sin confundirlo con la línea de fechas. Imagen, Centre del Carme / Sala Carlos Pérez, dirección, entrada gratuita y horarios del recinto. **Horario marcado para revisión por contradicción entre fuentes.** |
| [Melanie Smith, IVAM](https://ivam.es/exposiciones/melanie-smith-solo-una-cosa-era-extrana-seguir-pensando-como-antes/) | 07/10/2026–10/01/2027. Imagen de contenido, tema de la exposición y clasificación en Valencia. Desde la página de visita: Carrer Guillem de Castro 118, 46003 València; martes–domingo 10–19 h, lunes cerrado y excepciones; entrada general 5 € y gratuidad condicionada. |
| [Moscas, Verdi](https://barcelona.cines-verdi.com/moscas) | Cartel, sinopsis y cine/dirección. 11 sesiones publicadas entre el 26 y el 29/10/2026 durante esta revisión, con horas, idioma y enlaces individuales. Precios de sesiones 5,40–6,50 €. La función del día 26 a las 11:30 ya no aparecía en la fuente por la tarde. |
| [La bola negra, ABC Park](https://park.cinesabc.com/index?pag=ficha&evento=3332) | Ficha de cine sin JSON-LD: el título se toma del bloque `.ficha-titulo`, no del modal genérico «Título ventana»; se recuperan cartel, sinopsis y 15 sesiones de las pestañas de fechas y bloques `.hora-ses`. Se clasifica como Cine en Valencia y se identifica ABC Park. |

Estos resultados son una comprobación en esa fecha, no un calendario fijo ni disponibilidad de entradas garantizada. La aplicación vuelve a leer las fuentes: ninguna respuesta de estas obras está codificada en producción.

## Cambios reutilizables

- Selección del contenido principal y de su título aunque el primer H1 sea la marca del portal. Una exposición en un «aparador» deja de confundirse con un mueble.
- Fechas en listas de definición, párrafos etiquetados y periodos con apóstrofos, abreviaturas y cambio de año. Las actividades paralelas e inauguraciones no recortan el periodo de una exposición.
- Tablas que conservan la relación entre día de la semana, horario y precio.
- Imágenes del cuerpo, carga diferida, `srcset`, `<picture>` y carteles de fondo; exclusión de logos y rutas vacías o inválidas. Solo se usan URLs publicadas, sin fabricar nombres de imágenes.
- Resúmenes basados en párrafos temáticos, evitando fechas, créditos y recomendaciones de otras actividades. Se conservan frases completas cuando es posible.
- Nuevo `cinema-data.js`: resolución de `Movie`, `ScreeningEvent`, `MovieTheater`, `PostalAddress` y `Offer`, incluidas referencias `@id`. Las sesiones se vinculan a su película; la fecha de publicación/estreno no sustituye a la cartelera.
- En portales de cine sin JSON-LD, se leen las fichas delimitadas por clases de contenido, pestañas con `data-fecha` y horas visibles. Los títulos de modales, newsletters y marcas del portal quedan fuera de la ficha.
- Identificación HTTP explícita como lector público. Verdi rechazaba la cabecera anterior con 403; admite la cabecera identificada del lector. Se mantienen DNS público, validación TLS, límites y aislamiento.
- Investigación de la página de visita y de información general del recinto. Horarios de museo separados de biblioteca, cafetería y taquilla. Los enlaces del recinto no se expanden a otras obras de su cartelera.
- Detección de discrepancias entre horarios heredados del mismo recinto. No se sobrescribe una dirección completa de la ficha por una versión más incompleta de otra página.
- Reanálisis de versión 15 al abrir fichas antiguas; reparación de imágenes y clasificaciones automáticas sin modificar campos manuales. Los avisos de discrepancia persisten al guardar.

## Pruebas reproducibles

Desde la raíz, sin dependencias extra ni red para las pruebas de extracción:

```powershell
node --test tests/*.test.cjs
```

Resultado de esta revisión: **29 pruebas correctas**. Cubren fechas y tablas, contenido/imágenes, fichas ABC, películas y sesiones ajenas, datos ausentes/invalidos, información del recinto, conflictos y validación de respuestas de IA. Los fixtures son fragmentos sintéticos; no son copias completas de webs.

Para la integración móvil, iniciar primero `node server.cjs` y, con Playwright y Edge disponibles:

```powershell
node tests/browser-v15.cjs
```

Comprueba captura, campos completos, guardado/recarga, avisos persistentes, corrección de una ficha antigua y conservación de elecciones manuales. Utiliza un contexto de navegador nuevo y respuestas sintéticas. Resultado: correcto, sin errores JavaScript. Además se probaron las cinco URLs mediante la API real y se confirmó que sus imágenes devuelven contenido de imagen.

Las baterías históricas citadas en `REVISION-EXTRACCION.md` siguen sin estar en este clon: no se presentan como reejecutadas en esta revisión.

## Límites que permanecen

La IA continúa sin configurar en el servidor revisado: los resúmenes son condensación del texto publicado, conservando su idioma o usando la traducción oficial cuando se identifica. No se simula redacción con un modelo.

En el Centre del Carme, el pie de la exposición publica 10–20 h, mientras [Información general](https://www.consorcimuseus.gva.es/centro-del-carmen/sede-consorci-museus/) publica 11–21 h. La ficha conserva el horario inicial y muestra una incidencia para confirmar antes de visitar. Los horarios generales pueden incluir excepciones estacionales fuera del periodo de una exposición.

Los datos estructurados pueden contener errores del editor; la revisión detecta patrones y algunas contradicciones, no certifica cada dato publicado. La ausencia de información, páginas bloqueadas, OCR y formatos aún no interpretados siguen requiriendo revisión. No hay garantía universal para cualquier web futura.
