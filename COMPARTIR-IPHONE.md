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
