const {pageText,region}=require('./classifier.js');
function venueData(page,idea){
 const reading=pageText(page.html),blocks=reading.blocks,out={};const name=idea.venue||'';
 const fold=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const matching=name.length>3&&fold(reading.text).includes(fold(name));
 if(!matching)return out;
 const street=blocks.findIndex(t=>/^(?:C\s*\/|Carrer |Calle |Avinguda |Avenida |Passeig |Paseo |Plaça |Plaza )/i.test(t)&&/\d/.test(t)&&t.length<180);
 if(street>=0){out.address=blocks[street];for(const next of blocks.slice(street+1,street+3))if(/^(?:\d{5}(?:\s|$)|Barcelona$|Val[eè]ncia$)/i.test(next))out.address+=', '+next;out.city=region(out.address)}
 if(idea.activityType==='Exposición'){
  const start=blocks.findIndex(t=>/^(?:Museo|Museu)$/i.test(t));if(start>=0){const lines=[];for(const line of blocks.slice(start+1,start+9)){if(/taquilla|biblioteca|localizaci|localitzaci/i.test(line))break;if(/\d.*h|cerrad|tancat/i.test(line))lines.push(line)}if(lines.length)out.time=lines.join('; ')}
  const general=blocks.find(t=>/^Entrada general\s+\d.*€/i.test(t));if(general){const free=blocks.find(t=>/^Entrada gratuita:/i.test(t));out.price=[general,free].filter(Boolean).join(' / ')}
 }return out;
}
module.exports={venueData};
