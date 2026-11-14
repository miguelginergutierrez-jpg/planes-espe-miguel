# Compartir desde Android — estado real 14/11/2026

El usuario confirma instalado y funcionando «Guardar planes» con el logo de la
pareja, creado mediante HTTP Request Shortcuts > Install as App. Guarda enlaces
sin traer Planes al primer plano. Cuenta propia de Espe autorizada en slot 2,
login y sincronización confirmados. No repetir migraciones, autorización o login.

## Uso habitual

En Chrome, Maps u otra app: Compartir > Guardar planes. HTTP Request Shortcuts
y el atajo interno deben seguir instalados: el APK personalizado los utiliza.
Planes sigue siendo la aplicación para consultar y editar la colección.
No hay permisos nuevos de Supabase, coste añadido ni cambios al atajo iPhone.
Render Free puede tardar al despertar y un timeout no confirma guardado. Sin
Internet se muestra error; este atajo no tiene cola offline automática.

## Retirada de opciones anteriores, solicitada por el usuario

- Se retira share_target del manifiesto de Planes, manteniendo id, nombre,
  iconos y demás propiedades. La aplicación principal conserva su instalación,
  sesión, datos y PWA. La antigua entrada de compartir desaparece cuando Chrome
  actualiza la WebAPK, lo cual puede tardar 1–2 días. PWA cerrada, Wi-Fi y carga
  favorecen la actualización según Chrome. No reinstalar ni borrar datos.
- Se conservan rutas y cola de recepción antiguas por compatibilidad con las
  WebAPK aún no actualizadas y capturas en curso. No se borran sus pendientes.
- Para quitar la sugerencia dinámica de HTTP del móvil ya configurado: mantener
  pulsado el atajo interno > Editar > Ajustes de activación y ejecución >
  desmarcar «Mostrar como acceso directo a aplicación en el launcher» > Guardar.
  No borrar el atajo ni cambiar su variable compartida o permiso. Guardar planes
  instalado invoca el ID del atajo directamente y no depende de esa casilla.
- Las descargas nuevas ya incluyen launcherShortcut false. No hace falta descargar
  ni importar otro ZIP en el móvil funcional ni revocar su permiso.
- El receptor genérico HTTP / Enviar a… puede seguir visible. No existe interruptor
  oficial hallado para ocultarlo manteniendo la herramienta: no afirmar que ya
  está eliminado ni desinstalar HTTP para intentarlo.

## Cierre pendiente en el teléfono

Desactivar «Permitir desde esta fuente» de Archivos, activado temporalmente para
instalar el APK. Eliminar de Descargas el ZIP privado tras importarlo; contiene
el permiso de alta. Estos pasos y la retirada física de sugerencias aún no han
sido confirmados por el usuario. No podemos operar el Android desde este PC.

## Configuración inicial, ya completada en el móvil de Espe

1. En Planes con la cuenta correcta: Ajustes > Guardar enlaces sin abrir la app >
   Preparar atajo Android. Confirmar creación del permiso de ESA cuenta.
2. Importar guardar-en-planes-android.zip desde Descargas en HTTP Request Shortcuts
   mediante Importar/exportar > Importar desde archivo, combinando con existentes.
   El ZIP se genera en el navegador y contiene secreto privado; no subirlo al
   editor web remoto, Git o chat. Una descarga repetida con permiso visible lo
   reutiliza; otra creación revoca el permiso anterior solo de esa cuenta.
3. Permitir notificaciones. El atajo recibe texto con un único enlace, hace POST
   HTTPS /api/share y avisa del resultado sin abrir Planes.
4. Mantener pulsado el atajo > Install as App. Guardar APK en Descargas y abrirlo
   con Archivos para instalarlo. Puede requerir permitir esa fuente temporalmente;
   desactivar el permiso tras instalar. No basta con guardar el APK en Descargas.
5. Probar Compartir > Guardar planes y llegada de la ficha sin salir del navegador.
   No regenerar el permiso en el iPhone de Miguel: es independiente por cuenta.

## Implementación y comprobaciones

android-shortcut.js crea ZIP local con config JSON v90 e icono PNG original.
Variables secretas excluidas de historial/reexportación; timeout 120 s, scripts
success/failure vacíos, UI notification y waitForInternet false. El APK de la
herramienta se genera localmente con nombre, icono e ID del atajo, sin claves
nuevas ni otro servidor. Se conservan POST /api/share y sus permisos de solo alta.
Tras la retirada pasan 126 unitarias y Edge permiso/descarga, PWA sin red,
Android anterior compatible e iPhone con backend sintético. Manifiesto comparado
con el anterior: solo retira share_target, sin cambiar identidad o instalación.
No se han modificado fichas reales para probar.

Fuentes oficiales:
- https://http-shortcuts.rmy.ch/advanced#install-shortcuts-as-apps
- https://http-shortcuts.rmy.ch/import-export
- https://github.com/Waboodoo/HTTP-Shortcuts
- https://web.dev/articles/manifest-updates#updates_on_chrome_for_android
