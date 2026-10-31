'use strict';
const {classify,pageText}=require('./classifier.js');
const fold=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const decode=s=>String(s||'').replace(/&quot;/g,'"').replace(/&#(?:39|0*39);|&apos;/g,"'").replace(/&#(x[0-9a-f]+|\d+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);return v>0&&v<=0x10ffff?String.fromCodePoint(v):''}).replace(/&amp;/g,'&');
const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const list=v=>Array.isArray(v)?v:[];
function metadata(html){const out={};for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=decode(m[2]??m[3]);if(a.property||a.name)out[a.property||a.name]=a.content||''}return out}
function objects(html){
 const found=[];let count=0,parsed=0;
 function walk(v,depth=0){
  if(depth>30||++count>30000)return;
  if(typeof v==='string'&&v.length>20&&v.length<1500000&&/^[\[{]/.test(v.trim())&&parsed++<30){try{walk(JSON.parse(v),depth+1)}catch{}return}
  if(!v||typeof v!=='object')return;found.push(v);for(const child of Object.values(v))walk(child,depth+1);
 }
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)){let raw=m[1].trim().replace(/^window\._sharedData\s*=\s*/,'').replace(/;\s*$/,'');if(!/^[\[{]/.test(raw))continue;try{walk(JSON.parse(raw))}catch{}}
 return found;
}
function caption(node){return String(node?.caption?.text||node?.edge_media_to_caption?.edges?.[0]?.node?.text||(typeof node?.caption==='string'?node.caption:'')||'')}
function safeURL(raw){try{const u=new URL(decode(raw));return ['https:','http:'].includes(u.protocol)&&!u.username&&!u.password&&(!u.port||['80','443'].includes(u.port))?u.href:''}catch{return ''}}
function photoURL(raw){const url=safeURL(raw);if(!url||!url.startsWith('https:'))return '';const u=new URL(url);return /^(?:[^.]+\.)*(?:cdninstagram\.com|fbcdn\.net|instagram\.com)$/.test(u.hostname)&&!/^static[.-]/.test(u.hostname)&&!/profile_pic|avatar|\/t51\.2885-19\/|rsrc\.php|s(?:100|150)x(?:100|150)|(?:^|[\/_-])(?:logo|icon|sprite|placeholder)(?:[\/_-]|\.)/i.test(u.pathname)?url:''}
function pictures(node,depth=0){
 if(depth>5)return [];
 const out=[];const add=v=>{const url=photoURL(v);if(url&&!out.includes(url))out.push(url)};
 add(node?.display_uri);add(node?.display_url);add(node?.thumbnail_src);
 for(const item of list(node?.image_versions2?.candidates).slice(0,20).sort((a,b)=>Math.abs((a.width||640)-640)-Math.abs((b.width||640)-640)))add(item?.url);
 for(const child of [...list(node?.carousel_media),...list(node?.edge_sidecar_to_children?.edges).map(e=>e?.node)].slice(0,12))for(const image of pictures(child,depth+1))add(image);
 return out;
}
function cleanContent(raw){return decode(raw).normalize('NFKC').replace(/^.*?(?:likes|me gusta|seguidores|followers),?[^\n]*?\s[-–]\s[^\n]*?:\s*["“]/i,'').replace(/#[\p{L}\p{N}_]+/gu,'').split(/\n/).filter(line=>!/(?:enllaç|enlace|link).{0,15}(?:bio|perfil)|^(?:guarda (?:este|esta)|save this|síguenos|follow us)|^\s*🇬🇧/i.test(line)).join('\n').replace(/["”]\.?\s*$/,'').replace(/[ \t]+/g,' ').trim().slice(0,12000)}
function section(text){
 const t=fold(text);
 if(/\b(tienda de (?:muebles|decoracion|hogar)|botiga de (?:mobles|decoracio)|muebles|mobles|mobiliario|furniture|home decor|interiorismo|sofas?|lamparas?|iluminacion|menaje)\b/.test(t))return 'buy';
 if(/\b(restauran\w*|restorant|pizzeria|arroceria|taberna|bodega|tapas|brunch|gastronom\w*|menjador|cuina|cocina|cuisine|sushi|taqueria|cafeteria|bar de|tapas bar)\b/.test(t))return 'restaurant';
 if(/\b(visita\w*|sitios?|lugares?|llocs?|rincones?|paisajes?|naturaleza|natura|pueblos?|pobles?|senderismo|rutas?|rutes?|mirador\w*|escapad\w*|montan\w*|muntany\w*|lagos?|llacs?|playas?|platges?|calas?|parques?|parcs?|bosques?|piscinas?|pozas?|rios?|museos?|museus?|teatr[oe]|conciert\w*|concert\w*|exposicio\w*|actividades?|activitats?|taller\w*|festival\w*|jardines?|jardins?|castillos?|castells?)\b/.test(t))return 'plan';
 return 'inbox';
}
function subject(text,location){
 // A reporter's account is not the place described by their post.
 const named=text.match(/\b(?:restaurante?|restaurant|temple|templo|tienda|botiga)\s+([\p{Lu}\d][\p{L}\d &'’.-]{2,90}?)\s+(?:és|es|is|ofrece|ofereix|se encuentra|abre|obre)\b/u)?.[1];
 const first=text.split(/\n|[.!?](?:\s|$)/)[0].replace(/^[^\p{L}\p{N}]+/u,'').trim();
 return (named||location||first||'Publicación de Instagram').slice(0,130);
}
function extract(page,{target,profile,code}){
 const html=page.html||'',meta=metadata(html),nodes=objects(html);
 const user=profile?nodes.filter(n=>fold(n.username)===fold(profile)&&('biography'in n||'full_name'in n)).sort((a,b)=>Number('biography'in b)-Number('biography'in a))[0]:null;
 if(user?.is_private===true)return {private:true};
 const posts=profile?nodes.filter(n=>(n.code||n.shortcode)&&(fold(n.user?.username||n.owner?.username)===fold(profile)||user?.id&&(n.user?.id||n.owner?.id)===user.id)):nodes.filter(n=>(n.code||n.shortcode)===code);
 const post=posts.sort((a,b)=>caption(b).length-caption(a).length)[0];
 let raw=profile?user?.biography||meta.description||'':caption(post)||meta['og:description']||meta.description||meta['og:title']?.replace(/^.*? (?:en|on) Instagram:\s*["“]/i,'')||'';
 const content=cleanContent(raw),profileName=user?.full_name||meta['og:title']?.replace(/\s*\(@[^)]*\)[\s\S]*$/,'')||profile;
 const name=profile?profileName:subject(content,post?.location?.name),category=user?.category_name||user?.business_category_name||user?.category||'';
 const kind=section((profile?name+' '+category+' ':'')+content);
 const type={restaurant:'Restaurant',buy:'Product',plan:'TouristAttraction'}[kind];
 let address='';if(user?.business_address_json)try{const a=JSON.parse(user.business_address_json);address=[a.street_address,a.zip_code,a.city_name].filter(Boolean).join(', ')}catch{}
 if(!address)address=[post?.location?.address,post?.location?.city].filter(Boolean).join(', ');
 const schema={...(type?{'@type':type}:{}),name,description:content,address};
 const synthetic='<main><h1>'+esc(name)+'</h1>'+content.split(/\n+/).map(s=>'<p>'+esc(s)+'</p>').join('')+'</main><script type="application/ld+json">'+JSON.stringify(schema).replace(/</g,'\\u003c')+'</script>';
 const info=classify(target,synthetic);Object.assign(info,{kind,title:name,originalTitle:name,summary:content.replace(/\n+/g,' ').slice(0,1200),venue:kind==='plan'?post?.location?.name||'':'',workTitle:'',image:'',source:'instagram-public'});
 if(!info.address){const street=content.match(/\b(?:Plaça|Plaza|Carrer|Calle|Avinguda|Avenida|Passeig|Paseo)\s+(?:de |del |dels |la |les |el |los )?[\p{Lu}][\p{L}'’-]+(?:\s+(?:de |del |la )?[\p{Lu}][\p{L}'’-]+){0,4}(?:\s*,?\s*\d{1,5})?/u)?.[0];if(street)info.address=[street,info.city].filter(Boolean).join(', ')}
 if(kind==='buy')info.shop=name;
 const cuisine=content.split(/\n/).map(s=>s.match(/(?:cuina|cocina|cuisine)\s+([^.!\n]{3,90})/i)?.[1]).filter(Boolean).find(s=>!/^non.?stop|^abierta/i.test(s));if(kind==='restaurant'&&cuisine)info.cuisine=cuisine.split(/\s+(?:que|con|amb)\b/i)[0].trim();
 const hours=[...content.matchAll(/\b(?:abrimos|abierto|obert|obrim|horario|horari|open)\b[^.!\n,]{2,160}/gi)].map(m=>m[0]).find(s=>/\d|migdia|mediodia|semana|setmana|dias|dies/i.test(s));if(hours&&!info.time)info.time=hours.trim();
 if(!info.price){const amount=content.match(/\b(\d+(?:[.,]\d{1,2})?(?:\s*(?:-|–|a)\s*\d+(?:[.,]\d{1,2})?)?)\s*(?:€|euros?\b)/i);if(amount){const before=content.slice(Math.max(0,amount.index-60),amount.index);if(!/descuento|descompte|ahorr|sorteo|valorad|premio|fianza|env[ií]o/i.test(before))info.price=(/(?:desde|des de|a partir de)\s*$/i.test(before)?'Desde ':'')+amount[1]+' €'}}
 const phone=user?.business_phone_number||user?.public_phone_number||content.match(/(?:tel[eé]fono|tel[eè]fon|tel\.?|phone)\s*:?\s*(\+?[\d ()-]{8,22})/i)?.[1];if(phone)info.phone=phone;
 const website=safeURL(user?.external_url||list(user?.bio_links).find(x=>safeURL(x?.url))?.url||'');if(website)info.website=website;
 const ranked=posts.map(n=>{const desc=fold(caption(n)+' '+(n.accessibility_caption||''));const food=/comida|plato|cocina|cuina|croqueta|pasta|carne|ternera|arroz|sushi|pizza|hamburguesa|ensalada|food|dish|steak|noodles|paella|pescado|tortilla|postre|menu casol/.test(desc);const text=/imagen de texto|image of text|cartel|sorteo|giveaway|carta de precios/.test(desc);return {n,score:(kind==='restaurant'&&food?5:0)-(text?2:0)}}).sort((a,b)=>b.score-a.score);
 const images=[...new Set(ranked.flatMap(({n})=>pictures(n)))];
 // Preview metadata is useful for posts, but a profile's og:image is its avatar.
 if(!profile)for(const raw of [meta['og:image:secure_url']||meta['og:image'],meta['twitter:image']]){const image=photoURL(raw);if(image&&!images.includes(image))images.push(image)}
 return {info,images:images.slice(0,3),content,identity:!!(user||post&&caption(post)),private:false};
}
function identityMatches(html,name){const words=fold(name).split(/[^a-z0-9]+/).filter(t=>t.length>=3),value=fold(html);return words.length>0&&words.every(w=>value.includes(w))}
function enrichOfficial(info,page){
 if(!identityMatches(page.html,info.title))return false;
 const extra=classify(page.url,page.html),reading=pageText(page.html),meta=metadata(page.html);
 for(const key of ['address','city','locationEvidence','price','cuisine','time'])if(!info[key]&&extra[key])info[key]=extra[key];
 if(!info.address){const line=reading.blocks.find(s=>s.length<160&&/^[\p{L}][\p{L}\s.'’,-]{3,75}\s+\d{1,5}[.,\s]+[\p{L}]/u.test(s)&&!/\b(?:km|quil[oò]metres|kil[oó]metros|euros)\b/i.test(s));if(line)info.address=line}
 if(!info.city&&info.address)info.city=classify(page.url,'<main><address>'+esc(info.address)+'</address></main>').city;
 const phone=page.html.match(/href\s*=\s*["']tel:([^"']+)/i)?.[1];if(!info.phone&&phone)info.phone=decode(phone).replace(/[^+\d ()-]/g,'').slice(0,30);
 if(!info.summary&&meta.description)info.summary=meta.description.slice(0,1200);
 return true;
}
module.exports={extract,enrichOfficial,safeURL,metadata,identityMatches};
