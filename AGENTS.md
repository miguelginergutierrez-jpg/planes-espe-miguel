# Planes Espe & Miguel — contexto e instrucciones de continuidad

Documento revisado el **26 de octubre de 2026**, contrastando la conversación de desarrollo y los archivos de esta raíz. Sirve de contexto para personas y agentes que continúen el proyecto desde otro equipo. No contiene datos de las fichas, documentos personales ni secretos.

## 1. Objetivo y necesidades

Aplicación para conservar y consultar ideas que de otro modo se pierden en una conversación de WhatsApp: actividades culturales, lugares para visitar, restaurantes y compras para casa. La experiencia debe ser móvil, sencilla, limpia, rápida de alimentar con un enlace y cómoda para consultar muchas fichas.

La intención de producto es que Espe y Miguel compartan la misma información y agenda. **La implementación actual es una web local adaptada al móvil, no una aplicación nativa ni un servicio con datos sincronizados.** Abrirla desde dos dispositivos no crea una base de datos compartida.

Barcelona representa toda Cataluña; Valencia, toda la Comunitat Valenciana. También se admiten planes de otros destinos, sin obligar a asignar una de estas zonas. La agenda permite organizar visitas de varios días mediante «Espe en Barcelona» y «Miguel en Valencia».

## 2. Arquitectura y estructura actual

Los archivos de la aplicación están directamente en la raíz de este repositorio. Las rutas antiguas de la conversación bajo `outputs/lo-nuestro` pertenecen al entorno anterior: no asumir que existen en un clon actual.

No hay framework de interfaz, compilación, base de datos del servidor, manifiesto `package.json`, archivo de bloqueo de dependencias ni configuración de CI en esta revisión.

| Archivo | Responsabilidad |
|---|---|
| `index.html` | Estructura de la página, navegación, diálogo y carga ordenada de scripts. |
| `calm.css` | Interfaz adaptable al móvil, paleta, tarjetas compactas y estados visuales. |
| `app.js` | Estado, vistas, calendario, filtros, editor, captura de enlaces, persistencia, copias y caducidad. |
| `documents.js` | Adjuntos en IndexedDB; añadir, descargar, eliminar y empaquetar/importar copias. |
| `classifier.js` | Clasificación, contenido principal, metadatos, datos prácticos, título y resumen por extracción. Se usa en Node y en el navegador. |
| `event-data.js` | Fechas, periodos, horarios, sesiones, recurrencias, sedes y delimitación de contenido. Módulo compartido. |
| `culture-data.js` | Correcciones de formatos culturales: mínimos de precio, traslados, calendarios incrustados, sesiones de cine y títulos. Módulo compartido. |
| `server.cjs` | Servidor HTTP de Node, archivos estáticos permitidos y API local. |
| `preview.cjs` | Entrada al análisis, deduplicación de peticiones y caché en memoria. |
| `public-reader.cjs` | Descarga pública HTTP/HTTPS, validación de destinos, DNS fijado, redirecciones, compresión y límites. |
| `source-reader.cjs` | Conversión de HTML, JSON, ICS, texto y PDF con texto a contenido analizable. |
| `render-reader.cjs` | Lectura con Playwright en navegador aislado para páginas dinámicas y microdatos. |
| `reader-runtime.cjs` | Resolución de dependencias locales o del runtime de Node. |
| `research.cjs` | Investigación de páginas relacionadas, combinación de evidencia, IA opcional y evaluación final. |
| `venue-data.cjs` | Información del recinto, separando museo, taquillas, biblioteca, aparcamiento y otros servicios. |
| `verification.cjs` | Validaciones de fechas/horas, identidad de actividad, conflictos y evidencia de valores interpretados. |
| `ai-reader.cjs` | Integración opcional con OpenAI Responses y esquema JSON; validación de la respuesta. |
| `ABRIR-EN-MOVIL.cmd` | Lanzador Windows en modo LAN; contiene una ruta de runtime específica del equipo original y una alternativa con Node en PATH. |
| `CONFIGURAR-IA.cmd`, `CONFIGURAR-IA.ps1` | Configuración local de la clave mediante entrada protegida; no forman parte de la interfaz pública. |
| `.env.example` | Nombres de variables y configuración de ejemplo, sin credenciales reales. |
| `logo-espe-miguel.jpg` | Imagen original elegida por el usuario para la marca y las visitas de la pareja. |
| `inicio.png`, `agenda.png`, `ficha.png`, `documentos.png` | Capturas de referencia, no pruebas ejecutables ni garantía del estado visual actual. |
| `LEEME.md` | Guía de uso y notas acumuladas de versiones. |
| `REVISION-EXTRACCION.md` | Cobertura comprobada, ejemplos y limitaciones de la revisión cultural de versión 14. |

