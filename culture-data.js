(function(root){
const E=typeof module!=='undefined'?require('./event-data.js'):root.EventData;
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function enrich(result,html,reading,clean){
 const r=result,head=reading.blocks.slice(0,35),text=reading.text;r.rejectedFields=[];
 if(r.activityType==='Exposición'){const place=head.find(t=>/^IVAM Centre/i.test(t)&&t.length<100)||head.find(t=>/^Muse[ou] (?!Anfibio)/i.test(t)&&t.length<100);if(place)r.venue=place;}
 const declared=head.find(t=>/^(?:ópera|opera|dansa|danza|concierto|concert|cine|cinema|exposición|exposició)$/i.test(t));
 const type=declared?(/opera/.test(fold(declared))?'Ópera':/dansa|danza/i.test(declared)?'Danza':/concert|concierto/i.test(declared)?'Concierto':/cine/i.test(declared)?'Cine':'Exposición'):'';
 if(!type&&r.kind==='plan'&&/concierto|concert/i.test(head.join(' '))&&r.activityType==='Visita')r.activityType='Concierto';
 if(type&&r.kind==='plan'){r.activityType=type;r.workTitle=r.title;if(r.summary)r.summary=type+': '+r.summary.replace(/^(?:Teatro|Ópera|Concierto|Danza|Cine|Exposición|Visita)\s*:\s*/,'')}
 const minimum=text.match(/\b(?:desde|a partir de|des de|from)\s+(\d+(?:[.,]\d+)?)\s*€/i);if(minimum&&(!r.price||Number(r.price.replace(',','.'))===Number(minimum[1].replace(',','.'))))r.price='Desde '+minimum[1]+' €';
 // A relocated production must never inherit the institution's administrative address.
 const relocation=head.find(t=>/se podr[aá] ver en|se representar[aá] en|trasladad[oa] a|nova ubicaci[oó]/i.test(t));if(relocation){const venue=relocation.replace(/^.*?(?:se podr[aá] ver en|se representar[aá] en|trasladad[oa] a|nova ubicaci[oó]\s*:)\s*(?:el |la )?/i,'').trim();if(venue){r.venue=venue;r.address='';r.rejectedFields.push('address');r.notice='El espectáculo se ha trasladado de sede; falta contrastar la dirección exacta.'}}
 // Dedicated numeric date and clock lines (rather than publication dates in prose).
 if(!r.date){const i=head.findIndex(t=>/^\d{1,2}[/.]\d{1,2}[/.]\d{4}$/.test(t));if(i>=0&&/^\d{1,2}:\d{2}$/.test(head[i+1]||'')){r.date=E.dateIn(head[i]);r.endDate=r.date;r.time=head[i+1];r.occurrences=[{date:r.date,time:r.time,endTime:''}];r.scheduleMode='single'}}
 // Calendar widgets store event-specific JSON outside script tags. Require the canonical URL in their description.
 for(const m of html.matchAll(/<div\b[^>]*class=["'][^"']*\batcb\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi))try{
  const value=JSON.parse(m[1].trim()),canonical=r.url.replace(/\/$/,'');if(!String(value.description||'').includes(canonical))continue;
  const rows=(value.dates||[value]).filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x.startDate||'')&&/^\d{2}:\d{2}$/.test(x.startTime||''));
  if(!rows.length)continue;r.occurrences=rows.map(x=>({date:x.startDate,time:x.startTime,endTime:x.endTime===x.startTime?'':x.endTime||''}));r.date=rows[0].startDate;r.endDate=rows.at(-1).endDate||rows.at(-1).startDate;r.time=rows.map(x=>x.startTime+(x.endTime&&x.endTime!==x.startTime?'–'+x.endTime:'')).join('; ');r.scheduleMode='single';
  const title=(html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||[])[1];if(title&&/LIGHT|festival|spectacle/i.test(r.title)){r.title=r.workTitle=r.originalTitle.replace(/\s+[–—-]\s+Mercat de les Flors.*$/i,'').replace(/^Festival[^:]+:\s*/i,'');r.activityType=/performance/i.test(text)?'Performance':r.activityType}
 }catch{}
 // Parse a JSON literal only; never evaluate scripts from the source.
 const analytics=html.match(/window\.reAnalyticsSesiones\s*=\s*(\{[^\n]+\})\s*;/);
 if(analytics)try{const sessions=Object.values(JSON.parse(analytics[1]));const names=[...new Set(sessions.map(s=>s.item_name))];if(names.length===1&&fold(r.originalTitle).includes(fold(names[0]))){const rows=sessions.filter(s=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s.session_datetime)).map(s=>({date:s.session_datetime.slice(0,10),time:s.session_datetime.slice(11,16),label:[s.item_category4,s.item_category5].filter(Boolean).join(' · '),endTime:''})).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));if(rows.length){r.kind='plan';r.title=r.workTitle=names[0];r.activityType='Cine';r.venue=sessions[0].item_category3.replace(/\s+/g,' ');r.occurrences=rows;r.scheduleMode='sessions';r.date=rows[0].date;r.endDate=rows.at(-1).date;r.time=E.sessionLabel(rows);if(r.summary&&!/^Cine/.test(r.summary))r.summary='Cine: '+r.summary}}}catch{}
 if(r.kind==='plan'&&r.activityType==='Concierto'){const title=clean((reading.mainHtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)||[])[1]);if(title&&!/logotipo|logo|orfeo catala/i.test(fold(title)))r.title=r.workTitle=title;else r.title=r.workTitle=r.title.replace(/-?\s*[—–].*$/,'').trim();}
 if(/^Event(?:\s*[–—-]|$)/i.test(r.title)){const performer=head.find(t=>t.length>10&&t===t.toUpperCase()&&/ORCHESTRA|ORQUESTRA|ORQUESTA|QUARTET|ENSEMBLE/.test(t));if(performer){r.title=r.workTitle=performer;r.activityType='Concierto';r.venue=head.find(t=>/^SALA\b/.test(t))||r.venue;const program=head.filter(t=>/\bop\.|sinfon[ií]a|concierto.*menor/i.test(t)).slice(0,2);r.summary='Concierto de '+performer+(program.length?'. Programa: '+program.join('; '):'.');}}
 // Prefer a plot paragraph to a director's reflection about rehearsals or verse.
 const narrative=reading.paragraphs.find(t=>t.length>100&&t.length<1800&&/\b(?:enamora|enamorad|acuden a casa|su nuevo comienzo|se ve interrumpido|la obra habla|la historia sigue|drama musical|mito del)\b/i.test(t));if(narrative&&(!r.summary||/verso exige|resulta soberbio|Comprar entradas/i.test(r.summary))){const sentences=narrative.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[narrative];r.summary=(r.activityType!=='Visita'?r.activityType+': ':'')+sentences.slice(0,2).join('').trim();if(r.summary.length>380)r.summary=r.summary.slice(0,377).replace(/\s+\S*$/,'')+'…';}
 return r;
}
const API={enrich};if(typeof module!=='undefined')module.exports=API;else root.CultureData=API;
})(typeof window!=='undefined'?window:globalThis);
