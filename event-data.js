(function(root){
'use strict';
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const iso=(day,month,year)=>{year=Number(year);if(year<100)year+=2000;const value=year+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');const d=new Date(value+'T12:00:00Z');return !isNaN(d)&&d.toISOString().slice(0,10)===value?value:''};
const months={enero:1,ene:1,gener:1,gen:1,january:1,jan:1,febrero:2,febrer:2,february:2,feb:2,marzo:3,marc:3,march:3,mar:3,abril:4,april:4,abr:4,apr:4,mayo:5,maig:5,may:5,junio:6,juny:6,june:6,jun:6,julio:7,juliol:7,july:7,jul:7,agosto:8,agost:8,august:8,ago:8,aug:8,septiembre:9,setembre:9,september:9,sept:9,sep:9,octubre:10,october:10,oct:10,noviembre:11,novembre:11,november:11,nov:11,diciembre:12,desembre:12,des:12,december:12,dic:12,dec:12};
const monthNames=Object.keys(months).sort((a,b)=>b.length-a.length).join('|');
function block(html,predicate){
 for(const m of html.matchAll(/<(main|section|article|div)\b[^>]*>/gi)){if(!predicate(m[0]))continue;const tag=m[1],tokens=new RegExp('<\\/?'+tag+'\\b[^>]*>','gi');tokens.lastIndex=m.index+m[0].length;let depth=1,n;while((n=tokens.exec(html))){depth+=/^<\//.test(n[0])?-1:1;if(!depth)return html.slice(m.index,tokens.lastIndex)}}return '';
}
function scope(html){return block(html,t=>/id=["'](?:contenidor-detall|event-page)["']/i.test(t))||block(html,t=>/^<main\b/i.test(t)||/role=["']main["']/i.test(t))||block(html,t=>/class=["'][^"']*\b(?:ficha-confotos|espect-content-area)\b/i.test(t))||html;}
function explicitSessions(blocks,start,end){
 if(!start)return [];const years=[...new Set([start.slice(0,4),(end||start).slice(0,4)])];let inherited='',label='';const found=[];
 for(let i=0;i<blocks.length;i++){const line=blocks[i],s=fold(line);if(/^(?:funciones|sessions|sesiones)\s+(?:matinal|vespertin)/.test(s)){const t=s.match(/(\d{1,2})[:.]([0-5]\d)/);inherited=t?t[1].padStart(2,'0')+':'+t[2]:'';label=/matinal/.test(s)?'Función matinal':'';continue}
  if(/venta|estrenad|naci[oó]|falleci|publicad|accesible/i.test(line))continue;
  let date=dateIn(line);if(!date){const m=s.match(new RegExp('\\b(\\d{1,2})\\s*(?:de\\s+|d[’\x27])?('+monthNames+')\\b'));if(m){const possible=years.map(y=>iso(m[1],months[m[2]],y)).filter(d=>d&&d>=start&&d<=(end||start));if(possible.length===1)date=possible[0]}}
  if(!date||date<start||date>(end||start))continue;
  const rest=line.replace(/\b\d{1,2}[/.]\d{1,2}[/.](?:\d{4}|\d{2})\b/g,'').replace(/\d{4}-\d{2}-\d{2}/g,'');let clocks=[...rest.matchAll(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:h)?|\b([01]?\d|2[0-3])\s*h\b/g)].map(m=>(m[1]||m[3]).padStart(2,'0')+':'+(m[2]||'00'));
  if(!clocks.length&&/^\s*(?:\d{1,2}[/.]\d{1,2}[/.]\d{2,4}|\d{4}-\d{2}-\d{2})\s*$/.test(line)&&/^\d{1,2}:\d{2}$/.test(blocks[i+1]||''))clocks=[blocks[i+1].padStart(5,'0')];
  if(!clocks.length&&dateIn(line)&&line.length<45){const next=blocks.slice(i+1,i+4);for(const t of next){const clock=t.match(/^(\d{1,2})[:.]([0-5]\d)\s*h?$/);if(clock){clocks=[clock[1].padStart(2,'0')+':'+clock[2]];break}if(!/^(?:lunes|martes|miércoles|jueves|viernes|sábado|domingo|dilluns|dimarts|dimecres|dijous|divendres|dissabte|diumenge)$/i.test(t))break}}
  if(!clocks.length&&inherited)clocks=[inherited];for(const time of clocks)found.push({date,time,endTime:'',label});
 }return [...new Map(found.map(o=>[o.date+' '+o.time,o])).values()].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
}
function dateIn(text){
 const s=fold(text).replace(/\s+/g,' ');
 let m=s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);if(m)return iso(m[3],m[2],m[1]);
 m=s.match(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4}|\d{2})\b/);if(m)return iso(m[1],m[2],m[3]);
 m=s.match(new RegExp('\\b(\\d{1,2})\\s*(?:de\\s+|d[’\x27]\\s*)?('+monthNames+')\\.?\\s+(?:(?:de|del)\\s+)?(\\d{4}|\\d{2})\\b'));if(m)return iso(m[1],months[m[2]],m[3]);
 m=s.match(new RegExp('\\b('+monthNames+')\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?[,]?\\s+(\\d{4})\\b'));return m?iso(m[2],months[m[1]],m[3]):'';
}
function section(html,headingPattern,clean){
 const heads=[...html.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
 const start=heads.findIndex(h=>headingPattern.test(fold(clean(h[2]))));if(start<0)return '';
 const first=heads[start],next=heads.slice(start+1).find(h=>Number(h[1])<=Number(first[1]));
 return html.slice(first.index+first[0].length,next?.index??html.length);
}
function practical(html,blocks,clean){
 const area=section(html,/informaci[o]n practica|informacio practica|practical information|event details/,clean);
 const dated=section(area||html,/^(?:fechas? y (?:horas?|horarios?)|dates? i horaris?|data i horari|dates? and times?|fechas?|dates?|data)$/,clean);
 const prices=section(area||html,/^(?:precios?|preus?|tarifas?|prices?|admission)$/,clean);
 // Definition lists and labelled paragraphs are common in municipal agendas and museum CMSes.
 // Read the explicitly labelled event period before any date mentioned in biography or related activities.
 const labels=[...html.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)];
 const labelled=labels.filter(m=>/^(?:cuando|quan|fechas?|dates?|data|periodo|periode)\s*:?$/i.test(fold(clean(m[1])))).map(m=>clean(m[2]));
 labelled.push(...blocks.filter(p=>/^(?:fechas?|dates?|data|cuando|quan|periodo|periode)\s*:/i.test(fold(p))&&!/inaugura|publica/i.test(fold(p))));
 const out={};const datedText=clean(dated)||labelled[0]||'',range=period(datedText),date=dateIn(datedText);
 if(range.date)Object.assign(out,range);
 else if(date)out.date=date;
 else for(const b of blocks){if(/^(?:\d{1,2}\s+(?:de\s+|d[’']\s*)?[\p{L}]+|\d{4}-\d{2}-\d{2})/u.test(b)){const span=period(b);if(span.date){Object.assign(out,span);break;}if(!/[–—]/.test(b)){const d=dateIn(b);if(d){out.date=d;break;}}}}
 const hours=clean(dated).match(/\b([01]?\d|2[0-3])[:.]([0-5]\d)\s*(?:h\s*)?[-–—]\s*([01]?\d|2[0-3])[:.]([0-5]\d)/);
 if(hours&&!/lunes|martes|miercoles|jueves|viernes|sabados?|domingos?|dilluns|dimarts|dimecres|dijous|divendres|dissabtes?|diumenges?/i.test(fold(datedText)))out.timeText=hours[1].padStart(2,'0')+':'+hours[2]+' - '+hours[3].padStart(2,'0')+':'+hours[4];
 if(prices){const lines=prices.replace(/<\/(?:p|div|li)>/gi,'\n').replace(/<br\s*\/?>/gi,'\n').split('\n').map(clean).filter(Boolean);const tariff=lines.find(l=>l.length<200&&(/\d\s*(?:€|EUR|euros?)/i.test(l)||/gratuit|gratis|free|entrada (?:libre|lliure)/i.test(fold(l))));if(tariff)out.price=tariff;}
 const table=openingTables(html,clean);if(table.timeText)out.timeText=table.timeText;if(table.price&&!out.price)out.price=table.price;
 return out;
}
function openingTables(html,clean){
 const lines=[],prices=[];
 for(const table of html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)){
  const rows=[...table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const headers=rows.flatMap(r=>[...r[1].matchAll(/<th\b[^>]*>([\s\S]*?)<\/th>/gi)].map(m=>fold(clean(m[1]))));
  if(!headers.some(h=>/^(?:dias?|dies?|days?|horarios?|horaris?|horas?|hores?|hours?)$/.test(h)))continue;
  for(const row of rows){
   const cells=[...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m=>clean(m[1]));
   const day=cells.find(c=>c.length<160&&/\b(?:lunes|martes|miercoles|jueves|viernes|sabados?|domingos?|dilluns|dimarts|dimecres|dijous|divendres|dissabtes?|diumenges?|festivos?|festius?|daily|diari)\b/i.test(fold(c)));
   const hours=cells.find(c=>c.length<180&&/\d{1,2}[:.]\d{2}|\d{1,2}\s*h\b|cerrad|tancat/i.test(c));
   if(!day||!hours)continue;
   lines.push(day===hours?day:day+': '+hours);
   const price=cells.find(c=>c!==hours&&c.length<180&&/\d\s*(?:€|EUR|euros?)|gratuit|gratis|free|entrada (?:libre|lliure)/i.test(fold(c)));if(price)prices.push(price);
  }
 }
 return {timeText:[...new Set(lines)].join('; '),price:[...new Set(prices)].join('; ')};
}
function datedRows(html,clean){
 const items=[];
 // A row is the boundary: dates, times and restrictions never leak from a neighbouring performance.
 const tables=[...html.matchAll(/<(tr)\b([^>]*)>([\s\S]*?)<\/\1>/gi)];
 const rows=tables.length?tables:[...html.matchAll(/<(li|article)\b([^>]*)>([\s\S]*?)<\/\1>/gi)];
 for(const row of rows){
  const body=row[3];if(!/<time\b|session|performance|occurrence|funcion|funcio|session/i.test(row[2]+' '+body))continue;
  if(/<(?:tr|li|article)\b/i.test(body))continue;
  // A complete film article may contain several day groups plus a release date.
  // Only a bounded performance item can pair a date with all its clocks.
  if(row[1].toLowerCase()!=='tr'&&!/\b(?:session|performance|occurrence|funcion|funcio)[\w-]*/i.test(row[2]))continue;
  const dateLabels=[...new Set([...body.matchAll(/<time\b[^>]*>([\s\S]*?)<\/time>/gi)].map(m=>dateIn(clean(m[1]))).filter(Boolean))];
  if(dateLabels.length>1)continue;
  const text=clean(body),date=dateLabels[0]||dateIn(text);if(!date)continue;
  const visibleTimes=[...body.matchAll(/<(?:time|td|span)\b[^>]*>\s*(\d{1,2})[:.]([0-5]\d)\s*(?:h)?\s*<\//gi)].map(m=>m[1].padStart(2,'0')+':'+m[2]);
  const clocks=[...body.matchAll(/datetime\s*=\s*["'](\d{4}-\d{2}-\d{2})(?:T|\s|CET|CEST)(\d{2}:[0-5]\d)[^"']*["']/gi)];
  const times=visibleTimes.length?visibleTimes:clocks.filter(m=>m[1]===date).map(m=>m[2]);
  const labels=[];const digital=/estrena digital|estreno digital|streaming|online|on-line|retransmissio|retransmision/i.test(fold(text));
  if(digital)labels.push('Sesión digital');
  const restriction=text.match(/(?:Funci[oó] (?:exclusiva )?menors?\s*\d+\s*anys|(?:solo|exclusiv[ao]).{0,30}(?:menores|mayores)\s*(?:de\s*)?\d+\s*años)/i);if(restriction)labels.push(restriction[0]);
  const link=(body.match(/<a\b[^>]*href=["']([^"']+)["']/i)||[])[1]||'';
  for(const time of new Set(times))if(Number(time.slice(0,2))<24)items.push({date,time,endTime:'',label:labels.join(' · '),mode:digital?'online':'onsite',url:link});
 }
 return unique(items);
}
function embeddedEvents(html,title){
 const events=[],target=fold(title).replace(/\s*[|].*$/,'').trim();let visited=0;
 function visit(value,inherited=''){
  if(!value||typeof value!=='object'||++visited>20000)return;
  if(Array.isArray(value)){value.forEach(v=>visit(v,inherited));return;}
  const name=typeof value.name==='string'?value.name:typeof value.title==='string'?value.title:inherited;
  const start=value.startDate||value.startDateTime||value.startsAt||value.start_at||value.start_date||(value.date&&value.time?value.date+'T'+value.time:'');
  const finish=value.endDate||value.endDateTime||value.endsAt||value.end_at||value.end_date||'';
  if(typeof start==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(start)&&name&&fold(name).trim()===target){events.push({'@type':value['@type']||'Event',name,startDate:start,endDate:typeof finish==='string'?finish:'',location:value.location,offers:value.offers,description:typeof value.description==='string'?value.description:''});}
  for(const child of Object.values(value))if(child&&typeof child==='object')visit(child,name);
 }
 for(const script of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
  if(!/type\s*=\s*["']application\/json["']|id\s*=\s*["']__(?:NEXT|NUXT)_DATA__["']/i.test(script[1])||script[2].length>1500000)continue;
  try{visit(JSON.parse(script[2]));}catch{}
 }
 return [...new Map(events.map(e=>[e.name+' '+e.startDate+' '+e.endDate,e])).values()];
}
function plotSummary(reading,type,entity){
 if(!['Ópera','Teatro'].includes(type))return '';
 const boundary=reading.paragraphs.findIndex(p=>/^(?:dates i entrades|fechas y entradas|dates and tickets|fitxa artistica|ficha artistica)$/i.test(fold(p)));
 const text=reading.paragraphs.slice(0,boundary<0?35:boundary).join(' '),normalized=fold(text);
 const name="[\\p{Lu}][\\p{L}’'-]+(?:\\s+[\\p{Lu}][\\p{L}’'-]+)*";
 const characters=text.match(new RegExp('('+name+'\\s+(?:y|i)\\s+'+name+')\\s+(?:encarnan|encarnen|viven|viuen|protagonizan|protagonitzen)\\s+(?:un amor|una historia de amor)','u'));
 if(!characters)return '';
 const setting=text.match(/\bun\s+([\p{Lu}][\p{L}’-]+)\s+(?:íntimo|íntim|bohemio|bohemi|lleno|ple)\b/u)?.[1]||'';
 const composer=entity?.composer?.name||'',pair=characters[1].replace(/\s+i\s+/,' y ');
 let summary=type+(composer?' de '+composer:'')+' sobre el amor de '+pair;
 const youngArtists=/jovenes.{0,25}artistas|artistas.{0,25}jovenes|artistes.{0,25}joves|joves.{0,25}artistes/.test(normalized);
 if(youngArtists)summary+=' y la vida de jóvenes artistas';
 if(setting)summary+=' en '+setting;
 const themes=[];if(/pobreza|pobresa|precariedad|precarietat/.test(normalized))themes.push('la pobreza');
 if(/(?:comiat|despedida).{0,100}tragic/.test(normalized))themes.push('una despedida trágica');
 if(themes.length)summary+=', marcada por '+themes.join(' y ');
 return summary+'.';
}
function period(text){
 const s=String(text).replace(/\s+/g,' '),out={};
 const named=s.match(/(\d{1,2}\s+[\p{L}]+\.?\s+\d{4})\s*[–—-]\s*(\d{1,2}\s+[\p{L}]+\.?\s+\d{4})/u);if(named){const date=dateIn(named[1]),endDate=dateIn(named[2]);if(date&&endDate&&endDate>=date)return {date,endDate};}
 const r=s.match(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}|\d{2}))?\s*(?:[–—−-]|al?|hasta|fins\s+(?:al?\s+)?)\s*(\d{1,2})[/.](\d{1,2})[/.](\d{4}|\d{2})\b/i);
 if(r){out.date=iso(r[1],r[2],r[3]||Number(r[6])-(Number(r[2])>Number(r[5])?1:0));out.endDate=iso(r[4],r[5],r[6]);if(out.date&&out.endDate>=out.date)return out;}
 const words=fold(s).match(new RegExp('\\b(\\d{1,2})\\s*(?:de\\s+|d[’\x27]\\s*)?('+monthNames+')?\\.?(?:\\s+(?:(?:de|del)\\s+)?(\\d{4}))?\\s*(?:al?|hasta|fins\\s+(?:al?\\s+)?|[-–—])\\s*(\\d{1,2})\\s*(?:de\\s+|d[’\x27]\\s*)?('+monthNames+')\\.?\\s*(?:(?:de|del)\\s+)?(\\d{4})\\b'));
 if(words){const sm=months[words[2]||words[5]],em=months[words[5]];const date=iso(words[1],sm,words[3]||Number(words[6])-(sm>em?1:0)),endDate=iso(words[4],em,words[6]);if(date&&endDate>=date)return {date,endDate};}
 return {};
}
const heading=/^(?:fechas? y (?:horas?|horarios?)|data i horari|horarios?|horaris?|funciones|sessions?)\s*[:：]?$/i;
const stop=/^(?:duraci[oó]n|durada|lloc|lugar|idioma|precios?|preus?|tarifas?|accessibilitat|accesibilidad|atenci[oó]n?|direcci[oó]n|contacto|m[aá]s informaci[oó]n|fitxa|ficha t[eé]cnica)\b/i;
function schedule(paragraphs){
 let lines=[];
 const start=paragraphs.findIndex(p=>heading.test(p));
 if(start>=0){for(let i=start+1;i<Math.min(start+16,paragraphs.length);i++){const p=paragraphs[i];if(stop.test(p))break;if(/\d{1,2}[:.]\d{2}|\d{1,2}\s*h\b|cerrad|tancat/i.test(p)&&!/\d{4}\s*$/.test(p))lines.push(p);}}
 if(!lines.length)lines=paragraphs.filter(p=>p.length<350&&/lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bados?|domingos?|dilluns|dimarts|dimecres|dijous|divendres|dissabtes?|diumenges?/i.test(p)&&/\d{1,2}[:.]\d{2}|\d{1,2}\s*h\b/.test(p)&&!/^versi[oó]n|subtit|sobretitul/i.test(p)).slice(0,8);
 return [...new Set(lines)].join('; ');
}
function sessions(text){
 const items=[];
 for(const m of text.matchAll(/\b(\d{1,2})[/.](\d{1,2})[/.](\d{4}|\d{2})[ \t]*(?:\(|,[ \t]*|a (?:les|las)[ \t]*)?(\d{1,2}):(\d{2})(?!\d)/g)){
  const date=iso(m[1],m[2],m[3]);if(date&&Number(m[4])<24&&Number(m[5])<60)items.push({date,time:m[4].padStart(2,'0')+':'+m[5],endTime:''});
 }
 return unique(items);
}
function unique(items){return [...new Map(items.map(x=>[x.date+' '+x.time,x])).values()].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));}
function sessionLabel(items){
 const format=d=>new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T12:00:00Z'));
 const lines=items.map(o=>format(o.date)+': '+o.time+(o.endTime?'–'+o.endTime:'')+(o.label?' · '+o.label:''));
 const text=lines.join('; ');return text.length<=950?text:items.length+' sesiones · '+format(items[0].date)+' – '+format(items.at(-1).date)+' · Ver todas las funciones';
}
const days={lunes:1,martes:2,miercoles:3,jueves:4,viernes:5,sabado:6,sabados:6,domingo:0,domingos:0,dilluns:1,dimarts:2,dimecres:3,dijous:4,divendres:5,dissabte:6,dissabtes:6,diumenge:0,diumenges:0};
const dayNames=Object.keys(days).sort((a,b)=>b.length-a.length).join('|');
function slots(line){const result=[];for(const m of line.matchAll(/\b(\d{1,2})(?:[:.](\d{2})\s*(?:h\b)?|\s*h\b)/g)){if(Number(m[1])<24&&Number(m[2]||0)<60)result.push(m[1].padStart(2,'0')+':'+(m[2]||'00'));}return [...new Set(result)];}
function recurring(time,date,endDate){
 if(!date||!endDate||/festiv|festiu/i.test(time))return [];
 const rules=[],exceptions=[];
 for(const line of time.split(';')){
  const found=slots(line);if(!found.length)continue;
  const override=line.match(/\b(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}|\d{2}))?\s+a (?:les|las)\b/i);
  if(override){exceptions.push({date:iso(override[1],override[2],override[3]||date.slice(0,4)),times:found});continue;}
  const normalized=fold(line),range=normalized.match(new RegExp('\\b('+dayNames+')\\s+(?:a|al|hasta)\\s+(?:el |los |les |els )?('+dayNames+')\\b'));
  let selected=[];
  if(range){let n=days[range[1]];for(let i=0;i<7;i++,n=(n+1)%7){selected.push(n);if(n===days[range[2]])break;}}
  else selected=[...normalized.matchAll(new RegExp('\\b('+dayNames+')\\b','g'))].map(m=>days[m[1]]);
  if(selected.length&&!/cerrad|tancat/.test(normalized))rules.push({days:selected,times:found});
 }
 if(!rules.length)return [];
 const out=[],cursor=new Date(date+'T12:00:00Z');for(let i=0;i<400&&cursor.toISOString().slice(0,10)<=endDate;i++,cursor.setUTCDate(cursor.getUTCDate()+1)){
  const d=cursor.toISOString().slice(0,10),exception=exceptions.find(x=>x.date===d),times=exception?exception.times:rules.filter(r=>r.days.includes(cursor.getUTCDay())).flatMap(r=>r.times);
  for(const time of times)out.push({date:d,time,endTime:''});
 }
 return unique(out);
}
const shorten=(text,max)=>text.length<=max?text:text.slice(0,max-1).replace(/\s+\S*$/,'')+'…';
const titleCase=s=>s.toLocaleLowerCase('es').replace(/(^|[ .])\p{L}/gu,c=>c.toLocaleUpperCase('es'));
function components(paragraphs,html=''){
 const publishedTitles=[...html.matchAll(/<cite\b[^>]*>([\s\S]*?)<\/cite>/gi)].map(m=>m[1].replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim());
 const out=[];
 for(let i=0;i<paragraphs.length-1;i++){
  const line=paragraphs[i];if(line.length>140||!/^\p{Lu}[\p{Lu}\s.’'Ø-]{4,}\.\s*\p{Lu}[\p{Lu}\s.,’'Ø-]{2,}$/u.test(line))continue;
  const [artist,...work]=line.split(/\.\s+/),description=paragraphs[i+1];if(description.length<80)continue;
  const sentences=description.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[description];
  let excerpt=sentences.find(s=>/reactiva|explora|cuestiona|reivindica|aborda|investiga|reflexiona|analiza/.test(fold(s)))||sentences[0];
  const dialogue=description.match(/ha dialogado mediante ([^.]+)\./i);if(dialogue)excerpt=(/escritores/i.test(description)?'Diálogo con escritores mediante ':'Diálogo mediante ')+dialogue[1]+'.';
  excerpt=excerpt.replace(/^\s*(?:La artista|El artista|La muestra|Esta exposición)\s*/i,'').replace(/,\s*(?:una categoría|que la historia|una propuesta)[\s\S]*$/i,'.').trim();excerpt=excerpt.charAt(0).toUpperCase()+excerpt.slice(1);
  const workName=work.join('. ').toLocaleLowerCase('es');
  out.push({artist:titleCase(artist),title:publishedTitles.find(t=>fold(t)===fold(workName))||workName.charAt(0).toLocaleUpperCase('es')+workName.slice(1),description:shorten(excerpt,160)});
 }
 return out.slice(0,4);
}
function location(html,reading,siteName,pageTitle,hostname,clean){
 const titleParts=pageTitle.split(/\s*[|]\s*|\s+[-–]\s+/);
 const brand=siteName||titleParts.slice(1).find(p=>/teatr|cine|cinema|muse|centre|centro|virreina/i.test(p))||'';
 const paragraphs=reading.paragraphs,main=fold(reading.text),out={venue:brand,address:''};
 const where=paragraphs.find(p=>/^where:|^lugar:|^lloc:/i.test(p));if(where)out.venue=where.replace(/^[^:]+:\s*/,'');
 const labels=[...reading.mainHtml.matchAll(/<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi)];
 const labelled=pattern=>labels.find(m=>pattern.test(fold(clean(m[1])).replace(/:\s*$/,'')));
 const place=labelled(/^(?:donde|on|where|lugar|lloc)$/)||labelled(/^se celebra en$/);
 if(place)out.venue=clean((place[2].match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)||[])[1]||place[2]).replace(/\s*\.\s*$/,'');
 const streetLabel=labelled(/^(?:direccion|adreca|address)$/);
 if(streetLabel){const cityLabel=labelled(/^(?:ciudad|municipi|poblacio|city)$/);out.address=[clean(streetLabel[2]),cityLabel&&clean(cityLabel[2])].filter(Boolean).join(', ');}
 const street=/^(?:(?:carrer|calle|avinguda|avenida|passeig|paseo|plaça|plaza|rambla|la rambla|pg\.|pl\.|c\.)(?:\s+|,\s*))[\s\S]*\d/i;
 const local=paragraphs.findIndex(p=>p.length<180&&street.test(p));
 if(local>=0&&!out.address){out.address=paragraphs[local];const tail=paragraphs[local+1]||'';if(tail.length<75&&/barcelona|valencia|\b\d{5}\b/i.test(tail)&&!out.address.includes(tail))out.address+=', '+tail;}
 const footer=(html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)||[])[1]||'';
 // Choose a branch using the event's room, rather than the first address in the footer.
 const branches=[];for(const m of footer.matchAll(/<address\b[^>]*>([\s\S]*?)<\/address>/gi)){
  const before=footer.slice(0,m.index),heads=[...before.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)],name=clean(heads.at(-1)?.[1]||'');
  const lines=m[1].replace(/<br\s*\/?>/gi,'\n').split('\n').map(clean).filter(Boolean),address=[];
  for(const line of lines){if(/tel:|whatsapp|^\+?\d[\d ]{7,}|@/i.test(line))break;address.push(line);}
  const terms=fold(name).split(/\W+/).filter(t=>t.length>3&&!/lliure|teatre|teatro/.test(t));branches.push({name,address:address.join(', '),score:terms.filter(t=>main.includes(t)).length});
 }
 branches.sort((a,b)=>b.score-a.score);
 if(!out.address&&branches.length&&(branches.length===1||branches[0].score>branches[1].score)){out.address=branches[0].address;if(brand)out.venue=brand+(branches[0].name?' · '+branches[0].name:'');}
 const official=/cine|cinema|teatr|muse|cultural|cccb/i.test(brand+' '+hostname);
 if(!out.address&&official){const lines=footer.replace(/<br\s*\/?>/gi,'\n').replace(/<\/(?:p|div|address)>/gi,'\n').replace(/<[^>]*>/g,' ').split('\n').map(clean);out.address=lines.find(p=>p.length<180&&(street.test(p)||/\b\d{1,4}\s*,?\s*\b(?:03|12|46|08|17|25|43)\d{3}\b/.test(p)))||'';}
 if(!out.venue&&official)out.venue=hostname.replace(/^www\./,'').split('.')[0].replace(/cine$/i,'');
 return out;
}
const API={block,scope,explicitSessions,period,schedule,sessions,recurring,components,location,dateIn,section,practical,datedRows,sessionLabel,embeddedEvents,plotSummary};if(typeof module!=='undefined')module.exports=API;else root.EventData=API;
})(typeof window!=='undefined'?window:globalThis);
