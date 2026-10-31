'use strict';
// Public pages and raster photos use the same DNS-pinned reader as link capture.
async function resolveImage(url,{copyImage=require('./image-reader.cjs').copyImage,readPage=require('./public-reader.cjs').readPage,inspect=require('./preview.cjs').inspect,signal=AbortSignal.timeout(40000)}={}){
 const u=new URL(url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error('Usa un enlace público de imagen o de la página que la contiene.');
 if(require('./instagram-reader.cjs').isInstagramLink(url)||require('./maps-reader.cjs').isMaps(url)){const info=await inspect(url);if(/^data:image\/(?:webp|png|jpeg);base64,/.test(info.image||''))return info.image;if(info.image)return copyImage(info.image,{signal});throw Error('La página no ofrece una foto pública accesible. Elige una foto o pega una captura.')}
 const wikiFile=/\/wiki\/(?:File|Archivo|Fichero|Fitxer|Datei|Fichier):/i.test(u.pathname);
 if(!wikiFile)try{return await copyImage(url,{signal})}catch(error){if(signal.aborted)throw error}
 const page=await readPage(url,{signal}),html=page.html||'',candidates=[];
 if(wikiFile){const full=html.match(/<div\b[^>]*class=["'][^"']*\bfullImageLink\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1]||'';candidates.push(full.match(/<img\b[^>]*src=["']([^"']+)/i)?.[1],full.match(/<a\b[^>]*href=["']([^"']+)/i)?.[1])}
 candidates.push(require('./classifier.js').classify(page.url,html).image);
 for(const value of [...new Set(candidates.filter(Boolean))].slice(0,3)){try{const target=new URL(value.replace(/&amp;/g,'&'),page.url);if(!['http:','https:'].includes(target.protocol)||target.username||target.password)continue;return await copyImage(target.href,{signal})}catch(error){if(signal.aborted)throw error}}
 throw Error('No se encontró una foto pública que se pueda cargar. Prueba con la dirección de la imagen o elige una foto.');
}
module.exports={resolveImage};
