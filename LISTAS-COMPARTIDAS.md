# Listas compartidas

Actualizado el 31/10/2026. Acceso desde Listas, a la derecha de Casa.

## Uso

Pulsa +, escribe el título y los puntos. Enter añade otro punto; también puedes
pegar varias líneas. Cada casilla marca/tacha el punto. Guardar conserva título
y texto y cierra/libera la lista. Las casillas de puntos ya guardados se comparten
al tocarlas; las de puntos nuevos se guardan con Guardar. Borrar lista pide
confirmación. También hay una papelera a la derecha de cada tarjeta, para borrar
sin abrir la ficha. Respeta el acceso exclusivo y no borra si la usa amorcito.
Hasta 500 puntos de 2 000 caracteres y títulos de 160 caracteres.

## Solo una persona editando

La apertura solicita un bloqueo privado en Supabase. Si otra persona lo tiene,
no abre el editor y muestra «Lista en uso por amorcito». La solicitud avisa al
editor activo: «Amorcito quiere acceder a la lista». Comprobación cada 10 segundos
al estar visible. Guardar o salir libera el acceso. No hay bloqueo entre listas
distintas, perfiles nuevos ni notificaciones del sistema operativo.

El bloqueo dura 45 segundos y se renueva cada 10 mientras la app está visible.
Si la pestaña se cierra o el móvil deja de responder, caduca solo. Un Web Lock
evita además abrir dos editores de la misma lista en pestañas del mismo navegador.

La exclusión también se valida en el servidor en cada escritura, no solo con
un aviso visual. No hay permisos de escritura directa a las tablas desde la app.
Si se pierde conexión/acceso, queda en solo lectura y el borrador se conserva
en ese navegador. Recuperar acceso vuelve a comprobar el estado remoto. Si la
otra persona guardó cambios durante la pérdida de acceso, el borrador puede
guardarse como otra lista; no pisa su trabajo ni presenta un panel de fusiones.
No es edición colaborativa de caracteres ni edición compartida sin conexión.

## Datos y privacidad

004_shared_lists.sql aplicada en el proyecto existente el 31/10/2026, con
resultado Success. No repetir 001/002/003 ni 004. Tablas nuevas planes_lists y
planes_list_locks; mismas dos membresías ya autorizadas, sin alterar planes_items,
RLS de fichas, miembros, documentos ni permisos de Atajos. No crea cuentas ni claves.
RLS en ambas tablas. Lectura de listas solo a miembros, locks no legibles por
clientes. RPC planes_lists_access/save con SECURITY DEFINER, search_path vacío
y validación de auth.uid/membresía, lease, revisión y contenido en el servidor.

Borrado: conserva id/revisión/marca y payload mínimo sin título ni puntos anteriores.
Los bloqueos contienen solo identificadores técnicos y vencimiento. No se purgan
marcas ni se añade recolector. Los borradores locales se eliminan tras guardar o
al confirmar salir sin guardar. Cerrar el navegador inesperadamente los conserva.
Almacenamiento nuevo: planes-lists-v1, planes-lists-drafts-v1; no cambia las claves
de fichas ni el sincronizador anterior. planes-list-editor en sessionStorage conserva
la identidad técnica de pestaña; no contiene contraseña ni correo.

Copias: versión 3 incorpora listas y mantiene fichas/documentos. Importa las
versiones 1/2 anteriores sin tocar listas. Una lista ocupada bloquea su importación;
el fichero de copia se conserva y puede reintentarse. Si fichas se importaron y
listas fallaron, se indica explícitamente; no se afirma una importación completa.
La importación actualiza cada lista con acceso exclusivo y validación de revisión.

## Verificación

121 pruebas unitarias (incluido PostgreSQL real en memoria), navegador Edge con
dos cuentas sintéticas: exclusión, aviso de solicitud, casillas automáticas,
caducidad, borrador sin sobrescribir, cinco pestañas a 320/390/768/1100 px, copias
3/2 y apertura de la colección en caché sin red. No se crean listas de prueba
en Supabase ni se modifica la colección real. Lectura de permisos del proyecto:
RLS true/true, acceso anónimo false, escritura directa false, lectura locks false,
listas 0 tras activar. La edición simultánea real con el móvil de Esperanza
continúa pendiente; las pruebas de dos cuentas se realizaron en PostgreSQL aislado.

Para repetir las pruebas SQL sin añadir dependencias a la app:

    npm.cmd install --prefix test-results/sql-runtime --no-save --package-lock=false @electric-sql/pglite@0.5.14
    node --test tests/lists-sql.test.cjs
    node tests/browser-lists.cjs

El runtime queda ignorado en test-results. Sin él, npm test marca la prueba SQL
como omitida; en este equipo se ha ejecutado y pasado. No hay nuevos servicios,
planes de pago ni claves de IA.

Comprobación final en la app local con sesión real: Listas muestra «Listas
compartidas al día», vacía. Solo lectura; no se ha creado una lista real.
