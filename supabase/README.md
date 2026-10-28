## Verificación real — 28/10/2026, después de activar

La actualización 002 se aplicó desde el SQL Editor del proyecto existente con
resultado «Success. No rows returned». No se repitió 001 ni se cambiaron RLS o
miembros. El acceso de la app se renovó y se activó la sincronización en el
navegador de casa; Ajustes muestra «Sincronizado».

Se comprobó la descarga real de la ficha anterior (plan sin fecha, estado Hecho;
visible en Agenda al elegir Todos). Se creó aparte una ficha «Prueba de
sincronización», fecha 2030-10-30, y se comprobó por una consulta SELECT en el
panel que llegó automáticamente a Supabase (revision 1), y que una edición de notas desde la app elevó la revisión a 2. La ficha original se
conserva. No se ha realizado ninguna prueba de borrado sobre datos reales.
Todavía están pendientes la prueba real con un segundo navegador independiente,
adjuntos reales, segundo miembro y Android. Publicación/PWA siguen pendientes.
# Sincronización privada — estado vigente 28/10/2026

Implementación preparada en la rama codex/sincronizacion-privada. Falta aplicar
la actualización **002_sync_deletions.sql** en el proyecto existente y verificar
el flujo real desde la app. No ejecutar de nuevo 001, crear el proyecto, cambiar
RLS, autorizar de nuevo al primer miembro ni repetir la copia inicial.

- `cloud-session.js`: sesión renovable por Supabase Auth, persistida solo en este
  navegador. No guarda contraseña ni correo. Renovación coordinada entre pestañas
  mediante Web Locks. Desconectar elimina la sesión de este navegador y pausa la
  sincronización; no borra fichas ni cierra sesiones de otros dispositivos.
- `cloud-sync.js`: comparación de tres versiones (base conocida, local, remota),
  altas con POST y cambios/borrados con PATCH condicionado por `revision`.
  Nunca hace upsert ni DELETE. Una respuesta fallida nunca equivale a lista vacía.
- `deleted_at` mantiene una marca para impedir que un móvil desconectado resucite
  fichas borradas. La ficha deja de estar en la colección activa. La fila técnica
  conserva su payload; no se ha implementado purga definitiva ni recogida de
  documentos remotos huérfanos. Revisar almacenamiento antes de uso intensivo.
- Documentos en rutas SHA-256 inmutables, verificados tras subir/descargar. La
  caché es IndexedDB; `cloudPath` sobrevive normalización y exportación. Se
  mantienen los límites existentes (10 MB/archivo, 50 MB/ficha, 60 MB/colección).
- `cloud-controller.js`: activación explícita por navegador, envío tras guardar,
  consulta cada 30 segundos mientras esté visible y al volver/encontrar red.
  Usa exclusión entre pestañas, comprueba cambios durante peticiones y mantiene
  un diario local para recuperar un cierre o fallo de cuota a mitad del guardado.
- Ajustes permite activar, pausar, desconectar y revisar conflictos. Nunca se
  elige automáticamente un ganador para ediciones simultáneas. Las dos versiones
  se pueden consultar antes de elegir. Los conflictos se recalculan al conectar.
- Una sesión temporal anterior requiere iniciar sesión de nuevo para obtener
  renovación; no se recuperan contraseñas ni sesiones del PC anterior.

## Aplicar 002 (único paso de esquema nuevo)

Abrir SQL Editor del proyecto existente y ejecutar íntegramente
`migrations/002_sync_deletions.sql`. Es una operación aditiva e idempotente: añade
una columna, no modifica datos existentes, permisos ni miembros. Tras confirmar
éxito, recargar la app, iniciar sesión y activar desde Ajustes. Si falta la columna,
la activación falla antes de escribir fichas. El administrador debe entrar en el
panel por su cuenta; no pedir credenciales administrativas en el chat.

## Validación y límites

68 pruebas unitarias: extracción previa, copia inicial, sincronización, conflictos,
condiciones de revisión, fallos de red, adjuntos corruptos, renovación de sesión
y recuperación del diario. `npm.cmd run test:cloud` prueba dos navegadores Edge
móviles aislados: activación, adjunto, edición por interfaz, renovación, conflicto,
resolución y borrado. `browser-v15` y `browser-maps` también pasan.
Todo ello usa datos sintéticos. Pendiente: actualización 002 real, sincronización
real en dos navegadores, permisos de segundo miembro y cuenta ajena contra RLS.
El primer miembro sí verificó acceso real en el navegador de casa antes del cambio.

No hay aún publicación ni PWA. iPhone y Android no reciben todavía una app
instalada. El extractor sigue necesitando Node/Playwright local; estudiar su
alojamiento antes de prometer extracción remota gratuita.

El plan Free de Supabase permite 0 USD/mes con límites (500 MB de base, 1 GB de
archivos y 5 GB de salida; puede pausar tras una semana de inactividad). No se
contrató ni cambió ningún plan. La consulta actual descarga la colección completa;
optimizar lectura incremental antes de colecciones grandes/uso continuo para
reducir transferencia. No prometer coste cero sin límites.
Fuentes: https://supabase.com/pricing y
https://supabase.com/docs/guides/auth/sessions (consultadas 28/10/2026).

---

Las notas siguientes describen las fases anteriores; el estado de arriba prevalece.

# Preparación de sincronización — pendiente de activación

## Confirmación posterior y traslado de equipo

El usuario mostró «Copia verificada: 1 fichas y 0 documentos en la nube» y
aclaró que todos los datos actuales son pruebas, sin interés en recuperar más.
La primera copia REAL está confirmada; no repetir la creación de proyecto,
migración ni alta del primer miembro. Esto sustituye las menciones inferiores
a copia pendiente. La prueba real de subida de adjuntos aún está pendiente
(solo se probó con respuestas simuladas). La sincronización sigue pendiente.
Se prepara continuidad en el ordenador de casa: ver `../CONTINUAR-EN-CASA.md`.

