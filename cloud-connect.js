'use strict';
window.CloudConnect=(()=>{
 function mount(host){
  host.innerHTML=`<section class="cloud-connect"><h3>Espacio compartido</h3><p class="micro">Vuestra colección privada. La sesión se recuerda en este navegador; la contraseña no se guarda.</p><form id="cloudLogin"><label>Correo<input name="email" type="email" autocomplete="username" required></label><label>Contraseña de la app<input name="password" type="password" autocomplete="current-password" required minlength="6"></label><button type="submit" class="primary">Conectar con Supabase</button></form><p class="micro" role="status" id="cloudStatus" aria-live="polite"></p><div class="actions"><button type="button" class="primary" id="cloudEnable" hidden>Activar sincronización</button><button type="button" class="subtle" id="cloudNow" hidden>Sincronizar ahora</button><button type="button" class="subtle" id="cloudPause" hidden>Pausar sincronización</button><button type="button" class="subtle" id="cloudDisconnect" hidden>Desconectar este navegador</button></div><div id="cloudConflicts"></div></section>`;
  const form=host.querySelector('form'),status=host.querySelector('#cloudStatus'),enable=host.querySelector('#cloudEnable'),now=host.querySelector('#cloudNow'),pause=host.querySelector('#cloudPause'),disconnect=host.querySelector('#cloudDisconnect'),list=host.querySelector('#cloudConflicts');let busy=false,disposed=false;
  function draw(s=SharedSpace.status()){
   if(disposed)return;const connected=CloudSession.connected();form.hidden=connected;disconnect.hidden=!connected;enable.hidden=!connected||s.enabled;now.hidden=pause.hidden=!connected||!s.enabled;
   status.textContent=connected?s.message:'Inicia sesión para conectar vuestro espacio privado.';
   list.replaceChildren();for(const c of s.conflicts){const row=document.createElement('div'),text=document.createElement('p');text.className='micro';text.textContent='Cambios simultáneos: '+(c.local?.title||c.remote?.payload?.title||'Ficha eliminada')+'. Se conserva tu versión hasta que elijas.';row.append(text);
    const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Ver las dos versiones';details.append(summary);
    for(const [label,item] of [['En este navegador',c.local],['En el espacio compartido',c.remote?.deleted_at?null:c.remote?.payload]]){const p=document.createElement('p');p.className='micro';p.style.whiteSpace='pre-wrap';p.textContent=label+':\n'+(item?[item.title,item.status,item.date&&('Fecha: '+item.date+(item.endDate?' – '+item.endDate:'')),item.time,item.venue,item.address,item.summary,item.notes,(item.attachments||[]).map(a=>a.name).join(', ')].filter(Boolean).join('\n'):'Ficha eliminada');details.append(p)}row.append(details);
    for(const [choice,label] of [['remote','Usar versión compartida'],['local','Usar mi versión']]){const b=document.createElement('button');b.type='button';b.className='subtle';b.textContent=label;b.onclick=()=>run(()=>SharedSpace.resolve(c.id,choice));row.append(b)}list.append(row);
   }
  }
  async function run(fn){if(busy)return;busy=true;host.querySelectorAll('button').forEach(b=>b.disabled=true);try{await fn();if(!disposed)draw()}catch(e){if(!disposed)status.textContent=(e instanceof TypeError?'No se pudo conectar. Comprueba Internet.':e.message)+' Tus fichas locales se conservan.'}finally{busy=false;if(!disposed)host.querySelectorAll('button').forEach(b=>b.disabled=false)}}
  form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const email=form.elements.email.value.trim(),password=form.elements.password.value;form.elements.password.value='';run(async()=>{await CloudSession.login(email,password);status.textContent='Conexión verificada.';draw();if(!SharedSpace.status().enabled)status.textContent='Conexión verificada. Puedes activar la sincronización en este navegador.'})};
  enable.onclick=()=>{if(confirm('Compartir automáticamente las fichas y documentos de este navegador con vuestro espacio privado, y descargar los compartidos. Los cambios simultáneos se revisarán antes de sobrescribir. ¿Activar?'))run(()=>SharedSpace.enable())};
  now.onclick=()=>run(()=>SharedSpace.tick());pause.onclick=()=>SharedSpace.pause();disconnect.onclick=()=>{SharedSpace.pause();CloudSession.logout();draw()};
  const unsubscribe=SharedSpace.subscribe(draw),unsubSession=CloudSession.subscribe(()=>draw());
  const dialog=host.closest('dialog');function dispose(){disposed=true;form.elements.password.value='';unsubscribe();unsubSession();dialog?.removeEventListener('close',dispose)}dialog?.addEventListener('close',dispose,{once:true});
  return dispose;
 }
 return {mount};
})();
