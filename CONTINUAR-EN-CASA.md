# Continuar desde el otro PC

Estado actualizado el **14 de noviembre de 2026**. Lee primero el estado más
reciente de `AGENTS.md`; sus notas nuevas prevalecen sobre el historial antiguo.

El código y la documentación están en
https://github.com/miguelginergutierrez-jpg/planes-espe-miguel. La rama de esta
sesión es **`codex/publicacion-movil`**. Recupera su último commit, no vuelvas a
`59f6ae3` ni a otra versión histórica para preparar el equipo.

## Qué está funcionando

- App publicada en https://planes-espe-miguel.onrender.com, con despliegue
  automático de esa rama en el servicio Render Free existente. El PC de
  desarrollo puede estar apagado para usar la web publicada.
- Sincronización privada implementada con Supabase: sesión renovable, fichas,
  borrados, adjuntos y revisión de cambios simultáneos. Las cuentas de Miguel y
  Espe ya están autorizadas. Las migraciones **001, 002, 003 y 004 ya están
  aplicadas**; no repetirlas ni recrear cuentas o permisos.
- iPhone confirmado por el usuario, incluido el atajo para guardar enlaces sin
  abrir la app. Android de Espe también confirmado: app con logo, sincronización
  y **Guardar planes** para compartir sin abrir Planes. Mantener HTTP Request
  Shortcuts y su atajo interno, de los que depende ese acceso.
- Listas compartidas con acceso exclusivo de una persona, filtros de comida,
  imágenes por URL y las mejoras de agenda y de interfaz descritas en las guías.

Se ha retirado del manifiesto únicamente la primera opción antigua de Compartir
de Android, llamada Planes, anterior a HTTP. El cambio está publicado; falta
confirmar su desaparición en ese móvil cuando Chrome actualice la WebAPK. Puede
tardar. Conservar la app principal Planes y las entradas de HTTP; no reinstalar
ni borrar datos para acelerar la actualización. Ver `COMPARTIR-ANDROID.md`.

El objetivo sigue siendo 0 € mensuales usando los servicios gratuitos existentes.
Hay cuotas y puede haber arranque lento o suspensión al superarlas; no se promete
disponibilidad inmediata ni gratuidad sin límites. No contratar planes, crear
servicios de pago ni añadir claves de IA. Comprobar `/api/status` antes de afirmar
que la IA está activa.

## 1. Recuperar el código sin perder trabajo

Si el repositorio aún no existe, clónalo en una carpeta vacía. Puedes hacerlo con
GitHub Desktop, eligiendo el repositorio y después la rama
`codex/publicacion-movil`, o con estos comandos:

```powershell
git clone --branch codex/publicacion-movil https://github.com/miguelginergutierrez-jpg/planes-espe-miguel.git
cd planes-espe-miguel
```

Si ya existe, abre esa carpeta y revisa antes de actualizar:

```powershell
git status --short --branch
git remote -v
git branch -vv
git fetch origin
```

El remoto debe corresponder al repositorio anterior. Si hay cambios locales,
commits sin subir o una tarea en otra rama, consérvalos y revisa cómo continuar;
no cambies de rama ni sobrescribas archivos a ciegas. No uses `reset --hard`,
`git clean` ni force push para dejarlo limpio.

Cuando se haya comprobado que no hay otra tarea en curso ni cambios que impidan
actualizar, esta sesión se recupera así:

```powershell
git switch codex/publicacion-movil
git pull --ff-only origin codex/publicacion-movil
```

Si esa rama todavía no existe localmente, después de `fetch` puede crearse con
`git switch --track origin/codex/publicacion-movil`. Si hay divergencias o
conflictos, detener la actualización y examinarlos conservando ambas versiones.
No asumir que `main` contiene el trabajo actual.

## 2. Instalar y arrancar en Windows

Se necesitan Git, **Node.js 24.x** y npm. `package.json` y `package-lock.json`
están versionados; conservar ambos para instalar las versiones acordadas.

Desde la carpeta del proyecto:

```powershell
node --version
npm.cmd --version
npm.cmd ci
npm.cmd test
npm.cmd start
```

Node debe mostrar `v24...`. Si una terminal recién abierta no reconoce npm en
este PC, la instalación comprobada está en `C:\Program Files\nodejs`; no asumir
esa ruta para todos los equipos. `npm ci` utiliza el lockfile existente: no lo
borres ni lo sustituyas por una instalación distinta para resolver un fallo.

Con el servidor arrancado, abre **http://localhost:4173/**. En el arranque por
terminal, mantenla abierta mientras uses la app. No abrir `index.html` como
archivo: la lectura de enlaces necesita el servidor.

Para otros días, haz doble clic en **`ABRIR-APP.cmd`**, dentro de la carpeta del
proyecto. Su lanzador PowerShell arranca el servidor si hace falta y abre el
navegador sin una terminal persistente visible. El acceso directo que se preparó
en el Escritorio es local de cada PC; no viaja con GitHub.

Antes de detener o reiniciar un servidor que ocupe 4173, comprobar que pertenece
a este repositorio. No cerrar un proceso de otro proyecto por compartir el puerto.