## Estado actualizado: 28/10/2026

El usuario mostró «Conexión verificada» en la app: acceso real de la primera
cuenta confirmado. Ahora Ajustes ofrece «Copiar fichas y documentos a la nube».
El botón pide confirmar el número de fichas y documentos y ejecuta una copia
inicial explícita mediante `cloud-migrate.js`. El usuario ya confirmó el resultado: una ficha de prueba y ningún documento.

La copia lee y valida todos los adjuntos antes de escribir, usa rutas inmutables
`initial/<sha256>` en el bucket privado y conserva `cloudPath` en los metadatos
de los adjuntos de la ficha remota. Verifica bytes descargados y fichas al final.
No hace upsert ni DELETE. Repetir una copia idéntica no duplica; una ficha remota
distinta con el mismo ID detiene la copia para no sobrescribirla. Las altas de
fichas se envían juntas, después de verificar documentos. Un fallo puede dejar
archivos subidos sin referencias; se conservan para poder reintentar, no se
borran automáticamente. La colección local y sus adjuntos no se modifican.

Esta es una copia puntual, NO sincronización automática. Los cambios posteriores
siguen siendo locales. Faltan sesión persistente con renovación, lectura/escritura
diaria compartida con conflictos y borrados, descarga de documentos remotos y
publicación. No activar uso desde otro dispositivo como si ya estuviera terminado.

Validación: 43 pruebas unitarias pasan; `tests/browser-cloud.cjs` comprueba en un
navegador móvil aislado login, denegación de cuenta ajena, contraseña incorrecta,
copia explícita de ficha y documento, repetición y conservación local. Las
respuestas remotas son simuladas: no constituye una prueba de escritura real
ni de todas las políticas de Supabase. La primera copia del usuario las ejercerá.

La copia de fichas y documentos fue exportada por el usuario y guardada en Drive.
El usuario creó el proyecto y facilitó URL y clave publicable. Se ha comprobado
HTTP 200 en `/auth/v1/settings` el 27/10/2026. Esto verifica conectividad y clave,
no tablas, reglas de acceso, sincronización ni autenticación de personas.

`../supabase-public.json` contiene exclusivamente configuración pública, sin
contraseña ni clave administrativa. `cloud-connect.js` la carga al conectar
desde Ajustes. El servidor solo expone ese JSON público, nunca `.env`.

## Paso actual

El usuario ya ejecutó la migración e insertó su cuenta en `planes_members`
(slot 1), confirmado por captura de éxito. No guardar su correo/UID en Git.
Se añadió un formulario en Ajustes para verificar su acceso. Hace login por
contraseña directamente con Supabase y comprueba `/auth/v1/user`, pertenencia
y lectura de la tabla de fichas. No escribe fichas ni documentos. La contraseña
se vacía al finalizar; solo conserva el token de acceso hasta su expiración en
sessionStorage de esta pestaña. Todavía no hay renovación de sesión ni acceso
persistente de larga duración. La sesión definitiva se implementará junto con
la sincronización. No confundir «Conexión verificada» con sincronización activa.

Prueba aislada `node tests/browser-cloud.cjs`: cuenta autorizada, reapertura,
cuenta sin pertenencia, contraseña incorrecta, ausencia de escrituras de datos
y conservación de la colección local. Usa credenciales sintéticas; aún falta
que el usuario verifique su acceso real en la app sin compartir la contraseña.

### Procedimiento inicial ya completado

Abrir SQL Editor en Supabase, crear una consulta, pegar todo el contenido de
`migrations/001_shared_space.sql` y pulsar Run. Se ejecuta en una transacción.
Está destinado a este proyecto nuevo, una sola vez: si las tablas ya existen,
no borrarlas ni reemplazarlas para repetirlo. Revisar primero el error.

El script crea dos tablas y un almacén privado con límite de 10 MB por archivo.
Solo dos cuentas pueden pertenecer al espacio, autorizadas por el administrador
desde SQL Editor; nadie puede autorizarse a sí mismo desde la aplicación.
El script inicial no inserta ningún miembro ni dato. Las políticas se basan en el ID
de sesión autenticada, no en una dirección de correo enviada por el cliente.

## Siguientes pasos (no implementados)

1. Confirmar ejecución del script y probar accesos denegados sin sesión.
2. Preparar inicio de sesión; crear/autorizar las cuentas desde el panel sin
   publicar contraseñas ni incluir correos privados en el repositorio.
3. Probar permisos con miembro, segundo miembro y cuenta ajena antes de importar.
4. Conectar cliente y documentos; usar `revision` para impedir sobrescribir
   cambios simultáneos (el trigger por sí solo NO resuelve conflictos).
5. Migración explícita y deduplicada desde copia local; no sustituir registros
   existentes con una colección vacía por un fallo de conexión.
6. Implementar propagación de cambios y borrados entre dispositivos, y comprobar
   caducidad y adjuntos compartidos. No hay suscripción Realtime creada aún.
7. Publicación, PWA y compartir desde iOS; Android puede verificarse después.

El usuario confirmó `Success. No rows returned` al ejecutar la migración inicial.
Se comprobaron solicitudes sin sesión a `planes_items` y `planes_members`: ambas
devuelven HTTP 401. Faltan las pruebas de acceso con miembros y no miembros;
esto no certifica todavía todas las políticas ni la sincronización.
La clave publicable
no permite administrar el esquema. No solicitar una clave secreta en el chat.
La app sigue local y no modifica datos remotos hasta desarrollar y probar la
integración. Mantener la copia privada fuera de GitHub.
