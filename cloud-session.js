'use strict';
// Only session tokens are persisted; passwords never enter storage or logs.
window.CloudSession=(()=>{
 const key='planes-cloud-session-v1',listeners=new Set();let configPromise,refreshPromise,controller=new AbortController();
 const notify=()=>listeners.forEach(fn=>fn());
 async function config(){return configPromise??=fetch('/supabase-public.json',{cache:'no-store'}).then(async r=>{if(!r.ok)throw Error('No se pudo leer la configuración pública.');const c=await r.json(),u=new URL(c.url);if(u.protocol!=='https:'||!u.hostname.endsWith('.supabase.co')||u.pathname!=='/'||u.username||u.password||!c.publishableKey?.startsWith('sb_publishable_'))throw Error('Configuración pública no válida.');return {base:u.origin,key:c.publishableKey}}).catch(e=>{configPromise=null;throw e})}
 function saved(){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{throw Error('No se pudo leer la sesión guardada.');}}
 async function raw(path,options={},token){const signal=controller.signal;const c=await config();signal.throwIfAborted();return fetch(c.base+path,{...options,headers:{apikey:c.key,...(token?{Authorization:'Bearer '+token}:{}),...options.headers},credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.any([signal,AbortSignal.timeout(30000)])})}
 async function verify(token){const r=await raw('/auth/v1/user',{},token);if(!r.ok)throw Error('La sesión ha caducado. Vuelve a iniciar sesión.');const user=await r.json();if(!user.id)throw Error('No se pudo verificar la cuenta.');const m=await raw('/rest/v1/planes_members?select=slot&user_id=eq.'+encodeURIComponent(user.id),{},token);if(!m.ok)throw Error('No se pudo verificar el acceso.');const rows=await m.json();if(!Array.isArray(rows)||rows.length!==1||![1,2].includes(rows[0].slot))throw Error('Tu cuenta existe, pero todavía no tiene acceso al espacio compartido.');return user.id}
 function session(data){if(typeof data.access_token!=='string'||typeof data.refresh_token!=='string'||!Number.isFinite(Number(data.expires_in))||Number(data.expires_in)<=0)throw Error('No se ha recibido una sesión renovable válida.');return {token:data.access_token,refresh:data.refresh_token,expires:Date.now()+Number(data.expires_in)*1000}}
 async function login(email,password){const r=await raw('/auth/v1/token?grant_type=password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});if(!r.ok)throw Error(r.status===400||r.status===401?'Comprueba el correo y la contraseña de la app.':'No se pudo iniciar sesión. Inténtalo de nuevo.');const next=session(await r.json());next.userId=await verify(next.token);localStorage.setItem(key,JSON.stringify(next));sessionStorage.removeItem('planes-cloud-check-v1');notify();}
 async function access(){
  if(refreshPromise)return refreshPromise;
  refreshPromise=(async()=>{
   const run=async()=>{const s=saved();if(!s)throw Error('Inicia sesión para conectar vuestro espacio.');if(s.expires>Date.now()+60000)return s.token;
    const r=await raw('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh})});
    if(!r.ok){if([400,401].includes(r.status)){localStorage.removeItem(key);notify();}throw Error('No se pudo renovar la sesión. Tus fichas se conservan.');}
    const next=session(await r.json());next.userId=s.userId;localStorage.setItem(key,JSON.stringify(next));return next.token;
   };
   if(navigator.locks)return navigator.locks.request('planes-session-refresh',run);
   throw Error('Este navegador necesita una conexión segura y soporte de bloqueo de sesión.');
  })().finally(()=>refreshPromise=null);return refreshPromise;
 }
 async function request(path,options={}){if(!/^\/(rest\/v1\/planes_items|storage\/v1\/object\/)/.test(path))throw Error('Ruta remota no permitida.');return raw(path,options,await access());}
 async function check(){const token=await access();await verify(token);return true}
 function logout(){controller.abort();controller=new AbortController();localStorage.removeItem(key);sessionStorage.removeItem('planes-cloud-check-v1');notify();}
 window.addEventListener('storage',e=>{if(e.key===key)notify()});
 async function inspect(url,signal){const headers={'Content-Type':'application/json'};if(saved())headers.Authorization='Bearer '+await access();return fetch('/api/inspect',{method:'POST',headers,body:JSON.stringify({url}),signal});}
 return {login,logout,request,inspect,check,connected:()=>!!saved(),subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn)}};
})();
