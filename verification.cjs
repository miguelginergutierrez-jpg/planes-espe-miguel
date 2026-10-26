const {pageText,region,scheduleLabel}=require('./classifier.js');
const E=require('./event-data.js');
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const fields=['date','endDate','time','price','address','venue','city'];
function identity(a,b){const x=fold(a.workTitle||a.title),y=fold(b.workTitle||b.title);return !!x&&!!y&&x===y;}
function verify(result,pages,baseline){
 const issues=[],rejected=new Set(result.rejectedFields||[]);const primary=pages[0];
 // AI may rewrite prose, but must not silently replace concrete source values.
 if(baseline&&result.aiStatus==='ready')for(const key of fields){if(baseline[key]&&result[key]&&fold(baseline[key])!==fold(result[key])){issues.push({field:key,reason:'La interpretación difiere del dato extraído de la fuente; se conserva la fuente.'});result[key]=baseline[key]}}
 if(baseline&&result.aiStatus==='ready'){
  const blocks=pages.filter(p=>!['contact','venue'].includes(p.role)).flatMap(p=>pageText(p.html).blocks).filter(t=>!/(?:naci[oó]|falleci[oó]|estreno absoluto|estrena absoluta|publicado el)/i.test(t));
  for(const key of ['date','endDate','time','price','address'])if(result[key]&&!baseline[key]){
   let supported=false;
   if(key==='date'||key==='endDate')supported=blocks.some(t=>E.dateIn(t)===result[key]||Object.values(E.period(t)).includes(result[key]));
   if(key==='time'){const clocks=result.time.match(/\d{1,2}:\d{2}/g)||[];supported=clocks.length>0&&clocks.every(c=>{const [h,m]=c.split(':');return blocks.some(t=>new RegExp('\\b'+Number(h)+'[:.]'+m+'\\b').test(t)||m==='00'&&new RegExp('\\b'+Number(h)+'\\s*h\\b').test(t))})}
   if(key==='price'){const prices=result.price.match(/\d+(?:[.,]\d+)?/g)||[];supported=prices.length>0&&prices.every(n=>blocks.some(t=>/€|euros?|tarifa|precios?|preus?/i.test(t)&&t.replace(/,/g,'.').includes(n.replace(',','.'))));if(!prices.length)supported=/gratis|gratuit|free/i.test(result.price)&&blocks.some(t=>/entrada.*(?:gratis|gratuit)|(?:gratis|gratuit).*entrada/i.test(t))}
   if(key==='address'){const words=fold(result.address).split(' ').filter(w=>w.length>2);supported=words.length>2&&pages.some(p=>{const body=fold(pageText(p.html).text);return words.every(w=>body.includes(w))})}
   if(!supported){result[key]='';rejected.add(key);issues.push({field:key,reason:'La interpretación no tiene evidencia suficiente en las páginas leídas.'})}
  }
 }
 const valid=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')&&!isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 const clock=t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t||'');
 for(const key of ['date','endDate'])if(result[key]&&!valid(result[key])){result[key]='';rejected.add(key);issues.push({field:key,reason:'Fecha imposible o incompleta.'})}
 if(result.date&&result.endDate&&result.endDate<result.date){result.endDate='';rejected.add('endDate');issues.push({field:'endDate',reason:'La fecha final precede a la inicial.'})}
 if(result.occurrences?.length){const rows=result.occurrences.filter(o=>valid(o.date)&&clock(o.time)).map(o=>({...o,endTime:clock(o.endTime)&&o.endTime!==o.time?o.endTime:''}));result.occurrences=[...new Map(rows.map(o=>[o.date+' '+o.time,o])).values()].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));if(result.scheduleMode==='sessions'&&rows.length){result.date=result.occurrences[0].date;result.endDate=result.occurrences.at(-1).date;result.time=E.sessionLabel(result.occurrences)}}
 if(primary&&result.address){const scoped=pageText(primary.html).text;const sourceScope=fold(scoped);const institutionOnly=!sourceScope.includes(fold(result.address))&&/se podr[aá] ver en|trasladad[oa]|sede administrativa/i.test(scoped);if(institutionOnly&&result.rejectedFields?.includes('address')){result.address='';rejected.add('address')}}
 if(result.kind!=='buy'&&result.address){const zone=region(result.address);if(zone&&result.city&&result.city!==zone){result.city=zone;issues.push({field:'city',reason:'La dirección determina una zona distinta; se usa la dirección.'})}}
 if(result.summary&&/^(?:[^:]+:\s*)?(?:Comprar entradas|Reserva tus entradas|El tratamiento psicológico.*soberbio)/i.test(result.summary)){result.summary='';rejected.add('summary');issues.push({field:'summary',reason:'El texto no describe la actividad.'})}
 // Report unresolved contradictory dates between pages that unequivocally identify the same work.
 for(const page of pages.slice(1)){if(['contact','venue'].includes(page.role))continue;const info=require('./classifier.js').classify(page.url,page.html);if(!identity(result,info))continue;if(info.date&&result.date&&info.date!==result.date&&!(result.occurrences||[]).some(o=>o.date===info.date)){issues.push({field:'date',reason:'Una página enlazada publica otra fecha; se conserva la ficha principal.',source:page.url})}}
 result.rejectedFields=[...rejected];result.verification={checkedAt:new Date().toISOString(),status:issues.length||rejected.size?'review':'checked',issues,sources:pages.map(p=>p.url)};
 if(issues.length){result.needsReview=true;result.notice=[result.notice,'Hay diferencias entre fuentes o datos pendientes de revisar.'].filter(Boolean).join(' ')}
 return result;
}
module.exports={verify,identity};
