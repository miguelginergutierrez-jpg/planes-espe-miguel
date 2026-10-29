'use strict';
const error=(status,message)=>Object.assign(Error(message),{status});
function createShortcutAPI({config=require('./supabase-public.json'),fetchImpl=fetch}={}){
 async function rpc(name,body){
  let r;try{r=await fetchImpl(config.url+'/rest/v1/rpc/planes_shortcut_'+name,{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)})}catch{throw error(503,'No se pudo confirmar el guardado. Reintenta el mismo enlace.');}
  if(!r.ok){if(r.status===404)throw error(503,'Falta activar el permiso de Atajos en Supabase.');
   if([401,403].includes(r.status))throw error(401,'El permiso del atajo ha caducado o se ha revocado.');
   throw error(503,'No se pudo confirmar el guardado. Espera un minuto y reintenta el mismo enlace.');}
  return r.json();
 }
 return {check:async token=>{if(!/^[a-f0-9]{64}$/.test(token||''))throw error(401,'Configura el permiso privado del atajo.');if(await rpc('check',{p_token:token})!==true)throw error(401,'El permiso del atajo ha caducado o se ha revocado.');},
  save:async(token,url,payload)=>{const result=await rpc('save',{p_token:token,p_url:url,p_payload:payload});if(!['saved','duplicate'].includes(result))throw error(503,'No se pudo confirmar el guardado. Reintenta el mismo enlace.');return result;}};
}
function makePayload(info,url){
 const out={};for(const [k,v]of Object.entries(info||{})){if(typeof v==='string')out[k]=v.slice(0,10000)}
 out.title=(out.workTitle||out.title||new URL(url).hostname).slice(0,160);
 out.kind=['plan','restaurant','buy','inbox'].includes(out.kind)?out.kind:'inbox';
 if(!['Valencia','Barcelona'].includes(out.city)||out.kind==='buy')out.city='';
 out.url=url;out.analysisUrl=url;
 out.occurrences=Array.isArray(info?.occurrences)?info.occurrences.slice(0,1000):[];
 out.verification=info?.verification||null;
 if(out.kind==='inbox')out.summary=out.summary||'Enlace recibido. Revisa los datos cuando abras la ficha.';
 // Do not silently expire a new share because the source contains historical dates.
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const end=out.endDate||out.date;
 if(out.kind==='plan'&&/^\d{4}-\d{2}-\d{2}$/.test(end||'')&&end<today){out.kind='inbox';out.summary='La fuente indica una fecha pasada. Revisa las fechas. '+(out.summary||'');}
 return out;
}
module.exports={createShortcutAPI,makePayload};
