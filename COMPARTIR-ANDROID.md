# Compartir enlaces desde Android

Publicado el 14/11/2026: manifiesto share_target verificado en Render. Usuario
confirma cuenta de Espe creada y SQL «Segundo acceso preparado» (slot 2).
Usuario confirma login y estado «Sincronizado» en Android. Pendientes
instalación y prueba física de Compartir; no confundir con Edge.

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
También pasan flujo iPhone anterior y PWA sin red. Android físico pendiente.
Fuente primaria: https://developer.chrome.com/docs/capabilities/web-apis/web-share-target