### Flujo de un enlace

1. Inicio valida el enlace y evita duplicarlo entre las fichas existentes.
2. El navegador solicita `POST /api/inspect` con JSON `{ "url": "https://..." }` y origen coincidente con el servidor.
3. El servidor descarga y clasifica la página. Puede usar lectura dinámica y consultar páginas enlazadas de sinopsis, entradas, información práctica o recinto.
4. Se combina información de la misma actividad; las páginas del recinto tienen un papel distinto de la ficha de la obra.
5. Si hay IA configurada, se solicita una interpretación estructurada. Después se comprueban coherencia, evidencia y conflictos.
6. La respuesta rellena la ficha, que se conserva en el navegador. Un fallo de lectura no debe presentarse como extracción completa ni provocar invención de datos.

Límites actuales relevantes: hasta seis páginas en la investigación, presupuesto de investigación de 40 segundos, hasta dos lecturas dinámicas de páginas enlazadas, timeout de IA de 35 segundos y timeout de cliente de 85 segundos. La caché dura 15 minutos para resultados sin aviso y 20 segundos para resultados con aviso. No es un rastreador ilimitado.

`GET /api/status` informa de si el proveedor de IA está configurado y del modelo; no devuelve la clave. El servidor escucha en `127.0.0.1:4173`, o en `0.0.0.0:4173` con `--lan`. Los archivos servidos están en una lista explícita: no exponer toda la raíz ni servir `.env`.

### Persistencia y modelo

- Fichas: `localStorage`, clave histórica `lo-nuestro-v1`.
- Documentos: IndexedDB `lo-nuestro-documents`, almacén `files`.
- Tipos internos: `plan`, `restaurant`, `buy`, `inbox` —este último es contenido por revisar—.
- Campos principales: título, enlace, zona, resumen, imagen, estado, notas; en planes, recinto, tipo de actividad, dirección, fechas y horario; en restaurantes, cocina y precio; en compras, categoría, estancia, coste, tienda, plazo y medidas.
- `occurrences` conserva sesiones individuales con fecha, hora, posible hora final, etiqueta, modalidad y enlace. No sustituirlas por un rango continuo que añada días sin función.
- `manualFields`, `titleMode` y `cityMode` protegen elecciones manuales durante el reanálisis.
- `analysisVersion`, `summarySource`, `aiStatus` y `verification` conservan información del análisis. La versión vigente es **14**. La revisión incluye fecha, fuentes e incidencias; no certifica exactitud universal.
- `priority` y `links` sobreviven como compatibilidad de datos antiguos; no reintroducir sus controles eliminados.
- Existe coordinación entre pestañas del mismo origen mediante eventos de almacenamiento y comprobación de cambios antes de guardar. No es sincronización entre dispositivos.

## 3. Funcionalidades implementadas y decisiones de interfaz

