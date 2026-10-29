# Guardar sin abrir la app — 29/10/2026

El usuario ya probó el atajo de apertura y solicita guardado automático en
segundo plano. La actualización 003 fue autorizada y aplicada en Supabase:
Success. No rows returned. No repetir 001/002 ni cambiar las fichas existentes.
La comprobación real del nuevo atajo queda pendiente del iPhone.

## Preparar el permiso una vez

En la web publicada, Ajustes → Espacio compartido → Compartir desde iPhone sin
abrir la app → Crear permiso para Atajos → Copiar permiso. Requiere sesión de
miembro. Crear uno nuevo revoca el anterior de esa cuenta; dura un año y puede
revocarse. No pegar el permiso en chats, GitHub, capturas o enlaces públicos.
No es la contraseña ni la clave pública Supabase. Solo añade fichas; no permite
leer, editar ni borrar la colección ni los documentos.

## Modificar el atajo existente (interfaz en inglés)

Conservar Show in Share Sheet, Get URLs from Shortcut Input y Get First Item
from URLs. Eliminar URL Encode, el Text con #share= y Open URLs.

1. Añadir URL con https://planes-espe-miguel.onrender.com/api/share.
2. Añadir Get Contents of URL usando la URL anterior. Desplegar las opciones.
3. Method: POST. Request Body: JSON.
4. Añadir dos campos de tipo Text:
   - url: variable Item from List (el enlace original, SIN URL Encode).
   - token: pegar el permiso copiado de Ajustes, sin comillas ni espacios.
5. Añadir Get Dictionary Value, clave message, del resultado Contents of URL.
6. Añadir Show Notification con el resultado Dictionary Value.
7. No añadir Open URLs, Open App ni Quick Look. Si no hay entrada, detener el
   atajo. Si Apple pregunta si puede conectar al dominio de la app, permitirlo.

Al compartir, iOS muestra el progreso del atajo mientras espera y una
notificación al terminar; no se solicita navegar fuera de la web original.
El alojamiento Free puede estar dormido y tardar; Atajos/iOS puede interrumpir
una petición larga. Un timeout NO confirma guardado: reintentar el mismo enlace
no duplica entre envíos de Atajos. Verificar resultado real en el iPhone.

## Implementación y comprobaciones

POST /api/share autentica el permiso, limita llamadas, usa el lector existente
y guarda en Supabase antes de responder ok:true. No devuelve contenido privado.
Errores devuelven ok:false y message; fallo de lectura guarda inbox para revisar.
Una fecha histórica queda en inbox para no perder la ficha por caducidad.
No hace procesamiento persistente después de responder ni usa un worker oculto.
La extracción sigue teniendo las limitaciones de fuentes privadas y bloqueos.

003 crea una tabla sin permisos directos y funciones restringidas. Solo el hash
SHA-256 se guarda en la base. Un miembro genera/revoca su permiso; el portador
puede comprobarlo y añadir fichas con campos permitidos, nunca modificarlas.
La deduplicación y el límite de 8 envíos/minuto por permiso se validan también
en la base; no se reviven borrados existentes. Compartir de nuevo explícitamente
un enlace previamente borrado crea una ficha nueva.

Pruebas: 87 unitarias, tests/browser-shortcut.cjs, las baterías previas y
PostgreSQL aislado con tests/shortcut-sql.cjs. Para esa prueba opcional,
PGLITE_MODULE apunta a @electric-sql/pglite, instalado fuera del proyecto.
Valida migración idempotente, roles, miembro/no miembro, token, deduplicación,
campos protegidos, rotación, límite y revocación. No contiene datos reales.

Fuente de Apple: https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios

---
## Versión anterior: abrir la app con un enlace preparado

# Compartir enlaces desde iPhone

Preparado el 29/10/2026. El usuario confirmó instalación desde el icono y una
edición sincronizada de iPhone a ordenador. El atajo se debe crear y comprobar
en su iPhone; las pruebas de escritorio no verifican el menú Compartir de iOS.

## Crear el atajo una vez

1. Abre **Atajos**, pulsa **+** y nómbralo **Guardar en Planes**.
2. En los detalles activa **Mostrar al compartir**. Como tipos de entrada elige
   URL, texto y páginas web de Safari. Si se ejecuta sin entrada, configura
   detener el atajo (no usar automáticamente el portapapeles).
3. Añade **Obtener URL de la entrada**, usando **Entrada del atajo**.
4. Añade **Obtener ítem de la lista** y elige **Primer ítem**. Compartimos un
   enlace por ejecución, aunque el texto contenga varios.
5. Añade **Codificar URL**, en modo **Codificar**, para ese primer ítem.
6. Añade **Texto**. Escribe el prefijo siguiente y, inmediatamente después del
   signo igual, inserta la variable del resultado de **Codificar URL**:

   `https://planes-espe-miguel.onrender.com/#share=`

   La variable se inserta con el selector de variables de Atajos; no escribas
   literalmente «URL codificada». No añadas espacios ni saltos de línea.
7. Añade **Abrir URL**, usando el resultado de **Texto**. Guarda el atajo.

Los nombres pueden variar según idioma/versión de iOS. Apple documenta la
activación en Compartir y los tipos que admite cada aplicación:
https://support.apple.com/guide/shortcuts/run-a-shortcut-from-another-app-apd163eb9f95/ios
https://support.apple.com/guide/shortcuts/input-types-apd7644168e1/ios

## Usar y comprobar

Desde Chrome/Safari, Google Maps o una aplicación que comparta un enlace web:
**Compartir → Guardar en Planes → Enviar**. El atajo abre la web con el enlace
preparado; la app realiza la extracción habitual al pulsar Enviar. No se instala
una extensión nativa ni se garantiza que abra el icono independiente: puede
abrir el navegador y pedir iniciar sesión/activar sincronización allí una vez.

Prueba primero una página pública en Chrome. Comprueba que el enlace completo
aparece, pulsa Enviar y verifica la ficha y su sincronización. Después prueba
Maps. Instagram/WhatsApp pueden requerir abrir su menú de compartir externo;
si solo entregan imagen o contenido privado, el atajo no puede convertirlo en
una página pública legible. No se garantiza extraer contenido protegido.

## Funcionamiento y límites

El enlace codificado viaja en el fragmento `#share=`, no en una petición al
servidor. La app lo retira de la barra después de procesarlo. No hay claves,
contraseñas ni tokens en el atajo. No hace escrituras solo por abrir un enlace.
Conserva el borrador en sessionStorage si falta sesión o se recarga la pestaña;
se elimina al guardar correctamente o reconocer un duplicado. No sustituye una
edición/enlace pendiente con otro recibido. Cerrar la pestaña puede perder el
borrador: compartir de nuevo si es necesario. No afecta a las fichas guardadas.

Pruebas: `node --test tests/share-input.test.cjs` y
`node tests/browser-share.cjs` (servidor aislado y datos sintéticos).
