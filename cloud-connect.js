'use strict';
// Connection check and explicit initial copy; no continuous synchronization yet.
window.CloudConnect=(()=>{
 const sessionKey='planes-cloud-check-v1';
 function mount(host,{getItems,getDocument}={}){
  let controller,disposed=false,connection,migrating=false;
  host.innerHTML=`<section class="cloud-connect"><h3>Espacio compartido</h3><p class="micro">Conecta tu acceso para preparar la sincronización. Las fichas siguen guardándose en este navegador.</p><form id="cloudLogin"><label>Correo<input name="email" type="email" autocomplete="username" required></label><label>Contraseña de la app<input name="password" type="password" autocomplete="current-password" required minlength="6"></label><button type="submit" class="primary">Conectar con Supabase</button></form><p class="micro" role="status" id="cloudStatus" aria-live="polite"></p><button type="button" class="subtle" id="cloudDisconnect" hidden>Desconectar esta pestaña</button></section>`;
  const form=host.querySelector('form'),status=host.querySelector('#cloudStatus'),disconnect=host.querySelector('#cloudDisconnect');
  const dialog=host.closest('dialog');
  const copy=document.createElement('button');copy.type='button';copy.id='cloudCopy';copy.className='primary';copy.textContent='Copiar fichas y documentos a la nube';copy.hidden=true;host.querySelector('section').appendChild(copy);
  function dispose(){disposed=true;controller?.abort();form.elements.password.value='';dialog?.removeEventListener('close',dispose)}
  dialog?.addEventListener('close',dispose,{once:true});
  async function request(url,options={}){
   const response=await fetch(url,{...options,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(15000)])});
   if(!response.ok){const error=new Error(response.status===401||response.status===400?'No se ha podido iniciar sesión. Comprueba el correo y la contraseña de la app.':response.status===403?'Esta cuenta no tiene permiso para acceder al espacio.':'No se ha podido comprobar la conexión. Inténtalo de nuevo.');throw error}
   return response.json();
  }
  async function check(saved){
   controller?.abort();controller=new AbortController();form.querySelector('button').disabled=true;status.textContent='Comprobando el acceso…';
   try{
    const config=await request('/supabase-public.json');
    const origin=new URL(config.url);
    if(origin.protocol!=='https:'||!origin.hostname.endsWith('.supabase.co')||origin.pathname!=='/'||origin.username||origin.password||!config.publishableKey?.startsWith('sb_publishable_'))throw Error('La configuración pública de conexión no es válida.');
    const base=origin.origin,headers={apikey:config.publishableKey};
    let token=saved?.token,expires=saved?.expires;
    if(!token){
     const password=form.elements.password.value,email=form.elements.email.value.trim();
     const response=await request(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
     token=response.access_token;expires=Date.now()+Number(response.expires_in)*1000;
     if(typeof token!=='string'||!Number.isFinite(expires))throw Error('No se ha recibido una sesión válida.');
    }
    headers.Authorization='Bearer '+token;
    // Auth server verifies the token; never trust decoded claims alone.
    const user=await request(base+'/auth/v1/user',{headers});
    if(!user.id)throw Error('No se ha podido verificar la cuenta.');
    const membership=await request(base+'/rest/v1/planes_members?select=slot&user_id=eq.'+encodeURIComponent(user.id),{headers});
    if(!Array.isArray(membership)||membership.length!==1||![1,2].includes(membership[0].slot))throw Error('Tu cuenta existe, pero todavía no tiene acceso al espacio compartido.');
    await request(base+'/rest/v1/planes_items?select=id&limit=0',{headers});
    if(disposed||!host.isConnected)return;
    try{sessionStorage.setItem(sessionKey,JSON.stringify({token,expires}))}catch{}
    form.hidden=true;disconnect.hidden=false;
    connection={base,headers,expires};copy.hidden=!getItems||!getDocument||!window.CloudMigration;
    status.textContent='Conexión verificada. Tu cuenta tiene acceso al espacio compartido. La sincronización de fichas todavía no está activada.';
   }catch(error){
    if(disposed||!host.isConnected)return;
    sessionStorage.removeItem(sessionKey);form.hidden=false;disconnect.hidden=true;
    status.textContent=error.name==='AbortError'||error.name==='TimeoutError'?'La conexión ha tardado demasiado. Vuelve a intentarlo.':error instanceof TypeError?'No se pudo conectar. Comprueba tu conexión a Internet.':error.message;
   }finally{form.elements.password.value='';form.querySelector('button').disabled=false}
  }
  form.onsubmit=e=>{e.preventDefault();if(form.reportValidity())check()};
  copy.onclick=async()=>{
   if(migrating||!connection)return;
   let items;try{items=getItems()}catch(error){status.textContent=error.message;return}const documents=new Set(items.flatMap(x=>(x.attachments||[]).map(a=>a.id))).size;
   if(!items.length){status.textContent='No hay fichas locales que copiar.';return}
   if(!confirm('Copiar '+items.length+' fichas y '+documents+' documentos a vuestro espacio privado. La copia local se conservará. ¿Continuar?'))return;
   migrating=true;copy.disabled=true;disconnect.disabled=true;
   try{
    const result=await CloudMigration.migrate({items,getDocument,request:(path,options={})=>{if(connection.expires<Date.now()+10000)throw Error('La sesión ha caducado. Vuelve a conectar y reintenta la copia.');return fetch(connection.base+path,{...options,headers:{...connection.headers,...options.headers},credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store',signal:AbortSignal.any([controller.signal,AbortSignal.timeout(30000)])})},onProgress:text=>status.textContent=text});
    status.textContent='Copia verificada: '+result.items+' fichas y '+result.documents+' documentos en la nube. La copia local se conserva. La sincronización automática todavía no está activada.';
   }catch(error){status.textContent=(error.name==='AbortError'||error.name==='TimeoutError'?'Copia interrumpida. Puedes reintentarla sin duplicar las fichas.':error.message)+' Tus datos locales se conservan.'}
   finally{migrating=false;copy.disabled=false;disconnect.disabled=false}
  };
  disconnect.onclick=()=>{controller?.abort();connection=null;copy.hidden=true;sessionStorage.removeItem(sessionKey);form.hidden=false;disconnect.hidden=true;status.textContent='Pestaña desconectada. Tus fichas locales se conservan.'};
  try{const saved=JSON.parse(sessionStorage.getItem(sessionKey)||'null');if(saved&&typeof saved.token==='string'&&saved.expires>Date.now()+30000)check(saved);else sessionStorage.removeItem(sessionKey)}catch{sessionStorage.removeItem(sessionKey)}
  return dispose;
 }
 return {mount};
})();