- Inicio centrado en pegar un enlace y Enviar, sin textos explicativos encima/debajo ni selectores de usuario. La confirmación de guardado sí puede aparecer después de enviar.
- Clasificación automática en Agenda, Restaurantes o Casa; los casos no identificados quedan por revisar. Las otras ventanas no duplican la carga de enlaces.
- Agenda con calendario y lista; selector con iconos de mosaico y lista, sin pestaña independiente «Sin fecha».
- Debajo del calendario se muestran todos los planes de los filtros actuales ordenados cronológicamente, incluso de otros meses; los planes sin fecha van al final.
- Pulsar un día permite elegir visita de Espe, visita de Miguel u Otro plan. No hay un bloque separado «Añadir a la agenda». Las visitas admiten intervalos de varios días.
- Fichas en un pop-up; edición dentro de la propia ficha, etiquetas dinámicas y botón Guardar incluso sin cambios. No abrir otro editor separado.
- Guardar y borrar están al final del contenido, sin quedar flotando sobre él al hacer scroll. El enlace de origen debe ser discreto.
- Tarjetas compactas, con imagen y título pequeño de hasta dos líneas; detalle completo al abrirlas.
- Ojo arriba a la derecha y papelera roja abajo a la derecha, separados para evitar pulsaciones accidentales. Ocultar atenúa la tarjeta y excluye el plan del calendario, sin borrarlo de la lista. Borrar pide confirmación.
- Estados como pendiente, reservado, hecho, visitado o comprado se presentan como controles/etiquetas separados de la información principal.
- Casa agrupable por **tipo de objeto** y **estancia**. La zona se asigna manualmente después de capturar el enlace.
- Restaurantes en lista con cocina, dirección y datos relevantes. **No hay un mapa integrado con marcadores** en el código actual; fue una posibilidad solicitada inicialmente, no una funcionalidad completada.
- Adjuntos simplificados: añadir, descargar o quitar documentos. No hay un formulario adicional de múltiples enlaces. Límites: 10 MB por archivo, 50 MB por ficha y 60 MB en total.
- Exportación/importación desde Ajustes. Las copias versión 2 incluyen documentos; se acepta la versión 1 anterior. No almacenar esas copias personales en Git.

## 4. Requisitos y preferencias que deben mantenerse

Las decisiones más recientes de la conversación sustituyen a las anteriores: pop-up de ficha, sin usuarios, sin prioridad, creación manual desde el día del calendario y adjuntos simplificados son decisiones deliberadas.

- Nombre: **Planes Espe & Miguel**. Mantener la imagen original de marca; también se usa para las visitas de Espe y Miguel.
- Estética tranquila: base azul y beige. Colores de zonas distintos de la paleta base: Barcelona/Cataluña en salvia; Valencia/Comunitat Valenciana en naranja dorado; sin zona/otros destinos en malva.
- El naranja de Valencia no debe parecer rojo ni terracota rojizo, tampoco en sus versiones tenues. Evitar que los colores sugieran que una ciudad es positiva y la otra negativa.
- Filtro activo muy evidente, con los demás visualmente neutros. Separar acciones de creación de los filtros; no hacerlos indistinguibles por color o proximidad.
- Evitar títulos de sección redundantes, bloques duplicados y textos decorativos que resten espacio a las fichas. Diseñar para pulsación táctil y lectura rápida.
- El título automático debe contener solo el nombre de la obra, película o exposición; tipo de actividad en el resumen y recinto en su campo propio.
- El resumen debe explicar de forma breve y clara la trama, tema o experiencia. No usar una cita crítica, reparto, publicidad ni una actividad relacionada como sinopsis.
- Capturar fechas y periodos completos, funciones individuales, horarios múltiples y excepciones, dirección postal y recinto, precios con rangos, mínimos y condiciones. Nunca confundir un dato desconocido con gratuito.
- Un lugar visitable sin fecha también es un plan; no forzar su clasificación como restaurante o compra ni inventar una fecha.
- Interpretar la zona por el lugar de la actividad, no por el nombre de una calle, el origen del artista o la sede editorial del portal.
- No conectar WhatsApp por ahora. El usuario decidió empezar localmente y escalar después.
- Mantener la experiencia sin perfiles de usuario. Cualquier futura solución de acceso/sincronización debe resolver la privacidad sin introducir una interfaz de usuarios no solicitada.
- Respetar los campos editados manualmente. No rellenar todos los campos a cualquier precio: señalar información no contrastada.

### Caducidad: requisito explícito y delicado

Los planes fechados se **eliminan realmente** al pasar su último día en `Europe/Madrid`; no se archivan. Se usa fecha final cuando existe, y se conserva todo el día actual. Los planes sin fecha, restaurantes y compras no caducan por esta regla. Ocultar un plan no evita su caducidad.

La comprobación ocurre al abrir, volver a la app y periódicamente, y también al guardar/importar. Se limpian adjuntos que ya no tenga referenciados otra ficha. Por ello, una fecha mal extraída puede causar pérdida de datos: probar siempre la extracción junto con esta regla y usar datos sintéticos o un reloj controlado.

## 5. Problemas resueltos y limitaciones conocidas

