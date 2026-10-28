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
