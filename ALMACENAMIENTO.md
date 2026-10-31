# Imágenes, borrados y almacenamiento

Estado del 31/10/2026.

## Imágenes que descarga la aplicación

Los 20 recursos gráficos de la interfaz sumaban 2 191 439 bytes y ahora suman
1 336 313 bytes: un 39 % menos. Se mantienen las dimensiones y la transparencia
de las escenas, el encuadre y las opacidades del calendario.

- Fondos mensuales: WebP recomprimido a calidad 68.
- Logo, retratos y portadas: WebP a calidad 78. Se mantienen sus URLs .jpg por
  compatibilidad, pero server.cjs responde con el WebP y MIME image/webp.
  Los JPG originales siguen como referencias del repositorio, sin descargarse
  desde esas rutas en la versión actual ni incluirse en Docker.
- Iconos: PNG de 192/512 px y paleta de 256 colores, compatible con instalación.
- La PWA reutiliza primero imágenes de su caché versionada. Una actualización
  de recursos cambia el hash de la caché. No se usa esta caché para API, sesiones
  ni fotos privadas de las fichas; las versiones antiguas de caché se retiran
  al activarse la nueva versión.

Nuevas fotos añadidas como archivo: WebP, con alternativa JPEG si el navegador
no puede codificar WebP. Lado mayor hasta 640 px, máximo 60 000 caracteres de
data URL. Se siguen leyendo las fotos antiguas de hasta 120 000 caracteres.
No se han recomprimido en bloque fotos de fichas ya guardadas. Desde el extractor
17, las imágenes públicas recuperadas de Maps e Instagram se copian como WebP
de hasta 480 px y 45 000 caracteres, dentro de la ficha. Ver FOTOS-ENLACES.md.
Las demás imágenes externas siguen dependiendo del servidor de origen.

## Qué sucede al borrar o caducar una ficha

1. Desaparece de la colección principal del navegador. La foto integrada en la
   ficha deja de estar en esa colección. Ocultar una ficha no equivale a borrarla.
2. Al sincronizar el borrado con esta versión, el contenido remoto se sustituye
   por un payload mínimo: id, kind, título genérico y lista de adjuntos vacía.
   No conserva título original, notas, imagen integrada ni metadatos de adjuntos.
3. Permanecen id, revisión y deleted_at. Son una pequeña marca para impedir que
   otro navegador desconectado vuelva a subir la ficha como si fuera nueva.
   No eliminar estas marcas sin diseñar un protocolo compatible con desconectados.
4. La base de sincronización del navegador adopta esa marca al sincronizarse.
   Sin conexión o ante errores, puede conservar contenido anterior hasta lograrlo.

Este comportamiento se aplica a **nuevos borrados**, también los generados por
caducidad de planes. No se ha realizado una purga de borrados anteriores.
Los clientes antiguos deben actualizarse para escribir marcas mínimas.

## Lo que aún puede ocupar espacio

- Las filas borradas antiguas pueden conservar su payload completo.
- Los documentos del bucket privado planes-documents no se purgan automáticamente.
  Se deduplican por SHA-256 y podrían ser compartidos por varias fichas.
- Papelera y caducidad solicitan eliminar adjuntos locales sin otras referencias;
  un fallo o un borrado recibido desde otro navegador puede dejar caché local
  huérfana. Todavía no hay un recolector general de IndexedDB.
- El navegador puede conservar temporalmente imágenes externas en su propia
  caché HTTP. Las copias exportadas a archivos o Drive no se eliminan solas.

Pendiente: recolector local y remoto de adjuntos y compactación de borrados
antiguos, con comprobación de referencias, conflictos, otros navegadores y
operaciones en curso. No borrar todo el bucket ni purgar marcas para liberar
espacio. Esta actualización no modifica RLS ni ejecuta migraciones o limpiezas
sobre datos reales.

## Verificación

91 pruebas unitarias, incluidas eliminación del contenido pesado de la marca,
conflicto con edición sin conexión y reintento tras perder la respuesta del borrado.
Pruebas Edge aisladas: editor/fotos WebP, PWA sin conexión y sin nuevas descargas
de imágenes, sincronización con adjunto entre dos navegadores, calendario y retratos.