### Correcciones incorporadas

- Delimitación de contenido principal para excluir menús, recomendaciones, otras obras y charlas previas.
- Funciones con días concretos frente a recurrencias: no inventar sesiones semanales a partir de una enumeración de fechas.
- Meses abreviados, fechas ES/CA/EN, periodos entre años, distintas horas por día y excepciones.
- Sesiones digitales, restricciones de acceso y varias funciones diarias; eliminación de duplicados y de horas finales idénticas a la inicial.
- Precios «desde», rangos y modalidades; gratuidad condicionada separada del precio general.
- Diferenciación entre dirección postal y dirección artística, entre sede real y administración, y entre horario de museo, biblioteca o taquilla.
- Lectura de JSON-LD, microdatos, JSON de aplicaciones, calendarios incrustados y ciertos datos de sesiones de taquilla sin evaluar el código de la fuente.
- Lectura dinámica con navegador aislado; conversión de PDF con capa de texto, ICS con sesiones explícitas, texto y JSON; compresión y codificaciones HTTP.
- Revisión de valores interpretados por IA frente a evidencia disponible, conservación de datos concretos extraídos y registro de conflictos. Son reglas heurísticas, no una segunda revisión humana.

### Límites que no deben ocultarse

- No existe extracción garantizada para todas las webs ni todos los formatos. La investigación cultural cubrió 15 fichas de ejemplo, no la totalidad de recintos de ambas regiones. Ver `REVISION-EXTRACCION.md`.
- Algunos precios y direcciones siguen pendientes en los casos documentados. No fijarlos en el código usando los valores de una conversación o una ficha concreta.
- El acceso directo a L’Auditori falló históricamente por la cadena TLS. No desactivar certificados para hacerlo funcionar.
- No hay OCR general para carteles o PDF escaneados. El PDF se limita a 60 páginas. Las reglas ICS no interpretadas quedan pendientes, sin crear un periodo falso.
- El navegador de lectura bloquea formularios, peticiones distintas de GET, recursos y superficies no permitidos. Puede no resolver páginas que requieran consentimiento interactivo, sesión, CAPTCHA o un flujo de compra.
- No hay reservas ni compras automáticas, acceso a cuentas privadas ni verificación de disponibilidad de entradas.
- La integración de IA existe, pero la última validación documentada se hizo **sin clave configurada**. No asumir el estado del equipo actual: consultar `/api/status`. Sin proveedor activo, los resúmenes son extracción/condensación y no deben etiquetarse como redacción con IA.
- Sin base de datos compartida, autenticación, despliegue público, funcionamiento offline completo ni paquete móvil nativo. La LAN solo proporciona acceso al servidor local.
- La documentación `LEEME.md` acumula notas históricas: menciones antiguas a menos páginas investigadas o a falta de lectura JavaScript están superadas por las versiones 13/14. Priorizar el código actual y la revisión reciente.

## 6. Estado y próximos pasos

La aplicación local y el extractor de versión 14 están implementados. El último trabajo de producto fue ampliar la extracción cultural y validar el volcado. Después el usuario anunció que enviaría nuevos enlaces fallidos; **todavía no aportó esos nuevos enlaces** antes de solicitar este documento. Esperarlos, reproducir cada fallo y generalizar la corrección a estructuras similares; no inventar casos proporcionados por el usuario.

Pendientes identificados, sin tratarlos como ya autorizados para implantar todos a la vez:

1. Recuperar o reconstruir las pruebas y fixtures históricos dentro de este repositorio; no están incluidos en el clon revisado.
2. Incorporar una instalación reproducible: manifiesto, versiones fijadas, lockfile, exclusión de dependencias/artefactos locales y scripts de pruebas. Evitar depender del runtime de una instalación concreta de Codex.
3. Seguir mejorando extracción, resúmenes, identidad de obras, cambios de sede y evidencias; mantener casos negativos y conflictos en las pruebas.
4. Validar la integración real de IA si el usuario decide configurarla, sin solicitar credenciales en el chat ni confundirla con la suscripción de una herramienta.
5. Diseñar persistencia compartida y sincronización entre dispositivos cuando se retome el escalado. No sustituir silenciosamente datos locales ni reintroducir perfiles de usuario.
6. Valorar el mapa de restaurantes y el alojamiento/acceso remoto en una fase posterior. WhatsApp sigue fuera del alcance actual.

