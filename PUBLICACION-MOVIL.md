# Publicación móvil — estado verificado 14/11/2026

La aplicación está activa en https://planes-espe-miguel.onrender.com y funciona
independientemente de este PC. Reutilizar siempre el servicio existente, cuyos
identificadores están en render-deployment.json; no crear otro ni contratar planes.
La rama vinculada es codex/publicacion-movil, auto-deploy al hacer commit/push.

## Comprobación del cierre

HTTPS /healthz devuelve 200. /api/status devuelve authRequired=true,
configured=false (sin IA activa) y dynamicReader.state=ready. Manifiesto sin
share_target y con la misma identidad /. android-shortcut.js, cloud-connect.js,
index.html, app.js y manifiesto coinciden con los blobs de Git; sw.js coincide
al descontar su identificador de caché generado. Último cambio de ejecución:
251066b; los commits posteriores hasta este cierre solo documentación/verificación.

La API de GitHub no publica estados/checks/despliegues de Render para esa rama.
Un resultado combinado pending con statuses vacío no demuestra un build pendiente.
Sin nuevo acceso al panel/API Render no se ha observado un ID o estado de build
nuevo: lo comprobado es el código actual servido por HTTPS. Los campos
last_dashboard_* de render-deployment.json conservan la comprobación histórica
del 28/10, separada de la verificación externa actual. No inventar un deploy ID.

El commit de cierre usa [skip render]: cambia guías, metadatos de verificación,
exclusiones de exportaciones privadas y, si procede, fixtures de pruebas; no
requiere reemplazar el contenedor que ya sirve el código actual. No confundir
subir este cierre con publicar funcionalidades nuevas o sincronizar datos.

## Móviles y compartir

iPhone instalado y atajo de segundo plano confirmados por el usuario. Espe tiene
su cuenta propia autorizada, app Android instalada, sincronización y receptor
Guardar planes con logo funcionando sin traer Planes al primer plano. Se genera
con HTTP Request Shortcuts > Install as App; la herramienta y su atajo deben
permanecer instalados. No recrear/revocar sus permisos al cambiar de PC.

Se retiró únicamente el receptor PWA antiguo de Compartir (share_target), por
petición del usuario. Planes principal conserva instalación, icono, sesión y
datos. Android puede tardar en actualizar la WebAPK; la desaparición física de
la opción antigua aún no está confirmada. No reinstalar ni borrar datos para
acelerarla. Se conservan /share-target y su cola por compatibilidad. Ver
COMPARTIR-ANDROID.md y COMPARTIR-IPHONE.md para uso y límites.

## Pruebas de este cierre

126/126 unitarias y cinco baterías Edge pasan: PWA, permiso/descarga de atajo,
iPhone, receptor Android antiguo compatible y sincronización entre dos
navegadores. Sintaxis de 77 JS/CJS comprobada. La batería cloud inicialmente
falló por comprobar el conflicto antes de acabar un ciclo activo; se reprodujo
la carrera sintéticamente y se corrigió solo la preparación de esa prueba,
conservando/reforzando las aserciones. Tres ejecuciones corregidas consecutivas
pasan. No se modificó lógica productiva ni datos reales para arreglarlo.

## Servicio y presupuesto

Servicio existente: Render Free, Docker, Frankfurt, My Workspace, health
/healthz. Configuración reproducible en render.yaml y Dockerfile. No se han
creado servicios, añadido tarjetas o cambiado planes durante este cierre.
Objetivo 0 €/mes; las condiciones y cuotas gratuitas pueden cambiar. Los límites
históricos se consultaron el 28/10/2026: el servicio puede dormir tras inactividad
y tardar alrededor de un minuto en despertar. No prometer disponibilidad o coste
cero sin límites; comprobar https://render.com/docs/free al revisar contratación.
Los datos siguen en Supabase, no en el disco efímero de Render.

## Arquitectura y protección

Docker usa Node 24.22.1, npm ci con lockfile, Chromium con bibliotecas y usuario
sin privilegios. COPY es explícito; .dockerignore y .gitignore excluyen .env,
sesiones, dependencias, copias y ZIP/JSON de permisos Android. Nunca incluir
secretos reales en Git, archivos de exportación, logs o imágenes del contenedor.

El servidor remoto exige sesión Supabase verificada y membresía para
/api/inspect y /api/image, además de origen y límites. POST /api/share acepta
únicamente permiso exclusivo de solo alta; no lee ni borra la colección. Los
archivos estáticos no contienen datos de fichas. Supabase conserva RLS y bucket
privado; no repetir las migraciones 001–004 ni cambiar miembros o reglas.

El lector dinámico alojado informa ready tras su prueba sintética de arranque
con sandbox. No desactivar aislamiento o TLS para facilitar una lectura. Las
páginas privadas o bloqueadas no tienen extracción garantizada.

La PWA cachea solo interfaz y arte: no API, sesión, Supabase o documentos
privados. Una actualización no fuerza recarga sobre una edición sin guardar.
Los archivos se sirven desde caché de su versión; colección local/adjuntos usan
sus almacenes propios. La apertura sin red no garantiza extracción ni acceso
a documentos nunca descargados. GitHub, Supabase e historial Codex son mecanismos
separados: ver CONTINUAR-EN-CASA.md para retomar en otro PC.

## Procedimiento habitual de publicación

1. Revisar rama/remoto/estado, conservar trabajo local y actualizar desde GitHub.
2. Comprobar cambios con datos sintéticos y revisar secretos antes de commit.
3. Para cambios de ejecución: commit y push normales a la rama vinculada, esperar
   el auto-deploy y comparar HTTPS/assets/health/status. No crear otro servicio.
4. Para guías o pruebas sin cambios de ejecución: [skip render] evita un build
   innecesario; verificar que la web activa continúa sirviendo el código esperado.
5. Si se requiere el panel de Render, usar el acceso oficial del usuario y no
   pedir contraseñas o tokens por el chat. No hay conector Render expuesto aquí.

Histórico: publicación inicial Docker y estado Live observados el 28/10/2026;
login, ficha y adjunto reales comprobados entonces. Esos datos no se han
modificado para las verificaciones de cierre actuales.
