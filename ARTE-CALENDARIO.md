# Arte del calendario y de las fichas

Actualizado el 31/10/2026. Las notas antiguas sobre iconos por día o recortes
de media imagen quedan sustituidas por esta implementación.

## Calendario

Cada mes tiene una composición de fieltro propia en `calendar-month-01.webp`
a `calendar-month-12.webp`. Se generaron con imagegen, usando el logo original
como referencia de materiales, textura y ambiente. Se optimizaron a 512 px,
manteniendo transparencia. No hay llamadas de generación desde la aplicación.

| Mes / recurso | Composición |
|---|---|
| Enero / 01 | Montaña y nieve, muñeco, abetos, estrellas y coronas de Reyes. |
| Febrero / 02 | Deshielo, muñeco, agua y primeros brotes. |
| Marzo / 03 | Césped nuevo, árboles verdes, flores tempranas y arroyo. |
| Abril / 04 | Conejo, huevos de Pascua, flores, césped y árboles. |
| Mayo / 05 | Vegetación más abundante, flores, arroyo y mariposa. |
| Junio / 06 | Río, poza, árboles de sombra y primer sol de verano. |
| Julio / 07 | Poza mayor, río, flotador, sol y calor. |
| Agosto / 08 | Río y poza, tonos dorados, sol y vegetación más seca. |
| Septiembre / 09 | Transición de verde a dorado, arroyo y primeras hojas. |
| Octubre / 10 | Árboles otoñales, hojas que caen, camino y setas. |
| Noviembre / 11 | Ramas más desnudas, hojas, primeras heladas y monte nevado. |
| Diciembre / 12 | Nieve, muñeco, Papá Noel, tres Reyes, estrellas y paisaje navideño. |

`calendarArt` en app.js calcula el mes de Pascua para el año visible. Si cae
en marzo, intercambia las composiciones 03 y 04; no depende del año actual.
Son imágenes ambientales del mes, no marcadores de festivos ni pronóstico.

Una sola capa `.month-scene` cubre la rejilla completa, con encuadre adaptable
sin distorsionar la imagen. No hay decoración dentro de cada casilla. La capa
queda detrás de números, líneas y planes; es aria-hidden y no captura toques.
Opacidad: otoño 30 %, verano 32 %, primavera 35 %, invierno 43 %.

La lectura se refuerza con números oscuros en negrita sobre círculos claros,
líneas más contrastadas y planes con texto seminegrita y borde por zona.
Las tramas personales son suaves para no competir con el texto. El día actual
conserva fondo oscuro y número blanco. Estos ajustes no atenúan las escenas.

## Personajes y portadas

- El logo original `logo-espe-miguel.jpg` sigue en la cabecera y en las tarjetas
  de las visitas de la pareja. Se reconocen por trip o sus títulos históricos.
- `portrait-miguel-v3.jpg` y `portrait-espe-v3.jpg`: imágenes cuadradas de cada
  personaje, con fondo recompuesto y sujeto centrado, para tarjetas compactas.
- `cover-miguel-v3.jpg`, `cover-espe-v3.jpg`, `cover-visits-v3.jpg`: portadas
  horizontales con fondo de fieltro extendido, figuras completas y proporción 2:1.
  Todas ocupan el mismo ancho en el editor, sin franjas laterales añadidas.
- Son imágenes por defecto derivadas al mostrar la ficha; no se escriben en
  los registros ni sustituyen las fotos elegidas manualmente. Se conserva quitar imagen.

Las 17 imágenes nuevas pesan unos 1,5 MB en total. Están en la lista explícita
del servidor, COPY de Docker y caché PWA. El servidor calcula la versión de caché
incluyendo sus bytes: reiniciarlo tras cambiar los recursos.

## Verificación

`node --test tests/*.test.cjs`: 89 pruebas unitarias y HTTP.

En Edge con contextos y datos sintéticos aislados:

- `tests/browser-agenda-month.cjs`: los 12 fondos, Pascua en marzo/abril,
  interacción con días, filtros, orden de lista y espacios a varios anchos.
- `tests/browser-icons-portraits.cjs`: visitas con ambos personajes, retratos,
  anchura común, cambio de propietario y conservación de fotos manuales.
- `tests/browser-ui-compact.cjs`: edición, fotos y controles existentes.
- `tests/browser-pwa.cjs`: caché de todos los fondos y retratos, imagen del
  calendario y colección disponibles sin red.

No se modificaron datos reales ni migraciones para estas comprobaciones.