## 7. Instalar, ejecutar y probar

### Arranque básico

Usar Node moderno con `fetch`, `AbortSignal.timeout`, `structuredClone` y `process.loadEnvFile`. El entorno anterior ejecutó Node 24.19.0; no hay una versión mínima formalizada ni fijada en el repositorio.

Desde la raíz:

```powershell
node --version
node server.cjs
```

Abrir `http://localhost:4173/`. No abrir `index.html` mediante `file://`: la extracción depende de la API local. No hay `npm run dev`, build ni script `npm test` definidos actualmente.

Para una red local privada:

```powershell
node server.cjs --lan
```

También existe `ABRIR-EN-MOVIL.cmd` en Windows. Mantener el servidor encendido y usar en el móvil la dirección LAN que anuncie. Puede requerir permiso del cortafuegos. El servidor no tiene autenticación ni configuración de producción: no publicarlo directamente en Internet.

### Dependencias de lectura ampliada

El lector básico usa módulos estándar de Node. La lectura dinámica necesita `playwright` y un navegador; PDF necesita `pdfjs-dist`. `reader-runtime.cjs` busca paquetes resolubles localmente y después en una ruta relativa al ejecutable de Node. La existencia de paquetes en el equipo anterior no garantiza que estén en otro ordenador.

Como preparación local provisional, sin manifiesto aún, pueden instalarse:

```powershell
npm install --no-save --package-lock=false playwright pdfjs-dist
```

Este comando es una instrucción para preparar otro entorno, no una instalación realizada al crear este documento. No fija las versiones históricas: comprobar compatibilidad y priorizar el empaquetado reproducible pendiente. No ejecutar un `npm install` vacío suponiendo que hay un manifiesto.

El lector busca Edge en las ubicaciones habituales de Windows, permite configurar `PLANES_BROWSER_PATH`, o usa el navegador de Playwright. Si no hay Edge ni una ruta configurada:

```powershell
npx playwright install chromium
```

No agregar `node_modules` ni navegadores descargados a Git. **El `.gitignore` actual solo excluye `.env` y `.ai-config.json`**; no asumir que dependencias, copias, logs o archivos de trabajo están ignorados. Revisar siempre lo que se va a añadir.

### IA opcional

Usar `CONFIGURAR-IA.cmd` en Windows, o preparar localmente `.env` a partir de `.env.example`. Las variables son `OPENAI_API_KEY` y `OPENAI_MODEL`; el modelo predeterminado del código es `gpt-4o-mini`. No documentar el valor de ninguna clave. Reiniciar el servidor tras cambiar la configuración.

La clave permanece en el servidor. La petición de IA incluye evidencia de páginas y datos extraídos, no los adjuntos ni la colección completa de fichas. No prometer un resumen generado por IA hasta verificar un resultado válido del proveedor. Consultar el estado sin exponer secretos:

```powershell
Invoke-RestMethod http://localhost:4173/api/status
```

### Comprobación mínima disponible en este clon

```powershell
Get-ChildItem -File -Path *.js,*.cjs | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { throw "Error de sintaxis: $($_.Name)" }
}
```

Esto solo comprueba sintaxis; no sustituye a pruebas de comportamiento. Verificar en un navegador aislado: captura, clasificación, detalle y edición, Guardar, recarga, zonas, visitas de varios días, sesiones, ocultar/borrar, adjuntos y exportación/importación. Usar registros sintéticos y fechas futuras o reloj fijado; nunca borrar o importar sobre el almacenamiento real del usuario para probar.

En el entorno anterior existían estas baterías, **ausentes aquí**: `extraction-regression.cjs`, `event-extraction-regression.cjs`, `deep-extraction-regression.cjs`, `reader-v13-regression.cjs` y `culture-v14-regression.cjs`. No afirmar que se han ejecutado desde este repositorio hasta recuperarlas junto con sus fixtures. `pdf-lib` se utilizó para crear un PDF sintético de pruebas; no es una dependencia del lector de producción.

