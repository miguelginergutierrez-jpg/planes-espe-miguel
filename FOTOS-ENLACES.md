# Fotos de enlaces — extractor 17

Revisión del 31/10/2026. No se han modificado fichas reales para probarla.

## Comportamiento

Al añadir un enlace compatible, la aplicación recupera la foto pública y guarda
una miniatura WebP dentro del registro. Así puede mostrarse sin conexión y seguir
visible cuando el enlace temporal de la foto caduque. No se guarda como un recurso
estático público ni en la caché PWA de la interfaz; sigue la privacidad de la ficha.
La sincronización y el borrado mínimo ya existentes incluyen ese campo de imagen.

Las fichas anteriores a la versión 17 se reanalizan al abrirlas. Hay que pulsar
Guardar para conservar la imagen obtenida. No se hace un reemplazo masivo de datos
ni se sustituyen fotos elegidas manualmente.

Si la fuente no permite obtener una foto, se indica y queda disponible Elegir foto.
También se puede pegar una imagen o captura con Ctrl+V en la ficha, o elegir una
captura desde la galería del teléfono. Se comprime como las demás fotos manuales.
No se captura una pantalla de login, consentimiento o CAPTCHA como si fuera una foto.

## Google Maps

- Conserva seguimiento de enlaces cortos mediante el lector público.
- Verifica la ficha seleccionada por el identificador hexadecimal, Place ID
  (incluido query_place_id) o CID numérico, antes de usar sus datos y fotos.
- Prioriza fotos con etiquetas de comida. Si no las hay, admite una foto de la
  ficha del lugar, por ejemplo su fachada. No la presenta como comida verificada.
- No busca fotos ni precios dentro de reseñas y excluye avatares, cartas y vídeos.
- Restauración va a Comer; lugares visitables como museos y parques van a Agenda
  sin fecha inventada. Categorías no identificadas quedan por revisar.
- No se inventan precios ni otros campos ausentes. El formato interno de Maps
  sigue sin ser una API estable y puede cambiar o bloquear el acceso público.

## Instagram

- Publicaciones, reels, rutas canónicas con nombre de cuenta y enlaces share.
- Lee vistas previas públicas y JSON ligado al código de la publicación; ignora
  recomendaciones de otros posts, perfiles, iconos y fotografías de avatar.
- Se corrige el filtro general que rechazaba fotos por tener cdninstagram.com
  en la dirección. También se reconoce la canónica /cuenta/p/código/.
- Puede probar la vista incrustada pública y el lector dinámico cuando la página
  pública no ofrece metadatos, sin iniciar sesión ni usar cookies del usuario.
- No garantiza acceso a todas las publicaciones, perfiles, contenido privado,
  enlaces caducados o pantallas de acceso. La alternativa manual sigue disponible.

## Tamaño y aislamiento

`image-reader.cjs` descarga por `public-reader.cjs`: validación de DNS/IP públicas,
conexión fijada, TLS normal y límites conservados entre redirecciones. Máximo
2 MB tanto descargados como descomprimidos; PNG, JPEG, WebP y GIF, sin SVG.
Verifica dimensiones antes del navegador: máximo 6 000 px por lado y 8 MP.

Codifica los bytes en un navegador nuevo con todas las peticiones de red y
WebSockets bloqueadas, sin perfiles, cookies, permisos ni descargas del usuario.
Mantiene el sandbox de Chromium en producción. Salida: WebP estático, lado mayor
hasta 480 px y máximo 45 000 caracteres de data URL (unos 34 KB de imagen).
Las fotos más pequeñas no se amplían. No se añade ninguna dependencia ni API de pago.

`preview.cjs` convierte la foto antes de responder al cliente o al atajo. Se
mantienen la autenticación, pertenencia, controles de origen y límites existentes.
El atajo conserva el data URL completo: se corrige su truncado anterior a 10 000
caracteres. Las imágenes manuales siguen protegidas frente a reanálisis.

## Verificación

Lecturas públicas reales en este PC, sin crear fichas:

- Ficha de Maps de muestra: foto de 6 602 bytes.
- Enlace corto de Maps aportado en esta revisión: foto de 11 520 bytes.
- Publicación pública de Instagram: foto de 9 330 bytes.

Son ejemplos verificados, no una garantía para todo Maps o Instagram. No se han
publicado respuestas completas, fotos obtenidas ni datos de reseñadores en Git.

104 pruebas unitarias: identidad, canónicas, metadatos, límites, redirecciones,
DNS privado, bombas de descompresión, formato de imagen y conservación en el atajo.
`tests/browser-social-images.cjs`: codificación real, captura/guardado/recarga,
foto disponible sin conexión, pegado, protección manual y alternativa tras error.
También pasan agenda, editor compacto, nube, Maps, PWA, atajo, compartir y acceso
alojado, con contextos nuevos y datos sintéticos. El lector dinámico aislado da ready.
