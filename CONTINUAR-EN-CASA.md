# Continuar desde el ordenador de casa

Estado comprobado el 30 de octubre de 2026. No necesitas el móvil Android todavía.

La rama activa es `codex/publicacion-movil`, en el commit `c0b21e2`.
La sincronización, PWA, atajo de iPhone y despliegue gratuito ya están
implementados; las notas históricas que indiquen lo contrario quedan
superadas por `AGENTS.md`.

## 1. Recuperar el proyecto

En casa instala GitHub Desktop, Node.js **24.x** (incluye npm) y la aplicación
de escritorio con Codex. Usa tus cuentas habituales.

En GitHub Desktop elige **File → Clone repository**, selecciona
`miguelginergutierrez-jpg/planes-espe-miguel` y elige una carpeta local.
Si ya lo habías clonado, selecciona ese repositorio y pulsa **Fetch origin** y
después **Pull origin**. Si tienes cambios locales, consérvalos antes de actualizar.
No necesitas que la ruta de casa coincida con la de este ordenador.

Alternativa por terminal:

```powershell
git clone https://github.com/miguelginergutierrez-jpg/planes-espe-miguel.git
cd planes-espe-miguel
```

## 2. Instalar y arrancar

Abre una terminal en la carpeta del proyecto y ejecuta:

```powershell
node --version
npm.cmd install
npm.cmd test
npm.cmd start
```

El primer comando debe mostrar `v24...`. Abre http://localhost:4173/ y mantén
la terminal encendida. Para siguientes arranques puedes hacer doble clic en
`ABRIR-APP.cmd`. Si aparece «conexión rechazada», comprueba que está arrancado.

Playwright y el lector PDF se instalan mediante `package.json`, con versiones
directas fijadas a las usadas aquí. En este PC solo estaba el runtime Node de
Codex, sin npm: la instalación limpia con npm debe comprobarse en casa.
Si no tienes Microsoft Edge, instala Chromium para el lector dinámico:

```powershell
npx.cmd playwright install chromium
```

Las pruebas móviles actuales usan Edge. En Windows conviene tener Edge instalado.
Para probar la copia a nube sin tocar datos reales: `npm.cmd run test:cloud`.

## 3. Retomar el desarrollo en Codex

Añade/abre la carpeta clonada como proyecto local en Codex. Si este chat no
aparece, crea uno nuevo **dentro de ese proyecto** y pega:

> Continúa el proyecto Planes Espe & Miguel. Lee primero AGENTS.md,
> CONTINUAR-EN-CASA.md y supabase/README.md, revisa git status y comprueba el
> arranque y las pruebas. Ya se creó Supabase, se ejecutó la migración 001, se
> autorizó mi cuenta y se verificó una copia real de una ficha de prueba sin
> adjuntos. No repitas esos pasos. Los datos actuales son pruebas y no necesito
> recuperar más fichas, pero no los borres sin motivo. El siguiente desarrollo
> es la sincronización automática privada: sesión con renovación, cambios y
> borrados compartidos, conflictos y documentos. Todavía no hay sincronización,
> PWA ni despliegue. Quiero 0 € mensuales, iPhone para mí y Android para Esperanza;
> su Android se probará más adelante. Guíame paso a paso, no soy técnico. No pidas
> contraseñas ni claves secretas en el chat. Primero deja funcionando este PC.

## 4. La conversación y los archivos son cosas distintas

GitHub transporta el código y los documentos de contexto, no el historial de
este chat. Estar en la misma cuenta no asegura que un chat local de Codex
aparezca en el historial de ChatGPT/Work del otro equipo. Comprueba la sección
Codex, la cuenta y el espacio de trabajo; si no aparece, usa el mensaje anterior.

La documentación oficial distingue conversaciones, proyectos locales y acceso
a archivos. Los chats existentes pueden seguir siendo locales; no se ha
verificado una transferencia automática de este chat exacto. No hemos exportado
el historial completo ni creado un enlace público para él. No copies toda la
carpeta `.codex` a GitHub: puede contener sesiones y credenciales.

Referencia consultada: https://learn.chatgpt.com/docs/projects

## 5. Datos y acceso a Supabase

- El proyecto de Supabase ya está en la nube: no se vuelve a crear en casa.
- La configuración **pública** está en `supabase-public.json`; no es una clave
  administrativa. Inicia sesión en la app con tu correo/contraseña de la app.
