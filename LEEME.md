> Revisión posterior: el extractor actual es la versión 15. Consulta [REVISION-V15.md](REVISION-V15.md) para los cinco enlaces corregidos, las 28 pruebas nuevas y los límites comprobados. Las notas de versiones anteriores se conservan como historial.

# Planes Espe & Miguel

App local adaptada al móvil, compartida y sin perfiles de usuario.

## Abrir

Ejecuta ABRIR-EN-MOVIL.cmd. En el ordenador abre http://localhost:4173; en los móviles, la dirección que indique el lanzador, en la misma Wi-Fi privada. Mantén el ordenador y el servidor encendidos. Ctrl+C detiene el servidor. El lanzador usa Node de Codex en este ordenador o Node en PATH en otro equipo.

## Uso

Inicio solo tiene un campo para pegar un enlace y Enviar. Los enlaces se clasifican en Agenda, Restaurantes o Casa. La agenda ofrece Calendario y Lista. Debajo del calendario siempre se muestran todos los planes de los filtros actuales, ordenados por fecha y hora, aunque correspondan a otro mes. Los planes sin fecha quedan al final. Las visitas de Espe y Miguel pueden abarcar varios días.

Las fichas se abren en un pop-up. Los campos y las etiquetas se editan dentro de la misma ficha y Guardar confirma los cambios. Guardar y la papelera están al final, sin flotar ni superponerse. El borrado pide confirmación. Documentos permite adjuntar, descargar o quitar archivos sin secciones adicionales de enlaces. Los enlaces adicionales anteriores se conservan en las copias aunque ya no se muestran como campos.

La interfaz usa azul y beige. Barcelona/Cataluña usa salvia, Valencia/Comunitat Valenciana usa naranja dorado y los planes sin zona usan malva. El filtro activo es sólido; los demás son neutros.

## Lectura de enlaces

El servidor lee contenido principal, títulos, listas, bloques de texto, direcciones, códigos postales y JSON-LD. Examina bloques cortos y texto situado al final del artículo, ignora menús y pies de página, y puede contrastar hasta dos páginas de contacto del mismo sitio cuando falta la ubicación. Una dirección parcial no impide buscar la ciudad en el resto del contenido. Se distingue el nombre de una calle (por ejemplo Carrer de València) de la localidad Barcelona.

Cuando un dato se publica de forma explícita, se intenta rellenar dirección, fechas, hora, precio, cocina, entrega y medidas. No se utiliza la fecha de publicación de una noticia como fecha del evento. Las páginas privadas, bloqueadas o cuyo contenido solo se carga con JavaScript pueden requerir revisión. La detección no es infalible.

## Conectar IA real

La integración está implementada, pero necesita una clave de API para funcionar. Sin ella se usa extracción de texto y reglas; la app no lo presenta como un resumen redactado por IA.

1. Ejecuta CONFIGURAR-IA.cmd.
2. Introduce la clave en el indicador local protegido; no la pegues en el chat. Se guarda en .env, con acceso de archivo para tu usuario.
3. Cierra y vuelve a abrir el servidor.

El modelo predeterminado es gpt-4o-mini y se puede cambiar con OPENAI_MODEL en .env. La API tiene facturación por uso. El navegador no recibe la clave. Solo se envía a OpenAI el contenido de la página que se está analizando; no se envían vuestros documentos ni las otras ideas. La respuesta estructurada rellena los datos y redacta un resumen original breve con instrucciones para no inventar fechas, precios ni direcciones. El uso de respuestas con esquema sigue la [documentación oficial de OpenAI](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses).

La conexión se ha comprobado con respuestas simuladas, no con una llamada real porque no hay clave configurada. Se ha probado el lector con un artículo real de Time Out y con direcciones de Barcelona en bloques cortos y situadas después de muchos párrafos.

## Guardado y copias

Ideas en localStorage y documentos en IndexedDB del mismo navegador y dirección. No hay sincronización entre móviles todavía. Exporta/importa copias desde el engranaje. Las copias versión 2 incluyen archivos; se siguen aceptando copias antiguas versión 1. Importar puede actualizar las mismas ideas tras confirmación. Los datos anteriores se conservan.

Borrar los datos del navegador elimina ideas y documentos. Usa copias antes de cambiar de navegador, dirección o dispositivo. Los archivos admiten hasta 10 MB cada uno, 50 MB por ficha y 60 MB en total.

## Caducidad de los planes

Los planes con fecha se eliminan automáticamente al pasar su último día, según la zona horaria Europe/Madrid. Los planes de hoy se conservan todo el día. En las visitas de varios días se usa la fecha final; sin fecha final se usa la inicial. Los planes sin fecha se conservan. Restaurantes y compras no caducan por esta regla.

La comprobación se realiza al abrir o volver a la app y cada minuto mientras esté abierta. Guardar o importar planes ya pasados también los elimina. El borrado quita los datos y los documentos asociados que no use otra ficha; las copias ya exportadas no cambian. No se trata de un archivo oculto: la eliminación es real.

## Investigación y fichas compactas

