'use strict';
// Public Maps place payloads are undocumented: validate identity and shapes, never
// evaluate scripts or search reviews for facts about the establishment.
const {region}=require('./classifier.js');
function isMaps(raw){try{const u=new URL(raw);return u.hostname==='maps.app.goo.gl'||/^(?:www\.|maps\.)?google\.(?:com|es)$/.test(u.hostname)&&/^\/maps(?:\/|$)/.test(u.pathname)}catch{return false}}
function safe(raw){try{const u=new URL(raw);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}}
function parsePlace(body,url){
 const root=JSON.parse(body.replace(/^\)\]\}'\s*/,'')),p=root?.[6];
 if(!Array.isArray(p)||typeof p[11]!=='string'||!Array.isArray(p[2])||!/^0x[\da-f]+:0x[\da-f]+$/i.test(p[10]||''))throw Error('Formato de Maps no reconocido');
 const expected=decodeURIComponent(url).match(/0x[\da-f]+:0x[\da-f]+/i)?.[0];
 if(!expected||expected.toLowerCase()!==p[10].toLowerCase())throw Error('La ficha de Maps no coincide con el enlace');
 const cuisine=(p[13]||[]).filter(v=>typeof v==='string').join(', ');
 if(!/restaurant|restaurante|caf[eé]|bar\b|pizzer|comida|brunch|tapas|bistr|asador/i.test(cuisine))throw Error('El lugar no está identificado como restaurante');
 const address=p[2].filter(v=>typeof v==='string').join(', ');
 let website='';try{const link=new URL(p[7]?.[0],url);website=safe(link.pathname==='/url'?link.searchParams.get('q'):link.href)}catch{}
 const rating=Number(p[4]?.[7]),count=p[4]?.[8];
 const phone=typeof p[178]?.[0]?.[0]==='string'?p[178][0][0]:'';
 const hours=(p[203]?.[0]||[]).filter(r=>typeof r?.[0]==='string'&&Array.isArray(r[3])).map(r=>r[0]+': '+r[3].map(s=>s[0]).filter(s=>typeof s==='string').join(', ')).join('; ');
 // Only explicit food captions qualify; unlabelled images may show a façade,
 // a menu, a person or a video. Do not silently call them food photographs.
 const photos=p[51]?.[0]||[];
 const food=photos.find(photo=>Array.isArray(photo)&&/comida|plato|food|dish|tapas|paella|pizza/i.test(String(photo[20]||'')+' '+String(photo[6]?.[1]||''))&&!/men[uú]|carta|video/i.test(String(photo[20]||''))&&safe(photo[6]?.[0]));
 const image=food?safe(food[6][0]):'';
 const description=typeof p[32]?.[1]?.[1]==='string'?p[32][1][1]:'';
 const summary=description||[cuisine,address?'en '+address:''].filter(Boolean).join(' ')+'.';
 // Aggregate price only. Never promote the spend in one user's review.
 const price=typeof p[4]?.[2]==='string'&&/€|\$|£/.test(p[4][2])?p[4][2]:'';
 return {kind:'restaurant',title:p[11].trim(),originalTitle:p[11].trim(),address,city:region(address+' '+JSON.stringify(p[245]||[])),cuisine,phone:/^[+\d\s().-]{6,30}$/.test(phone)?phone:'',website,googleRating:rating>0&&rating<=5?String(rating):'',googleReviews:Number.isInteger(count)&&count>=0?String(count):'',summary,summarySource:'extract',time:hours,price,image,mapsUrl:url};
}
async function readMaps(page,{readResource,signal}={}){
 const href=page.html.match(/href=["']([^"']*\/maps\/preview\/place[^"']*)["']/i)?.[1];
 if(!href)throw Error('Google Maps no publica los datos de esta ficha');
 const target=new URL(href.replace(/&amp;/g,'&'),page.url);
 if(target.origin!==new URL(page.url).origin||target.pathname!=='/maps/preview/place')throw Error('Origen de ficha inesperado');
 const response=await readResource(target.href,{signal});
 const info=parsePlace(response.body.toString('utf8'),page.url);
 const missing=[!info.price&&'precio general',!info.image&&'foto identificada como comida',!info.phone&&'teléfono',!info.website&&'web',!info.googleRating&&'puntuación'].filter(Boolean);
 const notice=missing.length?'Google Maps no ha permitido verificar: '+missing.join(', ')+'.':'';
 return {...info,rejectedFields:['price','image','phone','website','googleRating','googleReviews'].filter(k=>!info[k]),analysisVersion:'16',analysisUrl:page.url,aiStatus:'not-used',researchPages:'2',notice,needsReview:!!notice,verification:{checkedAt:new Date().toISOString(),status:notice?'review':'checked',sources:[page.url],issues:missing.map(field=>({field,reason:'No disponible en la ficha pública leída: '+field+'.'}))}};
}
module.exports={isMaps,parsePlace,readMaps};
