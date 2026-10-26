const {classify,pageText,scheduleLabel}=require('./classifier.js');
const AI=require('./ai-reader.cjs');
const EventData=require('./event-data.js');
const {venueData}=require('./venue-data.cjs');
const plain=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&([aeiou])acute;/gi,(_,v)=>({a:'á',e:'é',i:'í',o:'ó',u:'ú'}[v.toLowerCase()])).replace(/\s+/g,' ').trim();
const fold=s=>plain(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/ø/g,'o');
const stop=new Set(['teatro','teatre','obra','actividad','barcelona','valencia','para','como','desde','sobre','este','esta','ofrece','conoce','descubre','noticias','entradas','espana','timeout']);
function candidates(page,idea){
 const venueNames=[fold(idea.venue),fold(idea.venue).split(/\s*(?:\.\s*|[-–]\s*)(?:sala|planta)\b/)[0]].filter(Boolean);
 let scope=pageText(page.html).mainHtml||(page.html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)||[])[1]||page.html.replace(/<(nav|footer|aside)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
 scope+='\n'+[...page.html.matchAll(/<a\b[^>]*href\s*=\s*["'][^"']+["'][^>]*>[\s\S]*?<\/a>/gi)].map(m=>m[0]).filter(a=>/^(?:contacto|contacte|contact|visita|planificar visita|planifica tu visita|como llegar|com arribar-hi|on som|donde estamos|consultar excepcions|consultar excepciones)$/i.test(fold(plain(a)))||venueNames.includes(fold(plain(a)))).join('\n');
 const terms=[...new Set(fold(idea.workTitle||idea.originalTitle||idea.title).split(/[^a-z0-9]+/).filter(t=>t.length>3&&!stop.has(t)))];
 const translations=[];if(!/^es(?:-|$)/i.test((page.html.match(/<html\b[^>]*lang=["']([^"']+)/i)||[])[1]||'')){for(const tag of page.html.match(/<(?:a|link)\b[^>]*>/gi)||[]){if(!/hreflang=["']es(?:-ES)?["']/i.test(tag))continue;const href=(tag.match(/href=["']([^"']+)/i)||[])[1];if(!href)continue;try{const target=new URL(href,page.url),current=new URL(page.url),strip=p=>p.replace(/^\/(?:es|ca|en)(?:\/|$)/,'/').replace(/\/$/,'');if(target.origin===current.origin&&target.href!==current.href&&strip(target.pathname)===strip(current.pathname))translations.push({url:target.href,label:'Versión oficial en castellano',score:100,role:'translation'});}catch{}}}
 const venueTerms=fold(idea.venue||'').split(/[^a-z0-9]+/).filter(t=>t.length>3&&!stop.has(t));const found=[];
 for(const m of scope.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  try{const url=new URL(m[1].replace(/&amp;/g,'&'),page.url);url.hash='';if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.href===page.url)continue;
   if(/(^|\.)(instagram|facebook|youtube|twitter|tiktok|pinterest|x)\.(com|es)$/.test(url.hostname)||/google\.[^/]+\/maps/.test(url.href))continue;
   if(/privacy|privacidad|legal|cookie|login|registro|checkout|carrito|cart\b|mailto|whatsapp/i.test(url.pathname)||/\.(jpg|jpeg|png|gif|webp|svg|zip|mp4)$/i.test(url.pathname))continue;
   const label=plain(m[2]),hint=fold(label+' '+decodeURIComponent(url.pathname));let score=0,role='detail';
   if(/^(?:comprar|comprar entradas|comprar entrades|entradas|entrades)$/i.test(label)){score+=10;role='practical'}
   if(/sinopsis|synopsis|argumento|sobre la obra|ficha (?:de la obra|artistica)|detalles del espectaculo/.test(hint)){score+=14;role='synopsis'}
   if(/web oficial|pagina oficial|sitio web|mas informacion|mes informacio|informacion (?:practica|del evento|del espectaculo)|ver (?:obra|actividad|evento)|detalles/.test(hint))score+=10;
   if(/contacto|contact|ubicacion|como-llegar|como llegar|donde-estamos|guia practica|on som/.test(hint)){score+=9;role='contact'}
   if(/\.(?:pdf|ics)$/.test(url.pathname)){score+=8;role='practical'}
   if(/calendari|calendar|horarios|horaris|sesiones|sessions|dates|fechas|tarifas|precios|preus|informacion practica|informacio practica|\.ics$/.test(hint)){score+=12;role='practical'}
   if(/entradas|entrades|espectaculo|espectacle|programacion|funcion|teatro|teatre/.test(hint))score+=3;
   if(venueTerms.some(t=>fold(url.hostname+' '+url.pathname+' '+label).includes(t)))score+=5;const context=fold(scope.slice(Math.max(0,m.index-130),m.index+m[0].length+130));if(/sinopsis|la obra|espectaculo|actividad|web oficial/.test(context)&&label.length>5&&!/autor|escrito por|compartir/i.test(label))score+=4;
   if(/^(?:visita|planificar visita|planifica tu visita|prepare your visit|consultar excepcions|consultar excepciones|informacio general|informacion general)$/i.test(fold(label))&&url.origin===new URL(page.url).origin){score+=20;role='venue'}
   if(venueNames.includes(fold(label))){role='venue';score+=15;}
   const overlap=terms.filter(t=>hint.includes(t)).length;if(idea.workTitle&&!overlap&&['detail','practical'].includes(role)&&! /entradas|entrades|sinopsis|synopsis|informacion practica|informacio practica|tarifas|precios|preus|calendari|calendar|horario|horaris|sesiones|sessions|dates|fechas|programa|dossier|dosier|informacion|guia|comprar/.test(fold(label)))continue;score+=Math.min(overlap*3,15);
   if(/^\/(?:$|buscar|search|agenda|cartelera|noticias\/?$)/i.test(url.pathname))score-=7;
   if(url.origin!==new URL(page.url).origin&&score>=8)score+=2;
   if(score>=7)found.push({url:url.href,label,score,role});
  }catch{}
 }
 const unique=new Map();for(const item of [...translations,...found].sort((a,b)=>b.score-a.score))if(!unique.has(item.url))unique.set(item.url,item);return [...unique.values()];
}
async function research(url,{readPage,renderPage,analyze=AI.analyze,configured=AI.configuration().configured}={}){
 const result={...classify(url),analysisVersion:'15',summarySource:'extract',aiStatus:configured?'unavailable':'unconfigured'};
 const deadline=Date.now()+40000;const pages=[],visited=new Set([url]);let linkedRenders=0;
 async function load(target,role='primary',label=''){const remaining=deadline-Date.now();if(remaining<=0)throw Error('Tiempo agotado');const signal=AbortSignal.timeout(Math.min(12000,remaining));let timer;try{const page=await Promise.race([readPage(target,{signal}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('Tiempo agotado')),Math.min(12000,remaining));timer.unref?.()})]);if(role!=='primary'&&renderPage&&linkedRenders<2&&Date.now()<deadline-5000&&/<script\b/i.test(page.html)&&!page.notice){const info=classify(page.url,page.html);if(['practical','detail','synopsis'].includes(role)&&(!info.summary||!info.price&&role==='practical'||pageText(page.html).text.length<500)){linkedRenders++;try{const rendered=await renderPage(page.url,{signal:AbortSignal.timeout(Math.min(9000,deadline-Date.now()))});if(pageText(rendered.html).text.length>=pageText(page.html).text.length)Object.assign(page,rendered)}catch{}}}return {...page,role,label}}finally{clearTimeout(timer)}}
 let primary;try{primary=await load(url)}catch{if(renderPage){try{primary={...await renderPage(url,{signal:AbortSignal.timeout(Math.min(14000,deadline-Date.now()))}),role:'primary',label:''}}catch{}}}
 if(!primary)return {...result,notice:'No se ha podido acceder al contenido. El enlace queda guardado para reintentar.',needsReview:true};
 Object.assign(result,classify(primary.url,primary.html),{url,analysisUrl:url,analysisVersion:'15'});
 if(renderPage&&!primary.rendered&&primary.format!=='calendar'&&primary.format!=='json'&&/(?:<script\b|itemscope)/i.test(primary.html)&&needsRendering(primary,result)&&Date.now()<deadline-8000){
  try{const rendered=await renderPage(primary.url,{signal:AbortSignal.timeout(Math.min(14000,deadline-Date.now()))});const info=classify(rendered.url,rendered.html);if(pageText(rendered.html).text.length>=pageText(primary.html).text.length){primary={...primary,...rendered};for(const [key,value]of Object.entries(info))if(value&&(!Array.isArray(value)||value.length))result[key]=value;result.url=url;result.analysisUrl=url;}}catch{}
 }
 pages.push(primary);visited.add(primary.url);if(primary.notice)result.notice=primary.notice;
 const inherited=venueData(primary,result,{footerOnly:true});let venueTimeSource=inherited.time&&!result.time?primary.url:'';
 for(const key of ['address','city','time','price'])if(inherited[key]&&!result[key])result[key]=inherited[key];
 // Search both unvisited primary links and one level deeper; diversify roles before similar ticket links.
 let queue=candidates(primary,result);for(let round=0;round<2&&Date.now()<deadline-1000;round++){
  const chosen=[],roles=new Set();const available=queue.filter(c=>!visited.has(c.url)).sort((a,b)=>b.score-a.score);
  for(const c of available){if(!roles.has(c.role)){chosen.push(c);roles.add(c.role)}if(chosen.length===(round===0?3:2))break}
  for(const c of available){if(chosen.length===(round===0?3:2))break;if(!chosen.includes(c))chosen.push(c)}
  chosen.forEach(c=>visited.add(c.url));const batch=await Promise.allSettled(chosen.map(c=>load(c.url,c.role,c.label)));
  for(const r of batch)if(r.status==='fulfilled'){
   pages.push(r.value);visited.add(r.value.url);
   if(r.value.role==='contact')continue;
   const next=candidates(r.value,result);
   queue.push(...(r.value.role==='venue'?next.filter(c=>['venue','contact'].includes(c.role)):next));
  }
 }
 const details=pages.slice(1).map(p=>({page:p,info:classify(p.url,p.html)}));
 const discoveredWorks=[...new Set(details.filter(({page})=>!['venue','contact'].includes(page.role)).map(({info})=>fold(info.workTitle||'')).filter(Boolean))];const multipleWorks=!result.workTitle&&discoveredWorks.length>1;if(result.kind==='inbox'&&!multipleWorks){const kinds=[...new Set(details.filter(({page})=>page.role!=='contact').map(({info})=>info.kind).filter(k=>k!=='inbox'))];if(kinds.length===1)result.kind=kinds[0];}
 for(const {page,info}of details){
  const compatibleWork=require('./verification.cjs').identity(result,info);if(['venue','contact'].includes(page.role)&&!result.rejectedFields?.includes('address')&&!result.address&&info.address&&(!result.city||!info.city||info.city===result.city)){result.address=info.address;if(!result.city&&info.city)result.city=info.city;}
  if(['venue','contact'].includes(page.role)&&!result.rejectedFields?.includes('address')){
   const extra=venueData(page,result);
   if(extra.time&&result.time&&venueTimeSource&&openingSlot(extra.time)&&openingSlot(result.time)&&openingSlot(extra.time)!==openingSlot(result.time)){
    (result.sourceConflicts||=[]).push({field:'time',reason:'El recinto publica horarios distintos en sus páginas; confirmar antes de la visita.',source:page.url});
   }
   for(const key of ['address','city','time','price'])if(extra[key]&&!result[key]){result[key]=extra[key];if(key==='time')venueTimeSource=page.url;}
  }
  const sameActivity=!['venue','contact'].includes(page.role)&&info.kind===result.kind&&(compatibleWork||page.role==='translation')&&!multipleWorks;
  if(sameActivity&&!page.notice){const hadWork=!!result.workTitle,hadVenue=!!result.venue;for(const key of ['address','date','endDate','time','occurrences','price','cuisine','category','lead','dimensions','shop','venue','workTitle','image','scheduleMode'])if((!result[key]||Array.isArray(result[key])&&!result[key].length)&&info[key])result[key]=info[key];
   if((page.role==='translation'||!pageText(primary.html).synopsis&&(page.role==='synopsis'||pageText(page.html).synopsis))&&info.summary){result.summary=info.summary;result.summaryEvidenceUrl=page.url}
   if(info.workTitle&&(!hadWork||!hadVenue)){result.title=info.title;result.workTitle=info.workTitle;result.venue=info.venue||result.venue}
  }
 }
 const locations=details.filter(({page,info})=>['venue','contact'].includes(page.role)&&!result.rejectedFields?.includes('address')&&info.city&&/Dirección|postal/.test(info.locationEvidence));const zones=[...new Set(locations.map(({info})=>info.city))];
 if(!result.city&&zones.length===1&&!/fuera de Espa|Otro destino/.test(result.locationEvidence)){result.city=zones[0];result.locationEvidence='Dirección contrastada en una página enlazada';if(!result.address&&!multipleWorks&&new Set(locations.map(({info})=>info.address).filter(Boolean)).size===1)result.address=locations[0].info.address}
 let budget=100000;const content=pages.map((p,i)=>{const reading=pageText(p.html);const limit=Math.min(budget,i===0?45000:25000);budget-=Math.min(limit,reading.text.length);return {url:p.url,role:p.role,label:p.label,text:evidenceText(reading,limit),synopsis:reading.synopsis||'',structuredData:[...p.html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n').slice(0,15000)}});
 const verifiedSchedule=result.scheduleMode==='recurring'?result.time:'';
 const verifiedPeriod=result.occurrences?.length?{date:result.date,endDate:result.endDate}:null;
 const baseline=structuredClone(result);
 const ai=await analyze({url,extracted:result,pages:content});result.aiStatus=ai.status;
 const verifiedPrice=/reserva|inscrip|taquilla|en l[ií]nea|online|gratu[iï]t/i.test(result.price||'')?result.price:'';
 if(ai.status==='ready'){for(const [key,value]of Object.entries(ai.data))if(value||['kind','city'].includes(key)){if(key==='price'&&/[-–]/.test(result.price||'')&&/^\d+(?:[.,]\d+)?$/.test(value))continue;result[key]=value};if(ai.data.summary)result.summarySource='ai';}
 if(verifiedPrice)result.price=verifiedPrice;
 if(result.kind==='plan'&&result.workTitle)result.title=result.workTitle;if(result.kind==='buy')result.city='';result.needsReview=result.kind==='inbox'||!!result.notice;if(result.occurrences?.length){if(verifiedSchedule)result.time=verifiedSchedule;else result.time=result.scheduleMode==='sessions'?EventData.sessionLabel(result.occurrences):scheduleLabel(result.occurrences);if(verifiedPeriod){result.date=verifiedPeriod.date;result.endDate=verifiedPeriod.endDate;}}result.researchPages=String(pages.length);return assess(require('./verification.cjs').verify(result,pages,baseline),pages);
}
function openingSlot(value){
 const m=String(value).match(/\b(\d{1,2})(?:[:.]([0-5]\d))?\s*h?\s*(?:a|[-–—]|to)\s*(\d{1,2})(?:[:.]([0-5]\d))?\s*h?\b/i);
 return m?[Number(m[1]),m[2]||'00',Number(m[3]),m[4]||'00'].join(':'):'';
}
function needsRendering(page,info){
 const reading=pageText(page.html);
 if(info.kind==='inbox'||!info.summary||reading.text.length<350)return true;
 // Missing a venue's tariff/address is a research problem, not evidence of client-side rendering.
 return info.kind==='plan'&&(!info.date||!info.time)&&/__(?:NEXT|NUXT)_DATA__|ng-app|data-controller|id=["'](?:root|app)["']|loading|carregant|cargando/i.test(page.html);
}
function evidenceText(reading,limit){
 const priority=reading.blocks.filter(t=>/fecha|dates|horari|precio|preu|tarifa|inscrip|entrada|ubicaci|direcci|carrer|calle|plaça|plaza|sinopsis|argumento|\d{1,2}[:.]\d{2}|€/i.test(t)).join('\n');
 const sections=[reading.synopsis,priority.slice(0,Math.floor(limit*.45)),reading.text.slice(0,Math.floor(limit*.4)),reading.text.slice(-Math.floor(limit*.15))].filter(Boolean);
 return [...new Set(sections)].join('\n').slice(0,limit);
}
function assess(result,pages){
 const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 for(const key of ['date','endDate'])if(result[key]&&!valid(result[key])){result[key]='';result.notice='Hay fechas que no se han podido verificar.'}
 if(result.date&&result.endDate&&result.endDate<result.date){result.endDate='';result.notice='El periodo publicado necesita revisión.'}
 result.extraction={sources:pages.map(p=>({url:p.url,format:p.format||'html',rendered:!!p.rendered})),missing:[]};
 if(!result.summary)result.extraction.missing.push('descripción');
 if(!result.price)result.extraction.missing.push('precio');
 if(result.kind==='plan'&&!result.date&&pages.some(p=>/fechas? y horas?|dates i entrades|fecha y horario|dates and tickets/i.test(pageText(p.html).text)))result.extraction.missing.push('fecha');
 if(result.kind==='plan'&&result.date&&!result.time)result.extraction.missing.push('horario');
 if(['plan','restaurant'].includes(result.kind)&&!result.address)result.extraction.missing.push('dirección');
 if(result.extraction.missing.length&&!result.notice)result.notice='No se ha podido verificar: '+result.extraction.missing.join(', ')+'.';
 result.needsReview=result.kind==='inbox'||!!result.notice;if(result.verification&&result.needsReview)result.verification.status='review';return result;
}
module.exports={research,candidates,evidenceText,assess};
