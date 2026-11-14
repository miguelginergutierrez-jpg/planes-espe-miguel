importScripts('/share-input.js');
'use strict';
const CACHE='planes-shell-__SHELL_VERSION__';
const SHELL=['/','/index.html','/calm.css','/event-data.js','/culture-data.js','/cinema-data.js','/classifier.js','/documents.js','/cloud-migrate.js','/cloud-sync.js','/cloud-session.js','/cloud-controller.js','/cloud-connect.js','/share-input.js','/checklists.js','/lists-controller.js','/lists-ui.js','/food-types.js','/card-fields.js','/app.js','/pwa.js','/manifest.webmanifest','/logo-espe-miguel.jpg','/icon-192.png','/icon-512.png','/cover-miguel-v3.jpg','/cover-espe-v3.jpg','/cover-visits-v3.jpg','/calendar-month-01.webp','/calendar-month-02.webp','/calendar-month-03.webp','/calendar-month-04.webp','/calendar-month-05.webp','/calendar-month-06.webp','/calendar-month-07.webp','/calendar-month-08.webp','/calendar-month-09.webp','/calendar-month-10.webp','/calendar-month-11.webp','/calendar-month-12.webp','/portrait-miguel-v3.jpg','/portrait-espe-v3.jpg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('planes-shell-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);
 if(u.origin===self.location.origin&&u.pathname==='/share-target'&&e.request.method==='POST'){
  e.respondWith((async()=>{try{const origin=e.request.headers.get('origin');if(e.request.headers.get('sec-fetch-site')==='cross-site'||origin&&origin!=='null'&&origin!==self.location.origin)return new Response('Origen no permitido',{status:403});if(!(e.request.headers.get('content-type')||'').startsWith('application/x-www-form-urlencoded'))return new Response('Comparte un enlace web',{status:415});const body=await e.request.text();if(body.length>12000)return new Response('Enlace demasiado largo',{status:413});const url=SharedLink.android(Object.fromEntries(new URLSearchParams(body)));const id=crypto.randomUUID();await SharedLink.intent('put',id,url);return Response.redirect(self.location.origin+'/#android-intent='+id,303)}catch{return new Response('Comparte un solo enlace web cada vez.',{status:400})}})());return;
 }
 if(e.request.method!=='GET'||u.origin!==self.location.origin||!SHELL.includes(u.pathname))return;
 // Artwork belongs to this versioned shell: reuse it until a new version installs.
 if(/\.(?:jpg|png|webp)$/.test(u.pathname)){
  e.respondWith(caches.open(CACHE).then(async cache=>{
   const cached=await cache.match(e.request);if(cached)return cached;
   const response=await fetch(e.request);if(response.ok)await cache.put(e.request,response.clone());return response;
  }));return;
 }
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(u.pathname,copy)))}return r}).catch(()=>caches.match(u.pathname).then(r=>r||Response.error())));
});
