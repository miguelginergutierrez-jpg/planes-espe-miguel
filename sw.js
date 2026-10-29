'use strict';
const CACHE='planes-shell-__SHELL_VERSION__';
const SHELL=['/','/index.html','/calm.css','/event-data.js','/culture-data.js','/cinema-data.js','/classifier.js','/documents.js','/cloud-migrate.js','/cloud-sync.js','/cloud-session.js','/cloud-controller.js','/cloud-connect.js','/share-input.js','/card-fields.js','/app.js','/pwa.js','/manifest.webmanifest','/logo-espe-miguel.jpg','/icon-192.png','/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('planes-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(e.request.method!=='GET'||u.origin!==self.location.origin||!SHELL.includes(u.pathname))return;
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(u.pathname,copy)))}return r}).catch(()=>caches.match(u.pathname).then(r=>r||Response.error())));
});
