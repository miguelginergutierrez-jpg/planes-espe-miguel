'use strict';
const {classify}=require('./classifier.js');
function postURL(raw){try{const u=new URL(raw);if(!['instagram.com','www.instagram.com','m.instagram.com'].includes(u.hostname)||u.username||u.password||u.protocol!=='https:'||u.port&&u.port!=='443')return '';if(u.pathname.startsWith('/share/'))return '';const p=u.pathname.match(/^\/(?:[a-zA-Z0-9._]{1,30}\/)?(p|reel|tv)\/([\w-]{3,80})(?:\/|$)/);return p?'https://www.instagram.com/'+p[1]+'/'+p[2]+'/':''}catch{return ''}}
function shareURL(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['instagram.com','www.instagram.com'].includes(u.hostname)&&/^\/share\/(?:p|reel)\/[\w-]{3,100}\/?$/.test(u.pathname)?u.origin+u.pathname:''}catch{return ''}}
const isInstagramLink=raw=>!!(postURL(raw)||shareURL(raw));
const visible=html=>String(html||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):''});
function attributes(tag){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=decode(m[2]??m[3]);return a;}
function media(page,target){
 const canonical=postURL(target),code=canonical?.split('/')[4];if(!canonical||!postURL(page.url)||postURL(page.url)!==canonical)return [];
 const html=page.html||'';
 if(/(?:this account is private|esta cuenta es privada|content (?:isn't|is not) available|contenido no est[aá] disponible|challenge_required|checkpoint_required)/i.test(visible(html)))return [];
 const metas={};for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a=attributes(tag);metas[a.property||a.name]=a.content||'';}
 if(metas['og:url']&&postURL(metas['og:url'])!==canonical)return [];
 const found=[];
 function add(value){if(typeof value!=='string')return;try{const u=new URL(decode(value));if(u.protocol!=='https:'||u.username||u.password||!/^(?:[^.]+\.)*(?:cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(u.hostname)||/^static[.-]/.test(u.hostname)||/profile_pic|avatar|rsrc\.php|(?:^|[\/_-])(?:logo|icon|sprite|placeholder)(?:[\/_-]|\.)|s150x150/i.test(u.pathname))return;if(!found.includes(u.href))found.push(u.href)}catch{}}
 add(metas['og:image:secure_url']||metas['og:image']);add(metas['twitter:image']);
 let count=0;function walk(value,depth=0){if(!value||typeof value!=='object'||depth>18||++count>12000)return;if(value.shortcode===code||value.code===code){add(value.display_url);add(value.thumbnail_src);for(const x of value.image_versions2?.candidates||[])add(x.url);for(const x of value.edge_sidecar_to_children?.edges||[])add(x.node?.display_url);}for(const x of Object.values(value))walk(x,depth+1);}
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){let raw=m[1].trim();if(raw.startsWith('window._sharedData'))raw=raw.replace(/^window\._sharedData\s*=\s*/,'').replace(/;\s*$/,'');if(!raw.startsWith('{')&&!raw.startsWith('['))continue;try{walk(JSON.parse(raw))}catch{}}
 return found.slice(0,3);
}
async function readInstagram(url,{readPage,renderPage,signal=AbortSignal.timeout(24000)}={}){
 let target=postURL(url);const empty={...classify(url),url,analysisUrl:url,analysisVersion:'17',aiStatus:'not-used',image:'',needsReview:true};if(!target&&!shareURL(url))return empty;
 let page;try{page=await readPage(target||shareURL(url),{signal});if(!target)target=postURL(page.url)}catch{return {...empty,notice:'Instagram no permite leer esta publicación públicamente. Puedes añadir una foto o captura desde la ficha.'}}
 if(!target)return {...empty,notice:'El enlace compartido no muestra una publicación pública de Instagram. Puedes añadir una foto o captura desde la ficha.'};
 let images=media(page,target);
 const blocked=!postURL(page.url)||/challenge_required|checkpoint_required|this account is private|esta cuenta es privada|<(?:h1|h2)[^>]*>\s*(?:log in to instagram|inicia sesi[oó]n en instagram)/i.test(visible(page.html));
 if(!images.length&&!blocked){
  try{const embedded=await readPage(target+'embed/',{signal});const candidates=media(embedded,target);if(candidates.length){page=embedded;images=candidates}}catch{}
 }
 if(!images.length&&!blocked&&renderPage&&!signal.aborted){try{const rendered=await renderPage(target,{signal});const candidates=media(rendered,target);if(candidates.length){page=rendered;images=candidates}}catch{}}
 const info=postURL(page.url)===target?classify(target,page.html):empty;
 return {...info,url,analysisUrl:url,analysisVersion:'17',aiStatus:'not-used',summarySource:'extract',image:images[0]||'',imageCandidates:images,needsReview:!images.length||info.kind==='inbox',notice:!images.length?'Instagram no publica una foto accesible de esta publicación. Puedes añadir una foto o captura desde la ficha.':info.kind==='inbox'?'Revisa en qué sección quieres guardar la publicación.':'',verification:{checkedAt:new Date().toISOString(),status:'review',sources:[target],issues:!images.length?[{field:'image',reason:'Foto no accesible sin iniciar sesión.'}]:[]}};
}
module.exports={postURL,isInstagramLink,media,readInstagram};