Al guardar un enlace, la app lee la página principal y puede consultar hasta tres páginas relacionadas de primer o segundo nivel: ficha de actividad, sinopsis, web oficial o información práctica. Esta investigación se realiza aunque ya se conozca la ciudad. Solo se leen páginas públicas; no se ejecutan compras ni reservas. El número de páginas y el tiempo de lectura están limitados, por lo que no se garantiza acceso a todos los datos de todas las webs.

Los títulos automáticos usan el nombre esencial de la actividad. El título contiene solo el nombre de la obra, película o exposición; el tipo de actividad aparece en la descripción y el recinto queda en sus propios datos. La sinopsis se prioriza sobre subtítulos publicitarios, historia del recinto o datos logísticos. Con IA conectada se pide un resumen original de la premisa o experiencia en una o dos frases. Sin conexión de IA se usan datos estructurados, sinopsis publicadas y extracción de texto; no se presenta ese resultado como redacción con IA.

Los enlaces a obras distintas no se mezclan para crear una única fecha o dirección. Las fichas antiguas se vuelven a analizar al abrirlas; se respetan los títulos modificados manualmente y los campos editados durante la lectura.

Las visitas Espe en Barcelona y Miguel en Valencia muestran la imagen original del logo, tanto en lista como en ficha. Las tarjetas tienen miniatura lateral, encabezado de 13 px en móvil y un máximo de dos líneas; el contenido completo queda en el pop-up.

## Datos prácticos completos y papelera en las tarjetas

Las tarjetas de todas las listas incluyen una papelera pequeña independiente del botón de abrir la ficha, con la misma confirmación de borrado.

Se leen eventos anidados en Review.itemReviewed y se conservan las fechas de inicio y final, las direcciones completas y los rangos de precio y horario. Precio admite un importe, un rango o Desde, y Horario admite texto por días y varios intervalos. Cuando la web publica funciones individuales, se guardan sus fechas y horas, se muestran en el calendario solo esos días y se pueden consultar en Ver las funciones dentro de la ficha.

Probado con el enlace real https://www.timeout.es/barcelona/es/teatro/el-cadell: del 23 de octubre al 1 de noviembre de 2026, Pl. de les Arts, 1, 08013 Barcelona, 14–28 €, y funciones a las 19:00 o las 18:00 según el día. Los datos se obtienen de la web; no son una regla específica para esa URL.

Al abrir una ficha antigua se reparan los datos automáticos incompletos. Las ediciones manuales quedan identificadas para no sobrescribirlas en posteriores lecturas. Las copias incluyen rangos y funciones individuales. El borrado por caducidad se calcula al terminar el último día del plan, no tras la primera función.

## Crear desde el calendario y ocultar fichas

Pulsa un día del calendario para elegir Miguel en Valencia, Espe en Barcelona u Otro plan. La ficha se abre con ese día seleccionado; las visitas permiten ampliar la fecha final. Pulsar un plan ya existente abre su ficha.

El ojo junto a la papelera oculta o vuelve a mostrar una ficha. Las fichas ocultas permanecen atenuadas en las listas, pero sus planes no aparecen en el calendario. Esta preferencia se guarda en el navegador y en las copias exportadas. Ocultar no altera las fechas ni la eliminación automática de los planes ya pasados.

## Presentación principal y modalidades de entrada

La lectura da prioridad a las secciones Presentación, Descripción y Sinopsis, y separa los programas relacionados y las actividades pasadas de la actividad principal. Reconoce periodos sin la palabra «del», encabezados cortos como Precios, horarios por días y cierres, y precios con etiquetas distintas como en línea o taquilla. En webs de recintos culturales se puede completar su dirección desde su propio pie de página, contrastando la identidad del sitio.

Verificado con la página real del CCCB: El culto a la belleza, 21 mayo–8 noviembre de 2026, martes a domingo y festivos de 10:00 a 20:00, lunes no festivos cerrado, 8 € en línea / 10 € taquilla, CCCB, Montalegre, 5, 08001 Barcelona. La descripción recoge el tema de la exposición, no el taller relacionado. Las fichas guardadas con el extractor anterior se vuelven a analizar al abrirlas; pulsa Guardar para conservar la revisión, respetando los campos que ya editaste manualmente.

Los iconos de las tarjetas están separados verticalmente: ocultar arriba a la derecha y borrar abajo a la derecha.

## Sesiones, periodos abreviados y visitas con varias obras

El extractor conserva la cabecera del evento, aunque el horario esté en un article separado. Lee fechas numéricas con año completo o abreviado (01/10 — 25/10/26 y 11.10.2026 – 01.11.2026), sesiones junto a botones de entradas y horarios en español o catalán. Las reglas semanales se convierten en sesiones concretas; varias funciones por día y excepciones fechadas se conservan. Los periodos con festivos no se expanden sin un calendario de festivos contrastado. La ficha mantiene siempre el texto completo de las reglas de horario.

Los bloques de otras películas y actividades no aportan sesiones a la ficha principal. El nombre de quien dirige una película no se usa como dirección postal. Si un teatro tiene varias sedes, se contrasta la sala indicada antes de elegir su dirección. Cuando existe una versión oficial en castellano para el mismo espectáculo se puede consultar su sinopsis.

