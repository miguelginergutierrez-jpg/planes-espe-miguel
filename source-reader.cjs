const escape=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=s=>JSON.stringify(s).replace(/</g,'\\u003c');
function decode(body,type){const head=body.subarray(0,4096).toString('latin1');const charset=(type.match(/charset\s*=\s*["']?([^;\s"']+)/i)||head.match(/charset\s*=\s*["']?([^\s"'/>;]+)/i)||[])[1]||'utf-8';try{return new TextDecoder(charset).decode(body)}catch{return body.toString('utf8')}}
function htmlPage(title,paragraphs,nodes=[]){return '<html><head><title>'+escape(title)+'</title><script type="application/ld+json">'+json({'@graph':nodes})+'</script></head><body><main><h1>'+escape(title)+'</h1>'+paragraphs.map(t=>'<p>'+escape(t)+'</p>').join('')+'</main></body></html>'}
function calendarDate(value,params,isEnd=false){
 const m=value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/);if(!m)return '';
 let date=m[1]+'-'+m[2]+'-'+m[3];if(!m[4]){if(isEnd){const d=new Date(date+'T12:00:00Z');d.setUTCDate(d.getUTCDate()-1);date=d.toISOString().slice(0,10)}return date}
 if(m[7]){const d=new Date(date+'T'+m[4]+':'+m[5]+':'+(m[6]||'00')+'Z');const parts=Object.fromEntries(new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(d).map(p=>[p.type,p.value]));return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00`}
 const zone=(params.match(/TZID=([^;:]+)/i)||[])[1];if(zone&&!['Europe/Madrid','Europe/Barcelona','Europe/Paris','Europe/Berlin'].includes(zone))return date+'T'+m[4]+':'+m[5]+':00';
 return date+'T'+m[4]+':'+m[5]+':00';
}
function calendar(text){
 const unescape=s=>s.replace(/\\n/gi,'\n').replace(/\\([,;\\])/g,'$1');const nodes=[];let limited=false;
 for(const match of text.replace(/\r?\n[ \t]/g,'').matchAll(/BEGIN:VEVENT\s*([\s\S]*?)END:VEVENT/gi)){
  const fields={};for(const line of match[1].split(/\r?\n/)){const m=line.match(/^([^:;]+)((?:;[^:]*)?):(.*)$/);if(m)fields[m[1].toUpperCase()]={value:unescape(m[3]),params:m[2]}}
  if(fields.STATUS?.value==='CANCELLED')continue;
  const get=k=>fields[k]?.value||'';if(!get('SUMMARY'))continue;
  if(fields.RRULE||fields.RDATE||fields.EXDATE)limited=true;
  nodes.push({'@type':'Event',name:get('SUMMARY'),description:get('DESCRIPTION'),startDate:fields.DTSTART?calendarDate(get('DTSTART'),fields.DTSTART.params):'',endDate:fields.DTEND?calendarDate(get('DTEND'),fields.DTEND.params,true):'',location:{'@type':'Place',name:get('LOCATION'),address:get('LOCATION')},url:get('URL')});
 }
 if(limited)for(const n of nodes){n.startDate='';n.endDate=''}
 const names=new Set(nodes.map(n=>n.name));return {html:htmlPage(nodes[0]?.name||'Calendario',nodes.flatMap(n=>[n.description,n.location.address]),nodes),format:'calendar',notice:limited?'El calendario contiene reglas de repetición que requieren revisión.':names.size>1?'El calendario contiene varias actividades distintas; revisa la actividad seleccionada.':''};
}
function structured(text){const data=JSON.parse(text);const nodes=[];const seen=new Set();let count=0;function walk(x,depth=0){if(!x||typeof x!=='object'||depth>20||++count>20000)return;if(Array.isArray(x)){x.forEach(v=>walk(v,depth+1));return}if(x['@type']&&/Event|Product|Restaurant|TouristAttraction/i.test([].concat(x['@type']).join(' '))){const id=JSON.stringify(x);if(!seen.has(id)){seen.add(id);nodes.push(x)}}Object.values(x).forEach(v=>walk(v,depth+1))}walk(data);const title=nodes[0]?.name||data.title||data.name||'';const paragraphs=nodes.map(n=>n.description||'');let html=htmlPage(title,paragraphs,nodes);html=html.replace('</head>','<script type="application/json">'+json(data)+'</script></head>');return {html,format:'json'};}
async function pdfPage(url,body){
 const {pathToFileURL}=require('node:url');const pdf=await import(pathToFileURL(require('./reader-runtime.cjs').resolve('pdfjs-dist/legacy/build/pdf.mjs')).href);
 const standardFontDataUrl=require('node:path').resolve(require('node:path').dirname(require('./reader-runtime.cjs').resolve('pdfjs-dist/legacy/build/pdf.mjs')),'../../standard_fonts')+'/';const task=pdf.getDocument({standardFontDataUrl,data:new Uint8Array(body),isEvalSupported:false,disableFontFace:true,useSystemFonts:false});const doc=await task.promise;
 try{let paragraphs=[],links=[];const metadata=await doc.getMetadata().catch(()=>null);for(let n=1;n<=Math.min(doc.numPages,60);n++){const page=await doc.getPage(n);const content=await page.getTextContent();let line='',y=null;for(const item of content.items){if(!('str'in item))continue;if(y!==null&&Math.abs(y-item.transform[5])>3&&line){paragraphs.push(line.trim());line=''}line+=item.str+' ';y=item.transform[5];if(item.hasEOL){paragraphs.push(line.trim());line='';y=null}}if(line.trim())paragraphs.push(line.trim());const annotations=await page.getAnnotations();for(const a of annotations)if(a.url&&/^https?:/.test(a.url))links.push(a.url);page.cleanup()}
 const title=metadata?.info?.Title||paragraphs.find(p=>p.length>3&&p.length<120)||'';let html=htmlPage(title,paragraphs);html=html.replace('</main>',links.slice(0,20).map(u=>'<a href="'+escape(u)+'">Más información '+escape(title)+'</a>').join('')+'</main>');return {url,html,format:'pdf',notice:doc.numPages>60?'El documento supera las 60 páginas; la lectura es parcial.':paragraphs.join('').length<80?'El PDF no contiene texto legible; puede ser un documento escaneado.':''};
 }finally{await task.destroy()}
}
function documentPage({url,body,headers={}}){
 if(body.subarray(0,5).toString()==='%PDF-')return pdfPage(url,body);
 const type=String(headers['content-type']||'').toLowerCase(),text=decode(body,type),trim=text.trimStart();let page;
 if(type.includes('text/calendar')||/^BEGIN:VCALENDAR/i.test(trim))page=calendar(text);
 else if(/(?:application\/(?:ld\+)?json)|\+json/.test(type)||/^[{[]/.test(trim)&&!type.includes('html'))page=structured(text);
 else if(/html|xhtml/.test(type)||/^<(?:!doctype|html|head|body|main|article)/i.test(trim))page={html:text,format:'html'};
 else if(type.includes('text/plain'))page={html:htmlPage('',text.split(/\r?\n/)),format:'text'};
 else throw Error('Formato no legible: '+(type||'desconocido'));
 return {url,...page};
}
module.exports={documentPage,decode,calendar,calendarDate};
