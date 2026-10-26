const {pageText,region}=require('./classifier.js');
const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const closed=/cerrad|tancat|closed/i;
const clock=/\b\d{1,2}(?:[:.]\d{2})?\s*(?:h\b|hores|horas)|\b\d{1,2}[:.]\d{2}\b/i;
const weekday=/dilluns|dimarts|dimecres|dijous|divendres|dissabt|diumeng|lunes|martes|miercoles|jueves|viernes|sabado|domingo|festiu|festivo|monday|tuesday|wednesday|thursday|friday|saturday|sunday/i;
const service=/taquill|bibliotec|aparcament|parking|parquing|cafeteria|restaurant|botiga|tienda|recepcion|oficinas/i;

function openingHours(blocks){
 // Inherit museum hours, not its library, restaurant or box-office hours.
 let start=blocks.findIndex(t=>/^(?:Museo|Museu|Museum)$/i.test(t));
 if(start<0)start=blocks.findIndex(t=>/^(?:Horaris?|Horarios?|Opening hours)(?:\s|:|$)/i.test(t)&&!service.test(fold(t)));
 if(start<0)return '';
 const lines=[];
 for(const line of blocks.slice(start,start+20)){
  if(service.test(fold(line))||/^(?:localitzaci|localizaci|direcci|contact|entrad|serveis|servicios)/i.test(line))break;
  if(clock.test(line)||closed.test(line)||weekday.test(fold(line))||lines.length&&/^\d{1,2}\s+(?:i|y|de)\b/i.test(line))lines.push(line);
  else if(lines.length&&/^(?:c\s*\/|carrer|calle|tel|email|www)/i.test(line))break;
 }
 return lines.join('; ');
}

function practical(blocks,idea){
 blocks=blocks.map(t=>t.replace(/^(?:Direcci[oó]n|Adreça|Address)\s*:\s*/i,''));
 const out={};
 const street=blocks.findIndex((t,i)=>t.length<190&&/\d/.test(t)&&(
  /^(?:C\s*\/|Carrer |Calle |Avinguda |Avenida |Passeig |Paseo |Plaça |Plaza |Rambla )/i.test(t)||
  /,\s*\d/.test(t)&&/^\d{5}\s+/.test(blocks[i+1]||'')
 ));
 if(street>=0){
  out.address=blocks[street];
  for(const next of blocks.slice(street+1,street+3))if(/^(?:\d{5}(?:\s|$)|Barcelona$|Val[eè]ncia$)/i.test(next))out.address+=', '+next;
  out.city=region(out.address);
 }
 if(idea.activityType==='Exposición'){
  out.time=openingHours(blocks);
  const general=blocks.find(t=>/^Entrada general\s+\d.*€/i.test(t));
  if(general){
   const free=blocks.filter(t=>/^Entrada gratu[iï]ta\s*[:,]/i.test(t));
   out.price=[general,...free].join(' / ');
  }
  else if(blocks.some(t=>/^(?:Entrada|Acceso|Accés)\s+(?:gratu[iï]t[ao]?|libre|lliure)\s*\.?$/i.test(t)))out.price='Entrada gratuita';
 }
 return out;
}

function venueData(page,idea,{footerOnly=false}={}){
 const name=fold(idea.venue).split(/\.\s*(?:sala|planta)\b/)[0].trim();
 if(name.length<4)return {};
 if(footerOnly){
  // A listings portal's footer must never become the activity's venue information.
  for(const m of page.html.matchAll(/<footer\b[^>]*>([\s\S]*?)<\/footer>/gi)){
   const reading=pageText('<main>'+m[1]+'</main>');
   if(fold(reading.text).includes(name))return practical(reading.blocks,idea);
  }
  return {};
 }
 const reading=pageText(page.html);
 if(!fold(reading.text).includes(name))return {};
 return practical(reading.blocks,idea);
}
module.exports={venueData,openingHours};
