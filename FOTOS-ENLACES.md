# Fotos de enlaces — Instagram 18 / lector general 17

Revisión del 31/10/2026. No se han modificado fichas reales para probarla.

## Comportamiento

Al añadir un enlace compatible, la aplicación recupera la foto pública y guarda
una miniatura WebP dentro del registro. Así puede mostrarse sin conexión y seguir
visible cuando el enlace temporal de la foto caduque. No se guarda como un recurso
estático público ni en la caché PWA de la interfaz; sigue la privacidad de la ficha.
La sincronización y el borrado mínimo ya existentes incluyen ese campo de imagen.

Instagram usa la versión 18; las demás fuentes conservan la 17. Las fichas de
Instagram anteriores a la 18 se reanalizan al abrirlas. Hay que pulsar
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

- Admite perfiles públicos, publicaciones, reels, canónicas con nombre de cuenta
  y enlaces share. Un /p/código/ y un /reel/código/ pueden ser el mismo contenido.
- Lee biografía/categoría/nombre del perfil y texto, ubicación y fotos de la
  publicación solicitada. Excluye contadores, fechas de publicación, datos de
  recomendaciones y fotos de otras cuentas. No usa el nombre del periodista
  como si fuese el restaurante o el lugar descrito. Normaliza letras decorativas.
- Clasifica contenido reconocible como restaurante (Comer), lugar/actividad
  (Agenda) o muebles/decoración (Casa). Lo ambiguo sigue Por revisar. Extrae
  resumen, cocina, precios, horarios, dirección, teléfono y web cuando constan.
  No inventa el número de una calle, una fecha de visita ni un precio ausente.
- Para perfiles, prioriza fotos propias con descripción de comida en restaurantes
  y excluye el avatar. Para posts usa sus fotos/portadas, incluidos carruseles;
  no toma las fotos del perfil de quien recomienda un lugar. La prioridad usa
  textos publicados, sin reconocimiento visual por IA: no garantiza que toda
  publicación tenga una foto de comida. Una foto del local es válida si es la
  que publica el post, pero no se presenta como comida comprobada.
- La web que el propio perfil declara puede completar datos cuando coincide
  la identidad. Hasta portada y una página de contacto del mismo origen; no
  se investiga la web del autor de una recomendación. Las fotos siguen siendo
  de Instagram. Cada petición conserva el lector público con DNS/IP validados.
- Puede probar vista incrustada pública y lector dinámico, sin sesión ni cookies
  del usuario. No elude cuentas privadas, login o CAPTCHA. Si no hay acceso,
  ofrece completar manualmente y elegir/pegar una foto. No garantiza todos los
  perfiles ni posts: Instagram cambia y puede restringir lectura desde Render.
- El reanálisis conserva campos/fotos manuales. Solo al pulsar Guardar se
  persiste la nueva ficha; no hay reescritura masiva ni pruebas con datos reales.
  Los campos automáticos no sustentados (incluidas falsas fechas) se limpian.
- Presupuesto de lectura 30 s más hasta 11 s de copia/compresión de imagen,
  sin nuevos servicios, dependencias, claves de IA ni costes contratados.

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

## Ampliación de perfiles y contenido — 31/10/2026

Verificados por inspect() real los tres enlaces aportados, sin guardarlos:

- Deo9rRviCtb: Comer; Hare Krishna ISKCON Barcelona, zona/plaza, menú 9 €,
  apertura entre semana al mediodía. La única foto muestra el comedor con texto
  (24 396 bytes), no un plato.
- tapas2254: Comer; Tapas 2254, cocina italo-catalana, horario, dirección y
  teléfono de su web declarada. Foto propia de comida, 10 604 bytes.
- Dee4Y-LCn_Q: Agenda; Picos de Europa, sin fecha inventada ni zona BCN/VLC.
  Canónica reel reconocida; miniatura del paisaje, 24 022 bytes.

No se almacenan estas respuestas o fotos reales en Git. Tiendas de muebles
verificadas con fixtures sintéticos, sin atribuir una prueba real no realizada.
115 pruebas unitarias y Edge: perfiles/posts hacia Comer/Agenda/Casa, fotos
compactas, cocina, Reservado en nuevos planes, reanálisis 17→18 y protección
manual. También pasan imágenes/pegado/sin red, editor compacto, filtros de
comida, PWA y nube (esta última comprobada de forma aislada).
