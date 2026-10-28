'use strict';
async function requireMember(authorization,{config=require('./supabase-public.json'),fetchImpl=fetch}={}){
 const error=(status,message)=>Object.assign(Error(message),{status});
 if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9._~-]+$/.test(authorization)||authorization.length>12000)throw error(401,'Conecta tu cuenta desde Ajustes para leer enlaces.');
 const base=new URL(config.url);if(base.protocol!=='https:'||!base.hostname.endsWith('.supabase.co')||base.pathname!=='/')throw error(503,'La conexión privada no está disponible.');
 const headers={apikey:config.publishableKey,Authorization:authorization};
 try{
  const r=await fetchImpl(base.origin+'/auth/v1/user',{headers,signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw error(r.status>=500?503:401,'Vuelve a conectar tu cuenta desde Ajustes.');
  const user=await r.json();if(typeof user.id!=='string'||!user.id)throw error(401,'No se pudo verificar la sesión.');
  const m=await fetchImpl(base.origin+'/rest/v1/planes_members?select=slot&user_id=eq.'+encodeURIComponent(user.id),{headers,signal:AbortSignal.timeout(8000)});
  if(!m.ok)throw error(m.status>=500?503:403,'No se pudo comprobar el permiso de acceso.');
  const rows=await m.json();if(!Array.isArray(rows)||rows.length!==1||![1,2].includes(rows[0].slot))throw error(403,'Esta cuenta no tiene acceso a vuestro espacio.');
  return user.id;
 }catch(e){if(e.status)throw e;throw error(503,'No se pudo comprobar la conexión privada. Inténtalo de nuevo.');}
}
module.exports={requireMember};