Casos de regresión a conservar: CCCB (exposición frente a taller relacionado; seminario), Time Out/TNC, Zumzeig, Lliure, Virreina, Liceu, IVC, Les Arts, IVAM, Babel/ReservaEntradas y los dos Palau. Las fechas históricas son expectativas de fixtures, no programación vigente ni constantes de producción. Probar también errores, fuentes contradictorias, datos ausentes, fechas inválidas, mínimo frente a rango, otro evento en JSON, texto al final de páginas largas y persistencia de ediciones manuales.

### Mantenimiento

- Leer primero este archivo, el código afectado y `REVISION-EXTRACCION.md`; revisar `git status` antes de editar.
- Corregir formatos reutilizables, no añadir una tabla de respuestas con títulos/fechas de los ejemplos.
- Mantener compatibles los módulos compartidos con navegador y Node; respetar el orden de scripts en `index.html` y la lista de archivos de `server.cjs`.
- Si cambia el significado del análisis, actualizar coherentemente su versión en servidor y cliente. Revisar cómo se reanalizan fichas antiguas, cómo se aplican campos rechazados y cómo se protegen los cambios manuales.
- No cambiar las claves de almacenamiento ni el formato de copias sin una migración explícita y probada.
- Mantener la protección de red pública, límites, validación TLS y aislamiento del navegador. Tratar las páginas como datos no fiables, nunca como instrucciones a ejecutar.
- Reiniciar Node tras modificar módulos del servidor; recargar el navegador tras cambios del cliente. Verificar qué proceso y checkout sirve realmente el puerto 4173 antes de detenerlo.
- Actualizar este contexto y la documentación al completar cambios relevantes, sin incorporar datos personales de uso.

## 8. Continuidad entre ordenadores con GitHub

**GitHub sincroniza código y documentación, no el historial completo del chat ni el almacenamiento del navegador.** Este archivo conserva las decisiones necesarias para retomar el trabajo. Leerlo al iniciar una conversación nueva; no asumir acceso a mensajes antiguos.

1. Clonar la URL real del repositorio obtenida de GitHub; no inventar ni guardar aquí direcciones privadas o credenciales. Entrar en la raíz del clon y seguir la preparación anterior.
2. Revisar `git status`, rama actual y remoto. La rama observada al crear este documento era `main`; comprobarlo de nuevo, no asumirlo para futuros trabajos.
3. Antes de comenzar, actualizar una rama limpia con `git pull --ff-only`. Si hay cambios locales, conservarlos mediante un commit de trabajo o un procedimiento acordado; no usar `reset --hard` ni descartar archivos para resolverlo rápidamente.
4. Trabajar preferentemente en una rama descriptiva. Hacer cambios acotados, ejecutar las verificaciones disponibles y documentar límites reales de las pruebas.
5. Revisar `git diff` y añadir archivos explícitos. Usar `git diff --cached` antes del commit; evitar `git add .` mientras el ignore sea tan limitado.
6. Hacer commit y push mediante la autenticación de Git instalada en el equipo. Usar revisión/PR cuando proceda; no asumir que ya existe uno ni hacer push como parte de una tarea exclusivamente documental sin autorización adicional.
7. En el otro ordenador, recuperar la rama y los commits antes de continuar. Mantener decisiones y pendientes en `AGENTS.md`, detalles verificables en la revisión técnica y contexto del cambio en los commits.

Para llevar también los datos de uso: exportar una copia con documentos desde Ajustes, transferirla por un medio privado e importarla en el navegador de destino. No usar el repositorio como almacén de esa copia. `localhost`, una IP LAN, distintos puertos y navegadores pueden tener almacenes separados; ver una app vacía no significa que Git haya perdido las fichas. Importar planes históricos puede eliminarlos inmediatamente por la caducidad establecida.

No versionar `.env`, claves, contraseñas, tokens, perfiles de navegador, copias personales, adjuntos ni logs con contenido sensible. Configurar secretos separadamente en cada equipo. Si alguna vez se publica un secreto, eliminarlo del último archivo no basta: revocarlo y tratar también el historial.

### Alcance de la tarea que creó este archivo

Se autorizó crear únicamente `AGENTS.md` en la raíz, sin modificar archivos existentes, instalar dependencias, cambiar datos de la app ni publicar commits. Las instrucciones de instalación, empaquetado y Git anteriores son para tareas posteriores: no implican que esos trabajos estén hechos.
