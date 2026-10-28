# Publicación móvil

Estado: preparada localmente, sin servicio remoto creado todavía.

## Opción elegida y coste

Render, servicio Web Docker con plan **Free**, región Frankfurt. Conserva Node
24 y la lectura pública HTTP/PDF/Playwright sin sustituirla por proxies abiertos.
No añadir tarjeta ni contratar planes de pago. Render publica una URL HTTPS y
permite despliegue automático al subir cambios a la rama vinculada.

Límites consultados el 28/10/2026: el servicio se duerme después de 15 minutos
sin tráfico y tarda alrededor de un minuto en reactivarse; 750 horas gratis por
workspace y mes. Tiene 512 MB de RAM, por lo que se admite una extracción a la
vez y ocho peticiones por minuto por miembro. Render puede suspender por exceso
de transferencia o tráfico saliente. Sin método de pago, el exceso suspende o
bloquea nuevos builds; no convertirlo en un upgrade automático.

Fuentes oficiales: https://render.com/docs/free,
https://render.com/docs/blueprint-spec y https://render.com/docs/web-services.

Los datos y adjuntos siguen en el Supabase existente: no crear base de datos
Render, ejecutar migraciones ni trasladar datos al disco efímero del servidor.
Se mantienen los límites del plan gratuito Supabase.

## Archivos y seguridad

- `Dockerfile`: Node 24.22.1, instalación reproducible npm ci, Chromium con sus
  bibliotecas, usuario sin privilegios. No incorpora .env, sesiones ni copias.
- `render.yaml`: plan free explícito, rama codex/publicacion-movil, /healthz y
  PLANES_REQUIRE_AUTH=1. Confirmar la rama real al vincular GitHub.
- `server.cjs`: respeta PORT y escucha en 0.0.0.0 solo en modo remoto/LAN.
  En producción exige origen HTTPS configurado por RENDER_EXTERNAL_URL o
  PLANES_PUBLIC_ORIGIN, sesión Supabase verificada y pertenencia antes de leer.
  Los tokens no se guardan en logs ni archivos del servidor.
- `host-auth.cjs`: verifica /auth/v1/user y planes_members en cada extracción;
  no confía en claims decodificados ni usa claves administrativas.
- La página y recursos estáticos no contienen fichas privadas. La colección y
  documentos están protegidos por Supabase RLS; abrir una URL no autoriza acceso.
- Chromium usa sandbox en producción. Falta verificar en el Linux alojado que
  el proveedor permita ese sandbox; no desactivarlo para facilitar el despliegue.
  Si no puede iniciarse, la lectura dinámica quedará limitada y debe indicarse.
- No se configuró IA ni una API de pago. Consultar /api/status en la URL remota.

## Icono móvil, sin red y actualizaciones

El manifiesto permite añadir al inicio; los PNG se obtienen de la imagen original
sin alterar la marca. El service worker conserva solo archivos de interfaz: no
cachea la API, Supabase, tokens ni documentos. La colección y adjuntos descargados
siguen en sus almacenes habituales del navegador.

El identificador de caché deriva del contenido servido al arrancar. Una versión
nueva no fuerza recarga de una ficha sin guardar; las actualizaciones pendientes
se aplican al cerrar y abrir las copias. Con red, los archivos se consultan al
servidor; sin red se utiliza la interfaz almacenada. Esto no asegura extracción
sin conexión ni que archivos nunca descargados estén disponibles sin Internet.

## Pasos pendientes de despliegue

1. Se encontró y sugirió la integración Render. Preferirla cuando el usuario la conecte; comprobar sus herramientas y cuenta antes de crear servicios. Si no ofrece la capacidad necesaria, entrar en dashboard.render.com con la cuenta del usuario. No solicitar
   contraseñas/tokens por el chat. Si hace falta crear cuenta o aceptar términos,
   el usuario completa ese acceso.
2. Vincular únicamente el repositorio planes-espe-miguel cuando se elijan
   permisos GitHub. No dar acceso a todos los repositorios por comodidad.
3. Crear Web Service Docker, plan Free, Frankfurt, rama codex/publicacion-movil,
   health /healthz. Verificar plan y ausencia de cobros antes de crearlo.
4. Esperar build y URL HTTPS real; revisar logs sin publicar datos de sesión.
5. Verificar /api/status, acceso denegado sin sesión, login, sincronización,
   captura autenticada, lectura dinámica con sandbox y documento desde el móvil.
6. Indicar al usuario cómo añadir al inicio de Safari. Segundo miembro y Android
   se probarán más adelante. No afirmar publicación o instalación hasta observarla.

## Pruebas locales

76 pruebas de Node y browser-pwa, browser-cloud, browser-maps pasan. PWA se ha
probado con Edge aislado: caché de interfaz, colección sin red y exclusión de API.
No hay Docker instalado en este PC: la imagen Linux y Chromium de producción
solo se podrán validar en el primer build/despliegue. No confundir estas pruebas
locales con una publicación o una prueba en iPhone.