## 3. Navegador y comprobaciones

Playwright y el lector PDF se instalan con `npm ci`. El lector dinámico puede
usar Edge instalado en Windows; si no hay navegador disponible, instalar el de
Playwright:

```powershell
npx.cmd playwright install chromium
```

Las baterías actuales de navegador usan Edge. En otro equipo hay que comprobar
que Edge está disponible antes de ejecutarlas. Las pruebas deben usar contextos
aislados y datos sintéticos; no crear ni borrar fichas reales para comprobar la
instalación. Para probar la lógica de sincronización simulada:

```powershell
npm.cmd run test:cloud
```

Consultar `http://localhost:4173/api/status` para distinguir configuración de IA,
autenticación y estado del lector. La disponibilidad de una dependencia no
demuestra por sí sola que se haya ejecutado el navegador dinámico.

En este PC se comprobaron previamente Node 24.22.1, npm 11.19.1, instalación
limpia con `npm ci`, Edge y lectura dinámica sintética. Esas verificaciones no
sustituyen a comprobar el otro equipo. Las pruebas y su resultado de cierre
deben consultarse en la entrada más reciente de `AGENTS.md`.

## 4. Datos, sesiones y publicación

**GitHub transporta código y documentación.** Las fichas, listas y adjuntos se
comparten mediante Supabase, con sus reglas y sincronización propias. El
historial completo de este chat y las sesiones del navegador o de Codex no se
han trasladado mediante Git.

En un navegador nuevo puede ser necesario conectar la cuenta en Ajustes y
activar la sincronización si aún no lo está. Escribir la contraseña solo en la
interfaz de la app; no en el chat. Primero esperar a la conexión y descarga de la
colección compartida. Una pantalla vacía o un error de red no autorizan a
importar una copia antigua, repetir la copia inicial o borrar datos remotos.

`localhost:4173` y la dirección publicada son orígenes distintos: tienen sesión y
almacenamiento propios, aunque accedan a la misma colección autorizada. No se
necesita recuperar sesiones ni credenciales del PC anterior.

`supabase-public.json` solo contiene la configuración pública necesaria. Mantener
fuera de Git contraseñas, tokens de atajos, `.env`, sesiones de Codex, copias de
fichas, adjuntos personales, perfiles de navegador, dependencias y logs. El ZIP
privado del atajo Android tampoco debe subirse.

Al subir cambios de código a la rama vinculada, Render puede desplegarlos
automáticamente. Comprobar el resultado publicado: un push no demuestra por sí
solo un despliegue correcto ni la sincronización de fichas. Los commits solo
documentales usan `[skip render]` para evitar builds innecesarios. Reutilizar el
servicio existente, descrito en `PUBLICACION-MOVIL.md` y `render-deployment.json`.

## 5. Pendientes y mensaje para retomar

El uso normal ya está confirmado en ambos móviles. Queda verificar en el Android
la desaparición de la primera opción antigua de Compartir. No está confirmado
que se hayan hecho dos tareas recomendables de seguridad y limpieza: desactivar
«Permitir desde esta fuente» para Archivos y borrar de Descargas el ZIP del
atajo. No son necesarias para abrir, sincronizar o guardar enlaces, y no se deben
convertir en un bloqueo para usar la app.

También permanecen los límites y mejoras futuras descritos en las guías, como
la limpieza segura de adjuntos huérfanos y la prueba de Listas entre los dos
dispositivos reales. No desarrollar nuevas funciones por iniciativa propia al
preparar el equipo.

Abre la carpeta del proyecto en Codex. Si no tienes el chat anterior, pega:

> Continúa Planes Espe & Miguel desde este PC. Lee AGENTS.md,
> CONTINUAR-EN-CASA.md y las guías vigentes. Revisa carpeta, remoto, rama y git
> status; consulta GitHub y conserva todo trabajo local antes de actualizar.
> La última sesión trabajaba en codex/publicacion-movil; no asumas main si hay
> otra tarea en curso. Instala con Node 24 y npm ci, ejecuta las comprobaciones
> apropiadas y arranca http://localhost:4173/, identificando antes cualquier
> servidor existente. La app está publicada en Render Free, la sincronización
> privada ya funciona y las migraciones 001–004 ya están aplicadas. Las cuentas
> de Miguel y Espe están autorizadas. iPhone y Android Guardar planes con logo
> y envío sin abrir la app están confirmados; conservar HTTP y su atajo. Solo se
> retiró del manifiesto el primer receptor PWA antiguo de Compartir; falta su
> comprobación física al actualizar Chrome. No recrees permisos ni migres o
> borres datos. GitHub comparte código y documentación, no datos de fichas ni
> el historial de Codex. No solicites secretos en el chat y no desarrolles nuevas
> funciones todavía: deja este equipo listo y comunica el estado real.

Antes de empezar trabajo en cualquiera de los PCs: revisar estado, Fetch y
actualizar sin descartar cambios. Al terminar: pruebas apropiadas, documentación,
commit y push de la rama correcta; verificarlo en GitHub. No editar a la vez la
misma rama desde ambos equipos sin recuperar primero los cambios nuevos.