Las visitas con varios artistas incluyen el título y una idea breve de cada obra. Sin conexión de IA, se usa una selección y condensación de frases publicadas, identificada como extracción. Con IA conectada se facilita también esa evidencia para redactar la síntesis. No se inventan sesiones, precios ni horarios que no se hayan publicado.

Verificado con Blue Heron (tres sesiones publicadas: 23/10/2026 21:30, 24/10/2026 20:15 y 28/10/2026 21:30), Bouvetøya (1–25/10/2026, horarios de miércoles a domingo y excepción del 3/10) y las visitas guiadas de La Virreina (11/10–1/11/2026, sábados y domingos a las 12:00, Vuit de Frederic Amat y Declaración de amor a Lenin de Juana Dolores Romero Casanova).

## Lectura contrastada de sesiones y datos prácticos

La versión 12 distingue tablas de funciones visibles, grupos de eventos JSON-LD y JSON de aplicaciones insertado en la página. Los datos visibles de cada función prevalecen sobre metadatos contradictorios; no se usa la primera función como periodo completo. Se mantienen las fechas individuales, la hora, la indicación digital y las restricciones de acceso. Esas indicaciones se guardan en la copia de seguridad y se muestran en el listado de funciones.

Las secciones Información práctica, Fecha y horario y Precios se leen por separado. Se reconocen fechas textuales en español, catalán e inglés, periodos entre años, horas con inicio y final y gratuidad con inscripción. Las condiciones verificadas no se pierden al contrastar el resultado con IA. Las fechas de publicación y los estrenos históricos no se usan como fechas de la actividad.

Las sinopsis descartan citas breves y dan prioridad a la trama, protagonistas y experiencia sobre repartos y datos de producción. Las descripciones extraídas siguen identificándose como extracción; solo se marca IA cuando el proveedor configurado devuelve un resultado válido.

Verificado con La bohème del Liceu: 16 funciones del 30/12/2026 al 31/01/2027; el 31/01 es una sesión digital y el 03/01 tiene restricción de edad. El 30/12 figura a las 19:30 en la tabla visible, aunque un metadato publica 18:30. El seminario de Paco Gómez y Laura C. Vela publica actualmente el 29/10/2026 de 10:00 a 12:30 y gratuidad con inscripción previa; se conserva esa fecha publicada, no el día 9 mencionado en el mensaje.

Pruebas adicionales cubren eventos múltiples en JSON-LD, JSON de aplicaciones con sesiones anidadas, datos laterales de otra obra, fechas inválidas, sesiones individuales frente a horarios de apertura, condiciones de entrada, y persistencia de las indicaciones de cada sesión. Las webs que no publican los datos o impiden leerlos pueden seguir dejando campos sin completar; no se inventan datos para rellenarlos.


## Lector ampliado (versión 13)

Se consultan hasta seis páginas relevantes: página principal, sinopsis, información práctica, recinto y entradas. Cuando faltan datos y hay JavaScript o microdatos, se abre un navegador aislado para leer el contenido cargado por la web, incluidas respuestas de sus API. También puede usarlo en dos páginas enlazadas. No pulsa botones de compra ni envía formularios.

Formatos: HTML/XHTML, JSON y JSON-LD, calendarios ICS con sesiones explícitas, texto y PDF con capa de texto (hasta 60 páginas). Reconoce compresión HTTP y codificaciones de caracteres distintas de UTF-8. Conserva al preparar la lectura para IA tanto las secciones prácticas como el final de las páginas largas. Comprueba fechas imposibles y señala información no verificada; las lecturas incompletas se almacenan en caché solo 20 segundos para permitir reintentos.

El navegador usa Playwright y Edge (o el navegador instalado por Playwright). Puede configurarse PLANES_BROWSER_PATH. El PDF usa pdfjs-dist. Se resuelven desde node_modules o el runtime de Node utilizado por el lanzador local; están disponibles en este equipo. Todas las peticiones del navegador pasan por el mismo lector de red pública, sin perfil personal, cookies previas ni acceso a redes privadas.

No se garantiza lectura universal: un muro de acceso, un CAPTCHA, texto solo en imágenes, PDF escaneado, información no publicada, una interacción compleja o reglas ICS de repetición no interpretadas pueden dejar datos pendientes. Las reglas ICS no resueltas no generan un periodo falso que borre el plan al pasar la primera sesión. Los horarios UTC de calendarios se muestran en Europe/Madrid; otros calendarios conservan su hora local.

La redacción con IA sigue requiriendo OPENAI_API_KEY en el servidor. Sin esa configuración se usa extracción y condensación de texto, y se indica en la ficha; no se presenta como un resumen generado con IA. Las fichas de versiones anteriores se reanalizan al abrirlas, respetando los campos modificados manualmente. Guarda la ficha para conservar la revisión.


## Revisión cultural, versión 14

Consulta REVISION-EXTRACCION.md para el alcance contrastado, los errores corregidos y los casos aún pendientes. Las fichas guardan ahora las fuentes y el resultado de la revisión automática. No se confunde la consistencia de un dato con una garantía de exactitud de cualquier web.