- La sesión de este PC no se transfiere. No envíes la contraseña al nuevo chat.
- La copia real confirmada contenía **1 ficha y 0 documentos**. Son pruebas.
- El navegador de casa puede aparecer vacío: hoy la app NO descarga aún la
  colección remota automáticamente. Esto no significa que se hayan perdido datos.
- Si quieres recuperar las pruebas locales, descarga de Drive la copia JSON y
  usa Ajustes → Importar copia. La copia de Drive puede ser anterior a la subida
  a Supabase. No hace falta recuperarla para seguir desarrollando.
- No vuelvas a ejecutar `001_shared_space.sql`: ya está aplicada. No vuelvas a
  crear la misma cuenta ni a copiar fichas cambiadas sobre la nube sin revisar.
- El logo y archivos de la aplicación viajan con GitHub. Los adjuntos personales,
  claves y configuración de sesión no van al repositorio.

## 6. Trabajar después desde ambos ordenadores

Antes de empezar: Fetch/Pull. Al terminar: revisar cambios, Commit y Push.
Actualizar AGENTS.md cuando cambien decisiones o estado. No editar simultáneamente
la misma rama en ambos equipos sin actualizar. Nunca usar `reset --hard` para
resolver diferencias sin revisar el trabajo local.

GitHub todavía NO despliega la app en los móviles. Esa conexión se hará después
de implementar y probar la sincronización. El ordenador original no necesita
seguir encendido para que desarrolles en casa con el clon local.

## Verificación del PC de casa — 28/10/2026

- Windows 11 (compilación 26200). Código recuperado desde origin/main, commit 59f6ae3; carpeta inicialmente sin archivos de trabajo ni commits locales.
- Node 24.22.1 y npm 11.19.1 instalados en C:\Program Files\nodejs. La terminal de Codex no incluía npm en PATH; se usó la ruta instalada. Fuera de Codex, abrir una terminal nueva si no reconoce npm.cmd.
- Instalación npm y reinstalación npm ci verificadas. Conservar package-lock.json (v3, URLs del registro npm e integridades). Para próximas instalaciones usar npm.cmd ci.
- pdfjs-dist actualizado de 5.6.205 a 6.4.299 por GHSA-hq66-cqwq-w95j; npm informa cero vulnerabilidades. Extracción de texto de PDF sintético comprobada con el lector real.
- Pasan 43 pruebas unitarias y las baterías browser-cloud, browser-v15 y browser-maps. Edge instalado; lector dinámico real comprobado con contenido JavaScript sintético. Las pruebas de nube siguen simuladas.
- El aislamiento de Codex impide acceso normal al servidor y arranque de Edge: ejecutar el servidor y las pruebas con el permiso correspondiente fuera de ese aislamiento. No es un fallo de la app ni requiere modificar su seguridad.
- GET /api/status: configured=false. No hay IA activa. Supabase /auth/v1/settings: HTTP 200 con la configuración pública. Pendiente verificar en este navegador la cuenta real desde Ajustes; no repetir migración, autorización ni copia inicial.
- git push --dry-run origin main completado correctamente. Identidad Git configurada. No se trasladaron sesiones del PC anterior.
- Próximo arranque: doble clic en ABRIR-APP.cmd, mantener la ventana abierta y abrir http://localhost:4173/. La colección del nuevo navegador puede estar vacía.

### Apertura sencilla desde el Escritorio

En este equipo se prepara un acceso directo «Planes Espe y Miguel» en el Escritorio. Abre el navegador y arranca el servidor en segundo plano si hace falta. No requiere mantener una terminal visible. El servidor se detiene al apagar/reiniciar Windows; el siguiente doble clic vuelve a arrancarlo. Los archivos ABRIR-APP.cmd y ABRIR-APP.ps1 permiten lo mismo desde la carpeta del proyecto. El acceso directo es local a este PC.

El usuario confirmó en la interfaz «Conexión verificada» en el navegador de casa: acceso real a Supabase comprobado, sin repetir migración ni copia inicial.

## Continuación: sincronización privada (preparada, pendiente de activar)

Se ha desarrollado en codex/sincronizacion-privada. Seguir el estado actual al
principio de supabase/README.md. Falta entrar al panel del proyecto existente para
aplicar solo 002_sync_deletions.sql y después verificar la sincronización real.
No se necesita el ordenador anterior. No repetir 001 ni la copia inicial.
