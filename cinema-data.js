(function(root){
'use strict';
const E=typeof module!=='undefined'?require('./event-data.js'):root.EventData;
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const list=x=>[].concat(x||[]);
const is=(x,type)=>list(x?.['@type']).some(t=>String(t).split('/').pop()===type);
const url=(value,base)=>{try{const u=new URL(value,base);return value&&['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}};

function enrich(result,html,reading,clean,region){
 const nodes=[],byId=new Map();let count=0;
 function walk(value,depth=0){
  if(!value||typeof value!=='object'||depth>60||++count>20000)return;
  if(Array.isArray(value)){value.forEach(v=>walk(v,depth+1));return;}
  nodes.push(value);
  if(value['@id']){const id=url(value['@id'],result.url);if(!byId.has(id)||Object.keys(value).length>Object.keys(byId.get(id)).length)byId.set(id,value);}
  for(const v of Object.values(value))if(v&&typeof v==='object')walk(v,depth+1);
 }
 for(const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  if(m[1].length>1500000)continue;
  try{walk(JSON.parse(m[1]))}catch{}
 }
 const key=v=>url(v,result.url).replace(/\/$/,'');
 const movies=nodes.filter(n=>is(n,'Movie')&&n.name);
 const movie=movies.find(n=>key(n.url||n['@id'])===key(result.url))||movies.find(n=>fold(n.name)===fold(result.title));
 // Some cinema CMSs do not emit JSON-LD. Their public ficha still has a stable
 // content boundary and embeds the same event data in addToJSON/HTML attributes.
 if(!movie){
  const title=(html.match(/<div\b[^>]*class=["'][^"']*ficha-titulo[^"']*["'][^>]*>[\s\S]*?<div\b[^>]*id-ficha=["'][^"']+["'][^>]*>([\s\S]*?)<\/div>/i)||[])[1];
  const synopsis=(html.match(/<div\b[^>]*class=["'][^"']*ficha-sinopsis[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)||[])[1];
  const image=(html.match(/<div\b[^>]*class=["'][^"']*ficha-imagen[^"']*["'][\s\S]*?<img\b[^>]*src=["']([^"']+)["']/i)||[])[1];
  const cleanTitle=clean(title), cleanSynopsis=clean(synopsis), sessions=[];
  const tabs=[...html.matchAll(/<li\b[^>]*data-panel=["']([^"']+)["'][^>]*data-fecha=["'](\d{1,2})[\/]([0-9]{1,2})[\/]([0-9]{4})["'][^>]*>/gi)];
  for(let n=0;n<tabs.length;n++){const tab=tabs[n],start=html.indexOf('id="'+tab[1]);const next=n+1<tabs.length?html.indexOf('id="'+tabs[n+1][1],start+1):-1;const chunk=html.slice(start,next>start?next:start+30000);const times=[...chunk.matchAll(/class=["'][^"']*hora-ses[^"']*["'][^>]*>\s*(\d{1,2}:\d{2})/gi)];for(const t of times)sessions.push({date:`${tab[4]}-${tab[3].padStart(2,'0')}-${tab[2].padStart(2,'0')}`,time:t[1],endTime:'',label:'',mode:'onsite',url:''});}
  if(cleanTitle){result.kind='plan';result.title=result.workTitle=result.originalTitle=cleanTitle;result.activityType='Cine';if(cleanSynopsis)result.summary='Cine: '+cleanSynopsis;if(url(image,result.url))result.image=url(image,result.url);if(sessions.length){result.occurrences=[...new Map(sessions.map(x=>[x.date+' '+x.time,x])).values()];result.date=result.occurrences[0].date;result.endDate=result.occurrences.at(-1).date;result.scheduleMode='sessions';result.time=E.sessionLabel(result.occurrences);}const site=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1];if(/cines abc|abc park/i.test(site+' '+html)){result.venue='ABC Park';result.city='Valencia';result.locationEvidence='Ficha de sesiones del cine';}return result;}
  return result;
 }
 const resolve=value=>typeof value==='string'?byId.get(url(value,result.url))||{}:value?.['@id']?{...byId.get(url(value['@id'],result.url)),...value}:value||{};
 const belongs=value=>{const work=resolve(value),workKey=key(work.url||work['@id']),movieKey=key(movie.url||movie['@id']);return workKey&&movieKey&&workKey===movieKey||work.name&&fold(work.name)===fold(movie.name)};
 const owned=new Set(list(movie.event).map(resolve));
 const events=[...new Set([...owned,...nodes.filter(n=>is(n,'ScreeningEvent')&&list(n.workPresented).some(belongs))])]
  .filter(n=>is(n,'ScreeningEvent')&&(!n.workPresented||list(n.workPresented).some(belongs)));
 const valid=[];
 for(const e of events){
  const m=String(e.startDate||'').match(/^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d)/);
  if(!m||E.dateIn(m[1])!==m[1])continue;
  const end=String(e.endDate||'').match(/^(\d{4}-\d{2}-\d{2})T((?:[01]\d|2[0-3]):[0-5]\d)/);
  const offer=resolve(list(e.offers)[0]);
  valid.push({event:e,row:{date:m[1],time:m[2],endTime:end?.[1]===m[1]&&end[2]>m[2]?end[2]:'',label:clean(list(e.inLanguage).join(' · ')),mode:'onsite',url:url(offer.url||e.url,result.url)}});
 }
 result.kind='plan';result.title=result.workTitle=clean(movie.name);result.activityType='Cine';
 let image=list(movie.image)[0];if(image&&typeof image==='object')image=image.contentUrl||image.url;
 if(url(image,result.url))result.image=url(image,result.url);
 const narrative=reading.paragraphs.find(t=>t.length>100&&t.length<2000&&!/^(?:dirigid|repart|fitxa|ficha|comprar|entrad|horari|durada|duraci[oó]n|precio)/i.test(t));
 const text=clean(reading.synopsis||narrative||movie.description);
 if(text){const sentences=text.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[text];let summary=sentences.slice(0,2).join('').trim();if(summary.length>380)summary=summary.slice(0,377).replace(/\s+\S*$/,'')+'…';result.summary='Cine: '+summary;}
 if(valid.length){
  result.occurrences=[...new Map(valid.map(x=>[x.row.date+' '+x.row.time,x.row])).values()].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  result.date=result.occurrences[0].date;result.endDate=result.occurrences.at(-1).date;
  result.scheduleMode='sessions';result.time=E.sessionLabel(result.occurrences);
  const places=[...new Map(valid.map(x=>resolve(x.event.location)).filter(p=>p.name).map(p=>[fold(p.name),p])).values()];
  if(places.length===1){
   const p=places[0],a=resolve(p.address);result.venue=clean(p.name);
   const address=typeof p.address==='string'&&!p.address.startsWith('http')?p.address:[a.streetAddress,[a.postalCode,a.addressLocality].filter(Boolean).join(' '),a.addressRegion].filter(Boolean).join(', ');
   if(address){result.address=clean(address);result.city=region(result.address);result.locationEvidence='Dirección del cine vinculado a las sesiones';}
  }
  const prices=valid.flatMap(x=>list(x.event.offers).map(resolve)).filter(o=>o.price!==undefined&&o.price!==''&&/^(?:EUR|€)$/i.test(o.priceCurrency||'')).map(o=>Number(String(o.price).replace(',','.'))).filter(n=>Number.isFinite(n)&&n>=0);
  if(prices.length){const min=Math.min(...prices),max=Math.max(...prices),fmt=n=>String(n).replace('.',',');result.price=min===max?fmt(min)+' €':fmt(min)+'–'+fmt(max)+' €';}
 }
 return result;
}
const API={enrich};if(typeof module!=='undefined')module.exports=API;else root.CinemaData=API;
})(typeof window!=='undefined'?window:globalThis);
