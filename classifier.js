(function(root){
const CinemaData=typeof module!=='undefined'?require('./cinema-data.js'):root.CinemaData;
const CultureData=typeof module!=='undefined'?require('./culture-data.js'):root.CultureData;
const EventData=typeof module!=='undefined'?require('./event-data.js'):root.EventData;
const entities={aacute:'á',eacute:'é',iacute:'í',oacute:'ó',uacute:'ú',ntilde:'ñ',uuml:'ü',agrave:'à',egrave:'è',igrave:'ì',ograve:'ò',ugrave:'ù',ccedil:'ç',middot:'·',ndash:'–',mdash:'—',lsquo:'‘',rsquo:'’',ldquo:'“',rdquo:'”',hellip:'…',iquest:'¿',iexcl:'¡'};
const clean=s=>String(s||'').replace(/<[^>]*>/g,' ').replace(/&#(x[0-9a-f]+|[0-9]+);/gi,(_,n)=>{const v=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):parseInt(n,10);return v>0&&v<=0x10ffff?String.fromCodePoint(v):' '}).replace(/&([a-z]+);/gi,(whole,name)=>{const decoded=entities[name.toLowerCase()];return decoded?(name[0]===name[0].toUpperCase()?decoded.toUpperCase():decoded):whole}).replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
const flat=s=>clean(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const regions={Barcelona:/\b(barcelona|catalunya|cataluna|catalonia|girona|gerona|lleida|lerida|tarragona|costa brava|costa daurada|costa dorada|sitges|cadaques|figueres|figueras|besalu|blanes|lloret|tossa|reus|salou|cambrils|tortosa|manresa|vic|sabadell|terrassa|mataro|olot|puigcerda|cerdanya|aran|aiguestortes|montserrat|vallcarca|poble-sec|poblenou|barceloneta|sant gervasi|sarria|guinardo|es-ct)\b/,Valencia:/\b(valencia|comunitat valenciana|comunidad valenciana|valencian community|alicante|alacant|castellon|castello|costa blanca|costa azahar|denia|javea|xabia|altea|calpe|calp|benidorm|elche|elx|peniscola|morella|vilafames|xativa|gandia|oliva|cullera|sagunto|sagunt|alcoy|alcoi|orihuela|torrevieja|vinaros|benicassim|benicasim|ontinyent|bocairent|requena|utiel|ruzafa|russafa|benimaclet|cabanyal|canyamelar|patraix|campanar|es-vc)\b/};
function region(text){const matches=Object.entries(regions).filter(([,r])=>r.test(flat(text))).map(([k])=>k);return matches.length===1?matches[0]:''}

function attributes(tag){const values={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g))values[m[1].toLowerCase()]=clean(m[2]??m[3]??m[4]);return values;}
function pageHeading(html,metas){
 const area=EventData.scope(html).replace(/<(?:header|nav|footer)\b[^>]*>[\s\S]*?<\/(?:header|nav|footer)>/gi,'');
 const headings=[...area.matchAll(/<h([1-3])\b([^>]*)>([\s\S]*?)<\/h\1>/gi)].map(m=>({level:Number(m[1]),attrs:m[2],text:clean(m[3])}));
 const usable=h=>h.text&&!/site-name|logo|brand/i.test(h.attrs)&&!/^(?:inicio|home|agenda|programacion|programacio|exposicions?|exposiciones|exhibitions|actividades|activitats|search|buscar|redes)$/i.test(flat(h.text));
 const fullHeadings=[...html.matchAll(/<h[1-3]\b([^>]*)>([\s\S]*?)<\/h[1-3]>/gi)].map(m=>({attrs:m[1],text:clean(m[2])}));
 return headings.find(h=>h.level===1&&usable(h))?.text||metas['og:title']||metas['twitter:title']||fullHeadings.find(h=>usable(h)&&/\b(?:entry-title|page-title|title|titulo|titol)\b/i.test(h.attrs))?.text||headings.find(usable)?.text||'';
}
function pageImage(html,reading,entity,metas,url,title){
 const candidates=[],tokens=flat(title).split(/[^a-z0-9]+/).filter(t=>t.length>3),base=new URL(url);
 const canonical=value=>{if(typeof value!=='string'||!value.trim())return '';try{const u=new URL(value,base);return /^https?:$/.test(u.protocol)&&!u.username&&!u.password&&!/(?:^|\/)(?:undefined|null)\/?$/i.test(u.pathname)?u.href:'';}catch{return '';}};
 const decorative=value=>/(?:^|[\s/_\-.])(?:logo|favicon|icon|ico|sprite|placeholder|loading|loader|pixel|redessociales|sponsor|patrocinador)(?:[\s/_\-.]|$)|facebook|twitter|instagram|youtube|linkedin/i.test(value);
 function add(value,score,label='',width=0){
  if(Array.isArray(value)){value.forEach(v=>add(v,score,label,width));return;}if(value&&typeof value==='object'){add(value.contentUrl||value.url,score,label,Number(value.width)||width);return;}
  const image=canonical(value);if(!image||decorative(image+' '+label))return;
  const size=image.match(/[-_.](\d{2,4})x(\d{2,4})(?:[._-]|$)/);width=width||Number(size?.[1])||0;
  if(width&&width<100)return;const matching=tokens.filter(t=>flat(image+' '+label).includes(t)).length;
  candidates.push({image,score:score+Math.min(matching,3)*3+(width>=600?4:width&&width<400?-4:0),width});
 }
 add(entity?.image,38);add(metas['og:image:secure_url']||metas['og:image'],32);add(metas['twitter:image']||metas['twitter:image:src'],28);
 const area=reading.mainHtml.replace(/<(?:header|nav|footer|aside)\b[^>]*>[\s\S]*?<\/(?:header|nav|footer|aside)>/gi,'');
 let index=0;for(const m of area.matchAll(/<(img|source)\b[^>]*>/gi)){
  const a=attributes(m[0]),label=[a.alt,a.title,a.class,a.id].filter(Boolean).join(' ');if(decorative(label))continue;
  if(Number(a.width)>0&&Number(a.width)<100||Number(a.height)>0&&Number(a.height)<80)continue;
  const score=30-Math.min(index++,12),srcsets=[a['data-srcset'],a.srcset].filter(Boolean);
  for(const set of srcsets){const entries=set.split(',').map(s=>s.trim().match(/^(\S+)(?:\s+(\d+(?:\.\d+)?)(w|x))?$/)).filter(Boolean).map(s=>({url:s[1],width:s[3]==='w'?Number(s[2]):Number(s[2]||1)*Number(a.width||600)})).sort((a,b)=>b.width-a.width);const choice=entries.find(s=>s.width<=1600)||entries.at(-1);if(choice)add(choice.url,score+3,label,choice.width);}
  add(a['data-src']||a['data-lazy-src']||a['data-original']||a.src,score,label,Number(a.width)||0);
 }
 // Background posters are used by sliders; only accept marked content media, never arbitrary CSS URLs.
 for(const m of area.matchAll(/<(?:div|figure|section)\b[^>]*>/gi)){const a=attributes(m[0]);if(!/hero|poster|cover|featured|event-image/i.test(a.class||''))continue;const bg=(a.style||'').match(/background(?:-image)?\s*:[^;]*url\(\s*["']?([^"')]+)["']?\s*\)/i);if(bg)add(bg[1],27,a.class);}
 return candidates.sort((a,b)=>b.score-a.score||b.width-a.width)[0]?.image||'';
}

function pageText(html,nodes=[]){
const stripped=EventData.scope(html).replace(/<!--[\s\S]*?-->/g,' ').replace(/<(head|script|style|nav|footer|aside|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,' ');
let main=(stripped.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)||[])[1]||stripped;
// Related programmes and past activities are not the main event.
const relatedHeading=[...main.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)].find(m=>/^(?:programacion relacionada|programacio relacionada|tambe et pot interessar|altres espectacles|programa de actividades|actividades (?:relacionadas|pasadas)|tambien (?:te )?puede interesar(?:te)?|te puede interesar|mira, lee y escucha|otras sesiones de la semana|actividades asociadas|relacionats|relacionados|related (?:events|activities))[.…\s]*$/.test(flat(m[1])));if(relatedHeading)main=main.slice(0,relatedHeading.index);
const article=nodes.find(n=>/Article|BlogPosting/i.test([].concat(n['@type']||[]).join(' ')));
const parts=main.replace(/<br\s*\/?\s*>/gi,'\n').replace(/<\/(?:p|div|li|tr|h[1-6]|address|section|dt|dd)>/gi,'\n').replace(/<[^>]*>/g,' ').split(/\n+/).concat(article?.articleBody?[article.articleBody]:[]);
const blocks=parts.map(clean).filter(t=>t.length>1&&!/suscri|newsletter|cookies|publicidad|todos los derechos|inicia sesion|aceptar condiciones|aviso legal|crear cuenta/i.test(t)).slice(0,1200);const paragraphs=[...new Set(blocks)].slice(0,600);
const addresses=[...main.matchAll(/<address\b[^>]*>([\s\S]*?)<\/address>/gi)].map(m=>clean(m[1]));
for(const p of paragraphs)if(/\d/.test(p)&&p.length<300&&!/no es podr|no se podr|no se puede aparcar/i.test(p)&&/(?:direcci[oó]n|ubicaci[oó]n|carrer|calle|avinguda|avenida|passeig|paseo|plaça|plaza)\b/i.test(p)&&p.length<500)addresses.push(p);
const sections=[...main.matchAll(/<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>([\s\S]*?)(?=<h[1-6]\b|$)/gi)];const synopsis=sections.filter(s=>/sinopsis|argumento|de que trata|sobre la obra|sobre el espectaculo|sobre l.obra|^presentacion$|^descripcion$|^sobre la exposicion$|^descripcio$|^descripcio[n]?$|^presentacio$/.test(flat(s[2]))).map(s=>clean(s[3])).filter(Boolean).join(' ').slice(0,16000);
return {paragraphs,blocks,addresses,text:blocks.join('\n').slice(0,100000),synopsis,mainHtml:main};
}
function shortSummary(description,paragraphs){
 const logistical=/^(?:direccio[n]?|ubicacio[n]?|fechas?|dates?|data(?: i hora)?|cuando|quan|horaris?|horarios?|precios?|preus?|lloc|lugar|artista|comissari(?:at|a|\/a)?|comisari(?:ado|a)?|organitza|organiza|produeix|produce|durada|duracion|reparto|repartiment|fotograma|©)\b/;
 const thematic=/explor|reflexi|recorre|recull|reune|reunix|reuneix|mostra|muestra|exposicio|obra|univers creatiu|art pop|surrealis|narra|historia|història|historia|trama|pelicula|pel·licula|protagon|personatge|personaje|perill|extincio|cuestion|analiz|analitz|aborda|relacio|relacion/;
 const useful=t=>t&&t.length>55&&!logistical.test(flat(t))&&!/^(?:Comprar entradas|Reserva tus entradas)/i.test(t)&&!(/^[“‘«"']/.test(t)&&t.length<260)&&!/cookies|newsletter|suscrib|inicia sesion|no te (?:lo )?pierdas|no te puedes perder|compra tus entradas/i.test(t)&&!/^(?:\d{1,2}[/.]|\d{1,2}\s+(?:de\s+|d[’'])?(?:enero|gener|octubre|novembre|desembre))/.test(flat(t));
 const boundary=paragraphs.findIndex(p=>/^(?:activitats paral.leles|actividades paralelas|programa de actividades|la comissaria|la comisaria|activitats relacionades|actividades relacionadas)\s*[:.]?$/i.test(flat(p)));
 paragraphs=paragraphs.slice(0,boundary<0?paragraphs.length:boundary);
 const full=paragraphs.filter(useful);const candidates=[clean(description),...full].filter(t=>useful(t)&&!(full.length&&/(?:\.\.\.|…)\s*$/.test(t)));
 if(!candidates.length)return '';
 const scored=candidates.map((text,i)=>({text,score:(i===0?2:0)+(thematic.test(flat(text))?8:0)+(/ofrece|alberga|espacio|visitar|museo|jardin|palacio|actividad|ruta|concierto|exposicion|taller|parque/i.test(text)?3:0)-(text.length>900?1:0)-(/repartiment|reparto|direcci[oó]n musical|direccio musical|estrena absoluta|estreno absoluto|patrocini/i.test(text)?14:0)+(/encarn|s.enamor|se enfrent|s.enfront|protagonista|personatge|personaje/i.test(text)?9:0)+(/historia|història|narra|comedia|drama|personaje|personatge|familia|protagon|trama|relato|encarn|enfrenta/i.test(text)?8:0)})).sort((a,b)=>b.score-a.score);
 const intro=full.find(t=>/^(?:(?:esta|aquesta|la|l[’'])\s*(?:exposicio|mostra|muestra)|endinsar-nos|la pelicula|la pel·licula)/.test(flat(t)));
 const source=(useful(clean(description))&&!/(?:\.\.\.|…)\s*$/.test(description)&&thematic.test(flat(description))?clean(description):intro||scored[0].text).replace(/^(?:[¿¡]?[^.!?]*[?!]\s*)+/,'').trim()||candidates[0];
 const sentences=source.match(/[^.!?]+[.!?]+|[^.!?]+$/g)||[source];
 const narrative=sentences.findIndex(s=>/^\s*(?:La historia|La història|La obra narra|La pel[íi]cula sigue|La pel·lícula segueix)\b/i.test(s));
 const focus=sentences.findIndex(s=>/encarn|s.enamor|se enfrent|s.enfront|protagonista|personatge|personaje|[eé]s un[ao]? (?:visita|espect[aá]culo|espectacle)/i.test(s));
 let start=narrative>=0?narrative:focus>=0?focus:0;
 if(sentences.length>1&&sentences[0].length<85&&/^(?:l[’']exposicio|la exposicion)\b/.test(flat(sentences[0]))&&!/mostra|recorre|explora|presenta|reune|reunix|analiz|proposa/.test(flat(sentences[0])))start=Math.max(start,1);
 const compact=s=>s.trim().replace(/\s*\([^)]{20,}\)/g,'').replace(/\s+[-–—]\s*[^–—-]{20,}[-–—],?\s*/g,' ').replace(/\s+,/g,',').trim();
 let text=compact(sentences[start]);
 const rest=sentences.slice(start+1).filter(s=>!/^\s*(?:Autodenominat|Autodenominado|Comissari|Comisari)/i.test(s));
 const theme=rest.find(s=>/un cuento|un conte|un relato|una reflexi|art pop|humor|cuestiona|reivindica|perill|extincio/i.test(flat(s)));
 const sourceIndex=full.findIndex(t=>flat(t)===flat(source));const continuation=sourceIndex>=0?full[sourceIndex+1]:'';
 let next=compact((theme||rest[0]||(continuation&&thematic.test(flat(continuation))?continuation:'')).replace(/\s+que (?:recuperamos|recuperem|estrenamos|presentamos|presentem)[\s\S]*$/i,'.'));
 // A colon often introduces a long list of examples; its lead-in already expresses the subject.
 if(text.length+next.length+1>280&&next.indexOf(':')>=55)next=next.slice(0,next.indexOf(':')).trim()+'.';
 if(next&&text.length+next.length+1<=280)text+=' '+next;
 if(text.length>280)text=text.slice(0,277).replace(/\s+\S*$/,'')+'…';return text;
}
function addressRegion(text){const p=text.match(/\b(03|12|46|08|17|25|43)\d{3}\b/);if(p)return ['03','12','46'].includes(p[1])?'Valencia':'Barcelona';const parts=text.split(',').map(s=>s.trim()).filter(s=>s&&!/^(?:es|espana|españa|spain)$/i.test(s));if(parts.length>1){const tail=region(parts[parts.length-1]);if(tail)return tail;}return region(text)}
function locate(structured,title,description,urlText,reading,country=''){
 if(country&&!/^(es|espana|spain|espanya)$/i.test(flat(country)))return {city:'',locationEvidence:'Dirección fuera de España'};
 if(structured){const r=addressRegion(structured);if(r)return {city:r,locationEvidence:'Dirección de la página'};const p=structured.match(/\b(03|12|46|08|17|25|43)\d{3}\b/);if(p)return {city:['03','12','46'].includes(p[1])?'Valencia':'Barcelona',locationEvidence:'Código postal de la dirección'};/* A street without locality is incomplete: inspect the rest of the page. */};
 if(/\b(?:en|a|de)\s+(madrid|paris|lisboa|roma|londres|berlin|sevilla|malaga|bilbao|granada|zaragoza|oporto)\b/.test(flat(title)))return {city:'',locationEvidence:'Otro destino en el título'};
 const direct=reading.addresses.filter(t=>/direcci[oó]n|ubicaci[oó]n|\d/.test(t)).map(addressRegion).filter(Boolean);if(direct.length&&new Set(direct).size===1)return {city:direct[0],locationEvidence:'Dirección explícita en el contenido'};
 const score={Barcelona:0,Valencia:0};const why={};const add=(text,weight,label)=>{for(const [city,pattern]of Object.entries(regions)){if(pattern.test(flat(text))){score[city]+=weight;why[city]=why[city]||label}}};
 reading.addresses.forEach(t=>add(t,9,'Dirección de la página'));add(title,7,'Título y contenido');add(description,5,'Descripción y contenido');reading.paragraphs.forEach((t,i)=>add(t,i<5?2:1,'Contenido de la página'));add(urlText,1,'Ruta del enlace');
 const ranked=Object.keys(score).sort((a,b)=>score[b]-score[a]);const first=ranked[0],second=ranked[1];return score[first]>0&&(score[second]===0||score[first]-score[second]>=4)?{city:first,locationEvidence:why[first]}:{city:'',locationEvidence:score[first]?'Ubicación ambigua en el contenido':''};
}

function priceLabel(value){
 const s=clean(value);if(!s)return '';
 const amount=n=>{const t=String(n).replace(/\s/g,'');return Number(t.includes(',')?t.replace(/\./g,'').replace(',','.'):t)};
 const display=n=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format(n);
 const range=s.match(/(\d+(?:[.,]\d+)?)\s*(?:€|EUR|euros?)?\s*(?:a|hasta|y|[-–—])\s*(\d+(?:[.,]\d+)?)/i);
 if(range&&Number.isFinite(amount(range[1]))&&Number.isFinite(amount(range[2])))return display(amount(range[1]))+'–'+display(amount(range[2]))+' €';
 const number=s.match(/\d+(?:[.,]\d+)?/);if(number&&/^desde\b/i.test(s))return 'Desde '+display(amount(number[0]))+' €';
 if(/^gratis|gratuit[oa]$/i.test(s))return '0';
 if(/^[\d.,\s]+(?:\s*(?:€|EUR|euros?))?$/i.test(s)&&number&&Number.isFinite(amount(number[0])))return String(amount(number[0]));
 return s.slice(0,180);
}
function offerPrice(offers,fallback=''){
 const list=Array.isArray(offers)?offers:offers?[offers]:[];
 for(const offer of list){if(offer.priceCurrency&&offer.priceCurrency!=='EUR')continue;if(offer.lowPrice!=null&&offer.highPrice!=null)return priceLabel(offer.lowPrice+'–'+offer.highPrice+' €')}
 const values=list.filter(o=>!o.priceCurrency||o.priceCurrency==='EUR').map(o=>priceLabel(o.price??'')).filter(Boolean);
 if(values.length>1&&values.every(v=>/^\d+(?:\.\d+)?$/.test(v))){const n=values.map(Number);if(Math.min(...n)!==Math.max(...n))return priceLabel(Math.min(...n)+'–'+Math.max(...n)+' €')}
 return values[0]||priceLabel(fallback);
}
function occurrenceList(html,entity){
 const items=[];const validTime=s=>/^([01]\d|2[0-3]):[0-5]\d$/.test(s||'');
 function append(iso,end=''){const m=String(iso||'').match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);if(!m||!validTime(m[2]))return;const ending=String(end).match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);items.push({date:m[1],time:m[2],endTime:ending?.[1]===m[1]&&validTime(ending[2])?ending[2]:''})}
 // Occurrence rows keep each performance separate from publication dates and banner ranges.
 const rows=[...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/gi)].map(m=>m[1]).filter(block=>/<time\b[^>]*datetime=/i.test(block));
 for(const block of rows){if(!/occurrence|dateTime|event|funci[oó]n|session/i.test(block))continue;const times=[...block.matchAll(/<time\b([^>]*)>/gi)].map(m=>({attrs:m[1],iso:(m[1].match(/datetime\s*=\s*["']([^"']+)["']/i)||[])[1]})).filter(t=>t.iso);for(const time of times){if(/datePublished|dateModified|publication/i.test(time.attrs))continue;if(/endDate/i.test(time.attrs))continue;const end=times.find(t=>/endDate/i.test(t.attrs));const range=clean(block).match(/\b(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})\b/);const inlineEnd=range&&time.iso.slice(11,16)===range[1]?time.iso.slice(0,10)+'T'+range[2]:'';append(time.iso,end?.iso||inlineEnd)}}
 const children=[].concat(entity?.subEvent||entity?.subEvents||[]);for(const child of children)append(child.startDate,child.endDate);
 const schedules=[].concat(entity?.eventSchedule||[]);const dayMap={Monday:1,Tuesday:2,Wednesday:3,Thursday:4,Friday:5,Saturday:6,Sunday:0};
 for(const schedule of schedules){const begin=String(schedule.startDate||entity?.startDate||'').slice(0,10),end=String(schedule.endDate||entity?.endDate||begin).slice(0,10),time=String(schedule.startTime||'').slice(0,5),endTime=String(schedule.endTime||'').slice(0,5);if(!/^\d{4}-\d{2}-\d{2}$/.test(begin)||!/^\d{4}-\d{2}-\d{2}$/.test(end)||!validTime(time))continue;const days=[].concat(schedule.byDay||[]).map(d=>dayMap[String(d).split('/').pop()]).filter(d=>d!=null);if(!days.length&&schedule.repeatFrequency!=='P1D'&&begin!==end)continue;let date=new Date(begin+'T12:00:00Z');for(let i=0;i<370&&date.toISOString().slice(0,10)<=end;i++,date.setUTCDate(date.getUTCDate()+1)){if(days.length&&!days.includes(date.getUTCDay()))continue;items.push({date:date.toISOString().slice(0,10),time,endTime:validTime(endTime)?endTime:''})}}
 if(!items.length&&entity?.startDate&&(!entity.endDate||String(entity.startDate).slice(0,10)===String(entity.endDate).slice(0,10)))append(entity.startDate,entity.endDate);
 return [...new Map(items.map(x=>[x.date+' '+x.time+' '+x.endTime,x])).values()].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time)).slice(0,1000);
}
function scheduleLabel(occurrences){
 if(!occurrences.length)return '';
 const groups=new Map(),labels=['dom','lun','mar','mié','jue','vie','sáb'];
 for(const item of occurrences){const slot=item.time+(item.endTime?'–'+item.endTime:'');if(!groups.has(slot))groups.set(slot,new Set());groups.get(slot).add(new Date(item.date+'T12:00:00Z').getUTCDay())}
 if(groups.size===1)return [...groups.keys()][0];
 return [...groups.entries()].map(([slot,days])=>{const names=[1,2,3,4,5,6,0].filter(d=>days.has(d)).map(d=>labels[d]);const prefix=names.length>1?names.slice(0,-1).join(', ')+' y '+names[names.length-1]:names[0];return prefix+': '+slot}).join('; ');
}

function detailsFromText(reading){const text=reading.text;const out={};const date=text.match(/(?:fecha|cu[aá]ndo|d[ií]a)\s*[:：]\s*(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})/i);if(date)out.date=date[3]+'-'+date[2].padStart(2,'0')+'-'+date[1].padStart(2,'0');const time=text.match(/(?:hora|comienzo|inicio)\s*[:：]\s*([0-2]?\d)[:.]([0-5]\d)/i);if(time&&Number(time[1])<24)out.time=time[1].padStart(2,'0')+':'+time[2];const price=text.match(/(?:precio|entrada|coste|desde)\s*[:：]?\s*(\d+(?:[.,]\d{1,2})?)\s*(?:€|euros?)/i);if(price)out.price=price[1].replace(',','.');else if(/entrada gratuita|acceso gratuito|actividad gratuita|visitas guiadas gratuitas|precio:\s*gratis/i.test(text))out.price='0';const lead=text.match(/(?:plazo de entrega|entrega)\s*[:：]\s*([^\n.]{3,70})/i);if(lead)out.lead=lead[1].trim();const dimensions=text.match(/(?:medidas|dimensiones)\s*[:：]\s*([^\n.]{3,70})/i);if(dimensions)out.dimensions=dimensions[1].trim();const cuisine=text.match(/cocina\s+(mediterr[aá]nea|japonesa|italiana|china|mexicana|india|vegana|vegetariana|francesa|peruana|tailandesa)/i);if(cuisine)out.cuisine=cuisine[1];return out;}
function concise(value,max=96){const s=clean(value).replace(/\s+[|]\s+.*$/,'').replace(/\s+[-–—]\s+(?:entradas|comprar|reserva|time out|timeout|web oficial).*$/i,'').trim();return s.length<=max?s:s.slice(0,max-1).replace(/\s+\S*$/,'')+'…'}
function present(title,entity,reading,kind){
 if(kind!=='plan')return {title:concise(title),venue:'',workTitle:'',activityType:''};
 const types=[].concat(entity?.['@type']||[]).join(' ');let venue=clean(entity?.location?.name||'');
 if(!venue){const name=reading.text.match(/\b((?:Espai|Espacio|Museu|Museo|Teatre|Teatro|Sala|Palau|Palacio|Castell|Castillo)\s+[A-ZÁÉÍÓÚÀÈÌÒÙÇÑ][\p{L}'’\-]*(?:(?:\s+(?:de|del|la|el|les|els|i|y|dels))?\s+[A-ZÁÉÍÓÚÀÈÌÒÙÇÑ][\p{L}'’\-]*){0,5})/u);venue=clean(name?.[1]?.split('\n')[0]||'')}
 const hint=flat(title+' '+venue+' '+reading.paragraphs.slice(0,8).join(' '));const opera=/OperaEvent/i.test(types)||/\bopera en (?:\w+ )?(?:actos|actes|cuadros|quadres)/.test(flat(reading.paragraphs.slice(0,30).join(' ')));let activityType=opera?'Ópera':/seminari/.test(flat(title))?'Seminario':/TheaterEvent/i.test(types)||/\bteatr[oe]\b/.test(hint)?'Teatro':/MusicEvent/i.test(types)||/concierto|concert/.test(hint)?'Concierto':/ScreeningEvent/i.test(types)||/\bcine\b|pelicula/.test(hint)?'Cine':/exposicio|exhibition/.test(hint)?'Exposición':/taller/.test(hint)?'Taller':'Visita';
 const isPerformance=/Event/i.test(types)&&['Teatro','Concierto','Cine','Ópera'].includes(activityType);
 let workTitle=clean(entity?.workPerformed?.name||(isPerformance?entity?.name:''));if(/^(?:critica|reseña|review)\b/.test(flat(workTitle))){const quoted=workTitle.match(/[«“"']([^»”"']{2,100})[»”"']/);workTitle=quoted?.[1]||title;}
 if(!workTitle&&activityType==='Exposición')workTitle=title;
 if(!workTitle){const quoted=title.match(/[«“"]([^»”"]{3,100})[»”"]/);if(quoted)workTitle=quoted[1];else if(['Teatro','Concierto','Cine','Ópera'].includes(activityType)&&!/^(?:descubre|no te|los mejores|las mejores)|\b(?:estrena|ofrece|presenta|inaugura|abre|anuncia)\b/i.test(title)&&title.length<110)workTitle=title}
 if(workTitle)return {title:concise(workTitle),venue,workTitle,activityType};
 if(venue&&!workTitle&&title.length>90){const context=/jardin|jardí/.test(flat(reading.text))?'Cultura y jardín':activityType;return {title:concise(venue+' · '+context),venue,workTitle:'',activityType}}
 return {title:concise(title),venue,workTitle,activityType};
}

function textRanges(reading){
 const out={},text=reading.text,normalized=flat(text);
 const months={enero:1,gener:1,ene:1,gen:1,febrero:2,febrer:2,feb:2,marzo:3,marc:3,mar:3,abril:4,abr:4,mayo:5,maig:5,may:5,junio:6,juny:6,jun:6,julio:7,juliol:7,jul:7,agosto:8,agost:8,ago:8,septiembre:9,setembre:9,sept:9,sep:9,set:9,octubre:10,oct:10,noviembre:11,novembre:11,nov:11,diciembre:12,desembre:12,dic:12,des:12};
 const names=Object.keys(months).sort((a,b)=>b.length-a.length).join('|');
 const range=normalized.match(new RegExp('(?:(?:del?|desde)\\s+)?(\\d{1,2})\\s*(?:de\\s+)?('+names+')?\\s*(?:al?|hasta|[-–])\\s+(\\d{1,2})\\s*(?:de\\s+)?('+names+')\\s*(?:de\\s+)?(\\d{4})','i'));
 if(range){const sm=months[range[2]||range[4]],em=months[range[4]],year=Number(range[5]);out.date=(year-(sm>em?1:0))+'-'+String(sm).padStart(2,'0')+'-'+range[1].padStart(2,'0');out.endDate=year+'-'+String(em).padStart(2,'0')+'-'+range[3].padStart(2,'0')}
 const amount='\\d+(?:[.,]\\d+)?';const euro='(?:€|euros?|EUR)';
 const price=text.match(new RegExp('(?:precios?|preus?|entradas?|tarifas?|coste)\\s*[:：]?\\s*((?:de|entre|desde)?\\s*'+amount+'\\s*(?:'+euro+')?(?:\\s*(?:a|hasta|y|[-–])\\s*'+amount+'\\s*)?'+euro+')','i'));
 if(price)out.price=priceLabel(price[1]);
 const priceSection=reading.text.match(/(?:^|\n)(?:Precios?|Preus?|Tarifas?)\s*[:：]?\s*\n([^\n]+)/i);if(priceSection&&/\d\s*(?:€|EUR|euros?)/i.test(priceSection[1]))out.price=priceLabel(priceSection[1]);
 for(let i=0;i<reading.paragraphs.length;i++){const row=reading.paragraphs[i];if(!/^(?:fecha y horario|data i horari|horarios?|horaris?|funciones|sessions?)\b/i.test(row))continue;const lines=[];for(let j=i;j<Math.min(i+6,reading.paragraphs.length);j++){const line=reading.paragraphs[j];if(j>i&&/^(?:precios?|preus?|direcci[oó]n|fecha|entradas?|contacto|transporte)\b/i.test(line))break;if(/\b\d{1,2}[:.]\d{2}\b|\b\d{1,2}\s*h\b|cerrad[oa]|tancat/i.test(line))lines.push(line.replace(/^(?:horarios?|horaris?)\s*[:：]?\s*/i,''))}if(lines.length){out.timeText=lines.join('; ').slice(0,1000);break}}
 return out;
}

function classify(url,html=''){
const u=new URL(url);if(!['http:','https:'].includes(u.protocol))throw Error('Enlace no válido');
const metas={};for(const tag of html.match(/<meta\b[^>]*>/gi)||[]){const a={};for(const m of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g))a[m[1].toLowerCase()]=m[2]??m[3];metas[(a.property||a.name||'').toLowerCase()]=clean(a.content)}
const nodes=[];function collect(v){if(Array.isArray(v))return v.forEach(collect);if(v&&typeof v==='object'){nodes.push(v);if(v['@graph'])collect(v['@graph']);if(v.mainEntity)collect(v.mainEntity);if(v.itemReviewed)collect(v.itemReviewed)}}
for(const s of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi))try{collect(JSON.parse(s[1]))}catch{}
const heading=pageHeading(html,metas);collect(EventData.embeddedEvents(html,heading));
const types=x=>[].concat(x['@type']||[]).join(' ');const relevant=nodes.filter(n=>/Restaurant|FoodEstablishment|CafeOrCoffeeShop|BarOrPub|Event|Product|TouristAttraction|Museum|Park|LandmarksOrHistoricalBuildings|PerformingArtsTheater/i.test(types(n))).filter(n=>!n.workPresented||[].concat(n.workPresented).some(w=>w.name?flat(clean(w.name))===flat(heading):String(w.url||w['@id']||'').replace(/\/$/,'')===u.href.replace(/\/$/,'')));const e=relevant.find(n=>heading&&flat(clean(n.name))===flat(heading))||relevant.find(n=>String(n.url||'').replace(/\/$/,'')===u.href.replace(/\/$/,''))||relevant[0];
let title=clean(e?.name||heading||(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]);const h1=heading;if(h1&&/^(?:critica|reseña|review)\b/.test(flat(title)))title=h1;let urlText;try{urlText=decodeURIComponent(u.hostname+' '+u.pathname+' '+u.search)}catch{urlText=u.hostname+u.pathname}
const reading=pageText(html,nodes);const details={...detailsFromText(reading),...textRanges(reading),...EventData.period(clean(reading.mainHtml))};const practical=EventData.practical(reading.mainHtml,reading.blocks,clean);for(const [k,v]of Object.entries(practical))if(v)details[k]=v;const fullSchedule=EventData.schedule(reading.blocks);if(fullSchedule&&!practical.timeText)details.timeText=fullSchedule;const description=clean(e?.description||metas['og:description']||metas.description||'');const hint=flat(title+' '+description+' '+urlText); let kind=e?(/Product/i.test(types(e))?'buy':/Restaurant|FoodEstablishment|CafeOrCoffeeShop|BarOrPub/i.test(types(e))?'restaurant':'plan'):'inbox';
if(kind==='inbox'&&(/\/(?:exposicio(?:nes|ns|n)?|exhibitions?|espectacles?|teatro|teatre|concerts?|conciertos?|cinema|films?)(?:\/|[-_])/i.test(u.pathname)||/^(?:exposicio(?:n)?|exhibition|concierto|concert|obra de teatr[oe])\b/.test(flat(title))))kind='plan';
if(kind==='inbox'){if(/(^|\W)(ikea|kavehome|westwing|maisonsdumonde|sweeek|sklum|zarahome|leroymerlin)(\W|$)|\/products?\/|\b(sofa|lampara|sillon|estanteria|mesita|aparador|cabecero|alfombra|funda nordica)\b/.test(hint))kind='buy';else if(/\b(restaurante?|restaurant|ristorante|pizzeria|arroceria|taberna|brunch|gastronomic)\b|thefork\./.test(hint))kind='restaurant';else if(/eventbrite\.|ticketmaster\.|feverup\.|\b(conciertos?|exposicio(?:n|ns|nes)?|festival|teatro|taller|entradas|excursiones?|actividades?|actividad|cine|monologos?|palacio|museos?|jardines?|parque|visitar|visita|senderismo|ruta|mirador|escapada|castillo|monasterio|centro cultural|que hacer)\b/.test(hint))kind='plan'}
if(kind==='inbox'&&reading.synopsis)kind='plan';
if(kind==='inbox'){const body=flat(reading.paragraphs.join(' '));if(/museo|palacio|visitar|exposicio|teatro|teatre|concierto|concert|danza|dansa|opera|jardin|actividades culturales|senderismo|ruta|cine al aire libre/.test(body))kind='plan';else if(/restaurante|pizzeria|arroceria/.test(body))kind='restaurant'}
let a=e?.address||e?.location?.address||'';if(Array.isArray(a))a=a[0];let address=typeof a==='string'?a:[a.streetAddress,[a.postalCode,a.addressLocality].filter(Boolean).join(' '),a.addressRegion].filter(Boolean).join(', ');const structured=typeof a==='object'?[a.addressRegion,a.addressLocality,a.postalCode].filter(Boolean).join(' '):address;const country=typeof a==='object'?(typeof a.addressCountry==='string'?a.addressCountry:a.addressCountry?.name||''):'';const located=kind==='buy'?{city:'',locationEvidence:''}:locate(structured,title,description,urlText,reading,country);let city=located.city;const presentation=present(title,e,reading,kind);if(kind==='plan'&&/\/(?:cine|cinema|films?)\//i.test(u.pathname)){presentation.activityType='Cine';presentation.workTitle=concise(h1||title);presentation.title=presentation.workTitle;}if(kind==='plan'&&presentation.workTitle){presentation.workTitle=concise(title);presentation.title=presentation.workTitle;}
if(kind==='plan'&&(/^(?:exposicio(?:n)?|exhibition)\b/.test(flat(title))||/\/(?:exposicio(?:nes|ns|n)?|exhibitions?)(?:\/|[-_])/i.test(u.pathname)))presentation.activityType='Exposición';
if(kind==='plan'&&presentation.activityType==='Exposición'){const work=clean(title).replace(/^(?:exposici[oó](?:n)?|exhibition)\s*[:.\-–]?\s*/i,'').replace(/^["“«](.*)["”»]$/,'$1').trim();if(work)presentation.title=presentation.workTitle=concise(work);}
const place=kind==='plan'?EventData.location(html,reading,metas['og:site_name']||'',clean((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]),u.hostname,clean):{};if(!address&&place.address)address=place.address;if(place.venue&&(!e?.location?.name))presentation.venue=place.venue;
if(kind==='plan'&&presentation.venue){const brand=flat(presentation.venue);const branch=reading.paragraphs.find(p=>p.length<100&&flat(p).startsWith(brand+' ')&&/\b(?:centre|centro|sala|seu|sede)\b/i.test(p));if(branch)presentation.venue=branch;}
// An official cultural venue may publish its address only in its own footer.
if(kind==='plan'&&!address){const footer=(html.match(/<footer\b[^>]*>([\s\S]*?)<\/footer>/i)||[])[1]||'';const brand=metas['og:site_name']||'';const brandKey=flat(brand).replace(/[^a-z0-9]/g,'');if(brandKey.length>=3&&flat(u.hostname).replace(/[^a-z0-9]/g,'').includes(brandKey)&&/centre de cultura|centro cultural|muse[ou]|teatr[oe]|fundaci[oó]|cultural cent(?:er|re)/i.test(clean(footer))){const lines=footer.replace(/<br\s*\/?>/gi,'\n').replace(/<\/(?:div|p|address)>/gi,'\n').split(/\n/).map(clean);address=lines.find(t=>t.length<180&&/\b\d{1,4}\s*,?\s*\b(?:03|12|46|08|17|25|43)\d{3}\b/.test(t))||'';if(address&&!presentation.venue)presentation.venue=brand;}}
let summary=kind==='plan'?(reading.synopsis?shortSummary('',[reading.synopsis]):shortSummary(description,reading.paragraphs.filter(p=>!/exilio|franco|guerra civil|propietarios originales/i.test(p)))):'';if(kind==='plan'&&presentation.venue&&!presentation.workTitle&&!reading.synopsis){const source=flat(title+' '+description+' '+reading.text);const features=[[/jardin|jardí/,'jardín'],[/cine al aire libre/,'cine al aire libre'],[/monologos/,'monólogos'],[/clubes? de lectura/,'clubes de lectura'],[/talleres/,'talleres']].filter(([pattern])=>pattern.test(source)).map(([,label])=>label).slice(0,3);if(/cultur/.test(source)&&features.length>=2)summary='Un espacio cultural con '+features.slice(0,-1).join(', ')+' y '+features[features.length-1]+'.'}
if(!address)address=reading.addresses.find(t=>/\d/.test(t)&&(region(t)||/\b(03|12|46|08|17|25|43)\d{3}\b/.test(t)))||reading.addresses.find(t=>/\d/.test(t))||'';
const plot=EventData.plotSummary(reading,presentation.activityType,e);if(kind==='plan'&&plot)summary=plot;
const includedWorks=EventData.components(reading.paragraphs,html);if(kind==='plan'&&includedWorks.length>1)summary='Visita guiada. '+includedWorks.map(w=>w.artist+' · '+w.title+': '+w.description).join(' ');
if(kind==='plan'&&summary){const label=presentation.activityType;summary=summary.replace(/^Esta exposición\s+/i,'Exposición que ');if(label&&label!=='Visita'&&!flat(summary).startsWith(flat(label)))summary=label+': '+summary;}
if(!city&&address){city=addressRegion(address);if(city)located.locationEvidence='Dirección del recinto oficial';}
const rowSessions=EventData.datedRows(reading.mainHtml,clean);const peerEvents=nodes.filter(n=>/Event/i.test(types(n))&&flat(clean(n.name))===flat(clean(e?.name||title)));const structuredSessions=peerEvents.flatMap(n=>occurrenceList('',n));const mergedSessions=[...new Map([...occurrenceList(reading.mainHtml,e),...structuredSessions].map(o=>[o.date+' '+o.time,o])).values()].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));let occurrences=rowSessions.length?rowSessions:mergedSessions;let scheduleMode=rowSessions.length||peerEvents.length>1&&structuredSessions.length?'sessions':'';const explicit=EventData.explicitSessions(reading.blocks,details.date,details.endDate||details.date);if(explicit.length&&!rowSessions.length){const dates=new Set(explicit.map(o=>o.date));occurrences=[...occurrences.filter(o=>!dates.has(o.date)),...explicit].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));scheduleMode='sessions';}const textualSessions=EventData.sessions(reading.text);if(!occurrences.length&&textualSessions.length){occurrences=textualSessions;scheduleMode='sessions';}if(!occurrences.length&&details.timeText&&details.date){occurrences=EventData.recurring(details.timeText,details.date,details.endDate||details.date);if(occurrences.length)scheduleMode='recurring';}if(!occurrences.length&&details.date&&(!details.endDate||details.endDate===details.date)&&details.timeText){const slot=details.timeText.match(/^(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})$/);if(slot){occurrences=[{date:details.date,time:slot[1],endTime:slot[2]}];scheduleMode='single';}}occurrences=occurrences.map(o=>({...o,endTime:o.endTime===o.time?'':o.endTime}));const date=String((scheduleMode==='sessions'?occurrences[0]?.date:'')||e?.startDate||details.date||occurrences[0]?.date||'').match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}:\d{2}))?/);const offers=e?.offers;let img=e?.image||metas['og:image']||'';if(Array.isArray(img))img=img[0];if(typeof img==='object')img=img.url||'';try{img=img?new URL(img,u).href:''}catch{img=''}
img=pageImage(html,reading,e,metas,u.href,title);
const category=kind==='buy'?(/lampara|luz|iluminacion/.test(hint)?'Iluminación':/sofa|mesa|silla|sillon|aparador|cama|estanteria/.test(hint)?'Muebles':/alfombra|cojin|cortina|textil/.test(hint)?'Textil':/cuadro|jarron|decoracion/.test(hint)?'Decoración y arte':''):'';
return CinemaData.enrich(CultureData.enrich({kind,city,summary,analysisUrl:html?u.href:'',locationEvidence:located.locationEvidence||(address?'Dirección del recinto de la actividad':''),title:presentation.title||u.hostname.replace(/^www\./,''),originalTitle:title,venue:presentation.venue,workTitle:presentation.workTitle,activityType:presentation.activityType,url:u.href,image:img,address,cuisine:clean(e?.servesCuisine)||(kind==='restaurant'?details.cuisine||'':''),date:date?.[1]||occurrences[0]?.date||details.date||'',endDate:String((scheduleMode==='sessions'?occurrences.at(-1)?.date:'')||e?.endDate||details.endDate||occurrences[occurrences.length-1]?.date||'').slice(0,10),time:(scheduleMode==='recurring'?details.timeText:scheduleMode==='sessions'?EventData.sessionLabel(occurrences):'')||scheduleLabel(occurrences)||details.timeText||date?.[2]||details.time||'',occurrences,scheduleMode,includedWorks,lead:details.lead||'',dimensions:details.dimensions||'',shop:clean(e?.seller?.name||e?.offers?.seller?.name),price:offerPrice(offers,details.price||''),category,needsReview:kind==='inbox',source:html?'metadata':'url'},html,reading,clean),html,reading,clean,region);
}if(typeof module!=='undefined')module.exports={classify,region,pageText,concise,priceLabel,occurrenceList,scheduleLabel};else root.LinkClassifier={classify,priceLabel};
})(typeof window!=='undefined'?window:globalThis);
