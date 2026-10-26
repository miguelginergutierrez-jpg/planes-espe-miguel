# Revisión del lector cultural — 26 de octubre de 2026

La versión 14 amplía la lectura y comprueba los datos antes de devolver la ficha. Esta revisión cubre **15 fichas de ejemplo**: ocho nuevas páginas consultadas directamente y siete casos anteriores conservados como pruebas. No es un inventario exhaustivo de todos los recintos ni una garantía para cualquier página futura.

## Nuevas páginas contrastadas

| Disciplina y ciudad | Fuente | Resultado comprobado | Pendiente |
|---|---|---|---|
| Teatro · Valencia | [IVC: El Narciso en su opinión](https://ivc.gva.es/es/ivc/programacion-ivc/teatro-principal-de-valencia/el-narciso-en-su-opinion-p-c) | 14 funciones publicadas, seis matinales; periodo 14 octubre–6 noviembre; sede trasladada al Teatre Martín i Soler. Se elimina la dirección administrativa incorrecta. | Precio y dirección exacta de la nueva sede. No se inventan funciones semanales. |
| Ópera · Valencia | [Les Arts: Lohengrin](https://www.lesarts.com/es/programacion/c/1286-lohengrin.html) | Cinco funciones: 10, 13, 16, 19 y 22 diciembre; horas por sesión; desde 10 €; dirección del recinto. | El precio publicado es un mínimo, no el rango completo por localidades. |
| Danza · Valencia | [Les Arts: La Leona](https://www.lesarts.com/es/programacion/c/1293-la-leona.html) | 4 diciembre, 19:30; desde 25 €; Teatre Martín i Soler; dirección y clasificación como danza. | Tarifas por localidad no publicadas en la ficha principal. |
| Exposición · Valencia | [IVAM: Melanie Smith](https://ivam.es/es/exposiciones/melanie-smith-solo-una-cosa-era-extrana-seguir-pensando-como-antes/) | 7 octubre 2026–10 enero 2027. Cruce con la página del Centre Julio González para dirección, horario, cierres, entrada general y gratuidad condicionada. | Son las condiciones generales publicadas del museo; deben reconsultarse si cambian. |
| Cine · Valencia | [Babel / ReservaEntradas: Blue Heron](https://www.reservaentradas.com/sesiones/valencia/cinesbabel/blue-heron/2585/) | Ocho sesiones publicadas del 26 al 29 octubre, con hora, VOSE y sala. Dirección y sinopsis de la película. | Precio no verificado; cartelera cambiante. |
| Concierto · Valencia | [Palau: London Philharmonic](https://palauvalencia.com/event?id=2656&mod=1792156966) | 30 octubre, 19:30; Sala Iturbi; dirección del Palau; título y programa musical. | Precio no verificado. |
| Artes escénicas / performance · Barcelona | [Mercat: Light Years Away](https://mercatflors.cat/espectacle/festival-salmon-light-years-away/) | 28 octubre, 20:00–21:10; 12 €; dirección contrastada en Contacte. El título no se toma del nombre de la artista. | El formato del Mercat se ha probado con esta performance; no con toda su programación de danza. |
| Concierto · Barcelona | [Palau de la Música: London Philharmonic & Gardner](https://www.palaumusica.cat/es/london-philharmonic-gardner_1586381) | 26 octubre, 20:00; 30–150 €; dirección. Excluye la charla previa de las 19:00 y el horario de taquillas. | Disponibilidad de entradas no consultada. |

## Casos anteriores que siguen pasando

Teatro: El cadell (Time Out y TNC), Bouvetøya (Teatre Lliure). Cine: Blue Heron (Zumzeig). Exposiciones y actividades: El culto a la belleza y el seminario de Paco Gómez y Laura C. Vela (CCCB); visitas guiadas (La Virreina). Ópera: La bohème (Liceu), incluidas sus 16 sesiones y las restricciones de sesiones concretas.

Estas pruebas utilizan copias guardadas de sus páginas: comprueban que las mejoras no rompen lo que ya funcionaba, pero no acreditan que esas webs mantengan hoy exactamente el mismo contenido.

## Comprobaciones antes del volcado

- Delimitar la ficha principal y excluir menús, recomendaciones y actividades relacionadas.
- Exigir identidad de la obra para completar datos desde otra ficha. Las páginas del recinto solo aportan información pertinente del recinto.
- Conservar funciones con fechas explícitas y horarios por sesión; no extrapolarlas como recurrencia semanal.
- Validar fechas reales, orden del periodo y horas; eliminar duplicados y falsas horas finales iguales a la inicial.
- Conservar «desde», rangos y modalidades de precio. Separar aparcamiento, biblioteca, taquilla y condiciones de gratuidad de la entrada de la actividad.
- Contrastar traslados de sede y direcciones. Si no hay una dirección suficientemente contrastada, dejarla pendiente.
- Cuando se configure IA, impedir que cambie silenciosamente datos concretos ya extraídos y rechazar nuevos datos prácticos sin evidencia suficiente en el contenido leído.
- Guardar fecha de revisión, páginas consultadas e incidencias con la ficha. La revisión automática es una comprobación de consistencia y evidencia, no una certificación humana de cada dato.

## Formatos y límites

Se han probado contenido HTML, tablas y filas de sesiones, fechas en español/catalán, meses abreviados, cambios de año, datos estructurados JSON-LD, estado JSON de aplicaciones, calendarios incrustados, sesiones en JSON literal de taquilla, microdatos, carga con JavaScript, PDF con texto e ICS con sesiones explícitas.

L’Auditori se investigó, pero la descarga directa falló por la cadena de certificados TLS. No se ha desactivado la validación de certificados y no se cuenta como un caso superado. Los portales de compra pueden requerir interacción, sesión o acceso no disponible; un precio pendiente no se convierte en gratuito.

La IA sigue sin configurar en este servidor. Los resúmenes actuales son extracción y condensación del texto, no una redacción semántica universal. Los carteles en imágenes, PDF escaneados, webs bloqueadas o datos no publicados pueden seguir requiriendo revisión.

## Validación realizada

Cinco baterías de pruebas: casos culturales anteriores, nuevas fichas de ambas ciudades, formatos dinámicos/documentales y comprobaciones de conflictos. Prueba de la app en un navegador móvil aislado: captura, revisión de una ficha antigua, guardado de versión 14 y persistencia tras recargar, sin errores JavaScript. Los datos reales del navegador de la pareja no se han usado en las pruebas.

Al abrir fichas antiguas se repite el análisis. Los cambios manuales se respetan; pulsa Guardar para conservar la revisión.
