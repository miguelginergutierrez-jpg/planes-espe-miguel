# Estado real — 14/11/2026

Usuario confirma el atajo importado y el guardado en segundo plano funcionando.
Pendiente logo: ve icono de HTTP también dentro del atajo. El destino PWA anterior
con logo sigue en Compartir y confunde. Próximo paso: editar solo icono del atajo
y verificar Direct Share, conservando permiso y flujo ya funcionales. La prueba
física anterior prevalece sobre las notas históricas de pendiente inferiores.

# Compartir enlaces desde Android

Publicado el 14/11/2026: manifiesto share_target verificado en Render. Usuario
confirma cuenta de Espe creada y SQL «Segundo acceso preparado» (slot 2).
Usuario confirma login y estado «Sincronizado» en Android.
Instalación con logo y Compartir físico confirmados por el usuario: crea ficha.
Chrome Update falló; se solucionó reinstalando la app desde Ajustes Android.
Nuevo pendiente: envío sin primer plano mediante atajo nativo, por petición del
usuario. El receptor PWA actual abre Planes; no afirmar que cumple segundo plano.

1. Crear cuenta propia en Authentication > Users del Supabase existente. El
usuario introduce correo/contraseña allí; no pedirlos en el chat ni guardarlos.
2. Autorizar exclusivamente slot 2 con autorizar-segundo-miembro.sql, sustituyendo
el marcador solo dentro del SQL Editor oficial. No repetir migraciones ni
reemplazar miembros. El script impide sustituir un segundo miembro diferente.
3. En Chrome Android, abrir https://planes-espe-miguel.onrender.com, conectar
la cuenta de Espe y activar sincronización. Instalar desde menú Chrome > Instalar
aplicación (WebAPK, no solo marcador). El manifiesto conserva el logo existente.
4. Compartir un enlace desde Chrome/Maps/Instagram, elegir Planes y esperar a
la confirmación. Se abre la app y guarda automáticamente, sin pulsar Enviar.
No equivale al atajo iPhone que ejecuta sin abrir la app.

Implementación: share_target POST urlencoded /share-target; servidor de respaldo
y service worker reciben title/text/url y extraen un único enlace http(s) sin
credenciales. Nada se escribe por un GET arbitrario. POST crea un ticket aleatorio;
SW lo guarda en IndexedDB privado; respaldo servidor 15 minutos en memoria.
Se redirige al shell con el ticket en fragmento, sin URL compartida en query/logs.
La app solo procesa tickets existentes, conserva una cola local privada hasta
conectar/activar la sincronización, protege borradores y bloquea procesamiento
simultáneo entre pestañas. No usa claves de Atajos ni credenciales nuevas.
Guardado/sincronización normales de la colección, deduplicación por URL. Las
fechas ya pasadas quedan por revisar. Fallos de red mantienen los pendientes;
no se promete proceso permanente en segundo plano ni plazo instantáneo en Render Free.
Sin cambios en RLS, migraciones, presupuesto ni flujo #share del iPhone.

123 unitarias; Edge: POST real con SW, conservación durante login/recarga,
captura y sincronización automáticas con backend sintético, sin duplicados.
También pasan flujo iPhone anterior y PWA sin red. Compartir PWA físico confirmado.
Fuente primaria: https://developer.chrome.com/docs/capabilities/web-apis/web-share-target

## Guardar sin traer Planes al primer plano (preparado, pendiente móvil)

HTTP Request Shortcuts instalado por el usuario. Cuenta, autorización, PWA y
sincronización de Espe ya comprobadas: no repetirlos.

1. En el Android de Espe, abrir Planes publicado y Ajustes. Desplegar «Guardar
   enlaces sin abrir la app» y pulsar «Preparar atajo Android». Confirmar la
   creación del permiso exclusivo de ESA cuenta. No hacerlo con la de Miguel.
2. Se descarga guardar-en-planes-android.zip, generado solo en ese navegador.
   Contiene un permiso privado de solo alta, sin correo ni contraseña. En HTTP
   Request Shortcuts > Importar/exportar > Importar desde archivo, elegirlo y
   fusionar con los existentes. No reemplazar/borrar otros atajos.
3. Permitir notificaciones. Si ofrece Direct Share en «Trigger & Execution
   Settings», activarlo para Guardar en Planes (no se importa como preferencia
   del dispositivo). Se puede compartir mediante «Send to…» / HTTP Shortcuts.
4. Compartir un enlace y elegir Guardar en Planes de HTTP Shortcuts; el destino
   PWA llamado Planes sigue abriendo la app. Comprobar aviso de éxito/error y
   llegada real de la ficha manteniendo el navegador de origen en primer plano.
5. Eliminar el ZIP de Descargas después de importar. No enviarlo, subirlo al
   editor web remoto ni conservarlo en Git. Descargar de nuevo mientras el
   permiso está visible lo reutiliza. Cerrar Ajustes borra la copia temporal de
   memoria: otra creación revoca el permiso anterior de ESA cuenta.

Implementación android-shortcut.js: archivo ZIP de dos entradas (config JSON
v90 e icono original), POST HTTPS /api/share, JSON seguro desde un único enlace
compartido incluso si incluye título, timeout 120 s. Variables secretas fuera
de historial/reexportación, scripts success/failure vacíos, UI notification,
waitForInternet false: condiciones oficiales para headless. No se promete
fiabilidad sin probar ese Android; el fabricante/ahorro de batería puede limitar
el proceso. Sin red o ante timeout se avisa, no hay cola offline automática.
Puede tardar por Render Free. Si no aparece el aviso no dar por guardado.
126 unitarias y Edge descarga/permiso/PWA/Android PWA/iPhone verificados con
backend sintético. No se ha importado ni probado este atajo en el móvil aún.

Fuentes: https://http-shortcuts.rmy.ch/advanced,
https://http-shortcuts.rmy.ch/import-export,
https://http-shortcuts.rmy.ch/scripting y código oficial
https://github.com/Waboodoo/HTTP-Shortcuts (schema de importación y ZIP).

Publicación 1489168 verificada por HTTPS el 14/11/2026: módulo idéntico al local
y botón Android disponible. Servidor local de este proyecto también actualizado.
