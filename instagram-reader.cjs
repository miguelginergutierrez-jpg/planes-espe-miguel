'use strict';
const {classify}=require('./classifier.js');
function postURL(raw){try{const u=new URL(raw);if(!['instagram.com','www.instagram.com','m.instagram.com'].includes(u.hostname)||u.username||u.password||u.protocol!=='https:'||u.port&&u.port!=='443')return '';if(u.pathname.startsWith('/share/'))return '';const p=u.pathname.match(/^\/(?:[a-zA-Z0-9._]{1,30}\/)?(p|reel|tv)\/([\w-]{3,80})(?:\/|$)/);return p?'https://www.instagram.com/'+p[1]+'/'+p[2]+'/':''}catch{return ''}}
function shareURL(raw){try{const u=new URL(raw);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['instagram.com','www.instagram.com'].includes(u.hostname)&&/^\/share\/(?:p|reel)\/[\w-]{3,100}\/?$/.test(u.pathname)?u.origin+u.pathname:''}catch{return ''}}
function profileURL(raw){try{const u=new URL(raw);if(u.protocol!=='https:'||u.username||u.password||u.port&&!['443'].includes(u.port)||!['instagram.com','www.instagram.com','m.instagram.com'].includes(u.hostname))return '';const m=u.pathname.match(/^\/([a-zA-Z0-9._]{1,30})\/(?:embed\/)?$/)||u.pathname.match(/^\/([a-zA-Z0-9._]{1,30})$/);if(!m||/^(?:accounts|explore|direct|p|reel|reels|tv|share|stories|about|developer|legal|challenge|web|oauth|api|ads|emails|privacy|terms)$/i.test(m[1])||m[1].includes('..'))return '';return 'https://www.instagram.com/'+m[1].toLowerCase()+'/'}catch{return ''}}
const isInstagramLink=raw=>!!(postURL(raw)||shareURL(raw)||profileURL(raw));
const visible=html=>String(html||'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
const decode=s=>String(s||'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):''});
function attributes(tag){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=decode(m[2]??m[3]);return a;}
function media(page,target){
 const canonical=postURL(target),code=canonical?.split('/')[4];if(!canonical||!postURL(page.url)||postURL(page.url).split('/')[4]!==code)return [];
 const html=page.html||'';
 if(/(?:this account is private|esta cuenta es privada|content (?:isn't|is not) available|contenido no est[aá] disponible|challenge_required|checkpoint_required)/i.test(visible(html)))return [];
 const metas={};for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a=attributes(tag);metas[a.property||a.name]=a.content||'';}
 if(metas['og:url']&&postURL(metas['og:url']).split('/')[4]!==code)return [];
 const found=[];
 function add(value){if(typeof value!=='string')return;try{const u=new URL(decode(value));if(u.protocol!=='https:'||u.username||u.password||!/^(?:[^.]+\.)*(?:cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(u.hostname)||/^static[.-]/.test(u.hostname)||/profile_pic|avatar|rsrc\.php|(?:^|[\/_-])(?:logo|icon|sprite|placeholder)(?:[\/_-]|\.)|s150x150/i.test(u.pathname))return;if(!found.includes(u.href))found.push(u.href)}catch{}}
 add(metas['og:image:secure_url']||metas['og:image']);add(metas['twitter:image']);
 let count=0;function walk(value,depth=0){if(!value||typeof value!=='object'||depth>18||++count>12000)return;if(value.shortcode===code||value.code===code){add(value.display_uri);add(value.display_url);add(value.thumbnail_src);for(const x of value.image_versions2?.candidates||[])add(x.url);for(const x of value.edge_sidecar_to_children?.edges||[])add(x.node?.display_url);}for(const x of Object.values(value))walk(x,depth+1);}
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){let raw=m[1].trim();if(raw.startsWith('window._sharedData'))raw=raw.replace(/^window\._sharedData\s*=\s*/,'').replace(/;\s*$/,'');if(!raw.startsWith('{')&&!raw.startsWith('['))continue;try{walk(JSON.parse(raw))}catch{}}
 return found.slice(0,3);
}
async function readInstagram(url,{readPage,renderPage,signal=AbortSignal.timeout(30000)}={}){
 const Content=require('./instagram-content.cjs');
 let target=postURL(url)||profileURL(url),profile=!!profileURL(url);
 const empty={...classify(url),kind:'inbox',title:profile?profileURL(url).split('/')[3]:'Publicación de Instagram',url,analysisUrl:url,analysisVersion:'18',aiStatus:'not-used',image:'',summary:'',needsReview:true};
 const unavailable=notice=>({...empty,notice,rejectedFields:['image'],verification:{checkedAt:new Date().toISOString(),status:'review',sources:target?[target]:[],issues:[{field:'source',reason:'Contenido no accesible sin iniciar sesión.'}]}});
 if(!target&&!shareURL(url))return unavailable('El enlace no corresponde a un perfil o publicación compatible de Instagram.');
 const load=(u)=>readPage(u,{signal:AbortSignal.any([signal,AbortSignal.timeout(9000)])});
 let page;try{page=await load(target||shareURL(url))}catch{if(renderPage&&!signal.aborted)try{page=await renderPage(target||shareURL(url),{signal:AbortSignal.any([signal,AbortSignal.timeout(11000)])})}catch{}}
 if(!page)return unavailable('Instagram no permite leer este contenido públicamente. Puedes añadir una foto o captura desde la ficha.');
 if(!target)target=postURL(page.url);
 if(!target)return unavailable('El enlace compartido no muestra una publicación pública de Instagram. Puedes añadir una foto o captura desde la ficha.');
 const canonical=raw=>profile?profileURL(raw):postURL(raw).split('/')[4]||'';
 function valid(p){const og=Content.metadata(p.html||'')['og:url'];return canonical(p.url)===canonical(target)&&(!og||canonical(og)===canonical(target))}
 function blocked(p){return !valid(p)||/(?:this account is private|esta cuenta es privada|content (?:isn't|is not) available|contenido no est[aá] disponible|challenge_required|checkpoint_required|<(?:h1|h2)[^>]*>\s*(?:log in to instagram|inicia sesi[oó]n en instagram))/i.test(visible(p.html))}
 if(blocked(page))return unavailable('Instagram no muestra este contenido sin iniciar sesión. Puedes añadir una foto o captura desde la ficha.');
 const context={target,profile:profile?target.split('/')[3]:'',code:profile?'':target.split('/')[4]};
 let data=Content.extract(page,context);if(data.private)return unavailable('La cuenta es privada. Puedes completar la ficha y añadir una foto manualmente.');
 if(!data.images.length||!data.content){
  try{const embedded=await load(target+'embed/');if(!blocked(embedded)){const more=Content.extract(embedded,context);if(!more.private){if(more.content&&!data.content)data=more;else if(more.images.length)data.images=more.images}}}catch{}
 }
 if((!data.images.length||!data.content)&&renderPage&&!signal.aborted){try{const rendered=await renderPage(target,{signal:AbortSignal.any([signal,AbortSignal.timeout(9000)])});if(!blocked(rendered)){const more=Content.extract(rendered,context);if(!more.private){if(more.content&&!data.content)data=more;else if(more.images.length)data.images=more.images}}}catch{}}
 const info=data.info||empty,sources=[target];
 // Only a profile's own declared website can complement its details. Never use
 // a reporter's account or somebody else's recommendations to fill a post.
 if(profile&&info.website&&!signal.aborted){
  try{const official=await load(info.website);if(new URL(official.url).origin===new URL(info.website).origin&&Content.enrichOfficial(info,official)){
   sources.push(official.url);
   if(!info.address||!info.phone){const links=[...official.html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)];const contact=links.find(m=>/^(?:contacto|contacte|contact|donde estamos|on som)$/i.test(decode(m[2].replace(/<[^>]*>/g,'')).trim()));if(contact){const next=new URL(decode(contact[1]),official.url);next.hash='';if(next.origin===new URL(official.url).origin&&next.href!==official.url){const detail=await load(next.href);if(new URL(detail.url).origin===next.origin&&Content.enrichOfficial(info,detail))sources.push(detail.url)}}}
  }}catch{}
 }
 const images=data.images||[],issues=[];if(!images.length)issues.push({field:'image',reason:'Foto no accesible sin iniciar sesión.'});if(info.kind==='inbox')issues.push({field:'kind',reason:'Contenido insuficiente para identificar la sección.'});
 const rejectedFields=[...(!images.length?['image']:[]),...['date','endDate','workTitle','venue','address','phone','website','cuisine','price','time','activityType'].filter(key=>!info[key])];
 return {...info,url,analysisUrl:url,analysisVersion:'18',aiStatus:'not-used',summarySource:'extract',image:images[0]||'',imageCandidates:images,rejectedFields,needsReview:issues.length>0,notice:[!images.length?'Instagram no publica una foto accesible. Puedes añadir una foto o captura desde la ficha.':'',info.kind==='inbox'?'Revisa en qué sección quieres guardar este contenido.':''].filter(Boolean).join(' '),verification:{checkedAt:new Date().toISOString(),status:'review',sources,issues}};
}
module.exports={postURL,profileURL,isInstagramLink,media,readInstagram};
