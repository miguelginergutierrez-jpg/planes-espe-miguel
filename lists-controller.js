'use strict';
window.ListSpace=(()=>{
 const dataKey='planes-lists-v1',draftKey='planes-lists-drafts-v1',listeners=new Set();let active=null,waiting=null,busy=false,message='Conecta vuestro espacio privado para compartir listas.',unlock=null,queue=Promise.resolve();
 let editor;try{editor=sessionStorage.getItem('planes-list-editor');if(!editor){editor=crypto.randomUUID();sessionStorage.setItem('planes-list-editor',editor)}}catch{editor=crypto.randomUUID()}
 const getRows=()=>{const rows=JSON.parse(localStorage.getItem(dataKey)||'[]');if(!Array.isArray(rows))throw Error('No se pudieron leer las listas guardadas.');rows.forEach(Checklists.rowValid);return rows};
 const getItems=()=>getRows().filter(r=>!r.deleted_at).map(r=>Checklists.normalize(r.payload));
 function drafts(){const d=JSON.parse(localStorage.getItem(draftKey)||'{}');if(!d||Array.isArray(d)||typeof d!=='object')throw Error('No se pudieron leer los borradores.');return d}
 function keepDraft(draft,revision){const all=drafts();all[draft.id]={draft,revision};localStorage.setItem(draftKey,JSON.stringify(all))}
 function clearDraft(id){const all=drafts();delete all[id];localStorage.setItem(draftKey,JSON.stringify(all))}
 const status=()=>({message,busy,active:active?{id:active.id,valid:active.valid,revision:active.row?.revision||0,requested:active.requested}:null,waiting});
 const emit=text=>{if(text)message=text;listeners.forEach(fn=>fn(status()))};
 async function rpc(name,body){const r=await CloudSession.request('/rest/v1/rpc/planes_lists_'+name,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok){const value=await r.json().catch(()=>({}));throw Error(r.status===404?'Falta activar las listas privadas (004).':value.message||'No se pudo conectar con las listas. Tu borrador se conserva.')}return r.json()}
 async function read(){const rows=[];for(let offset=0;offset<=1000;offset+=500){const r=await CloudSession.request('/rest/v1/planes_lists?select=id,payload,revision,deleted_at&order=id&limit=500&offset='+offset);if(!r.ok)throw Error([400,404].includes(r.status)?'Falta activar las listas privadas (004).':'No se pudieron descargar las listas. La copia local se conserva.');const batch=await r.json();if(!Array.isArray(batch))throw Error('Respuesta de listas no válida.');batch.forEach(Checklists.rowValid);rows.push(...batch);if(batch.length<500){if(new Set(rows.map(r=>r.id)).size!==rows.length)throw Error('Las listas cambiaron durante la lectura. Reintenta.');localStorage.setItem(dataKey,JSON.stringify(rows));return}}throw Error('Hay demasiadas listas para descargar de una vez.')}
 async function localLock(id){if(unlock)return true;if(!navigator.locks)throw Error('Usa un navegador actualizado y conexión segura.');return new Promise((resolve,reject)=>{navigator.locks.request('planes-list-editor:'+id,{ifAvailable:true},async lock=>{if(!lock){resolve(false);return}await new Promise(done=>{unlock=done;resolve(true)})}).catch(reject)})}
 async function release(){await queue;const old=active;active=null;unlock?.();unlock=null;emit();if(old&&CloudSession.connected())try{await rpc('access',{p_id:old.id,p_editor:editor,p_action:'release'})}catch{}}
 async function acquire(id){
  if(!CloudSession.connected())throw Error('Conecta vuestro espacio privado en Ajustes para editar listas.');
  if(active&&active.id!==id)await release();if(!await localLock(id)){emit('Lista en uso por amorcito.');return null}
  try{await CloudSession.check();const lock=await rpc('access',{p_id:id,p_editor:editor,p_action:'acquire'});if(!lock.acquired){unlock?.();unlock=null;waiting=id;emit('Lista en uso por amorcito. Ya le hemos avisado de que quieres acceder.');return null}
   await read();const row=getRows().find(r=>r.id===id)||null;active={id,valid:true,requested:!!lock.requested,row};waiting=null;emit('Solo tú puedes editar esta lista.');return {item:row&&!row.deleted_at?Checklists.normalize(row.payload):null,revision:row?.revision||0,draft:drafts()[id]||null};
  }catch(e){unlock?.();unlock=null;active=null;emit(e.message);throw e}
 }
 function serialized(fn){const job=queue.then(fn);queue=job.catch(()=>{});return job}
 async function write(item,deleted=false){
  if(!active?.valid||active.id!==item.id)throw Error('Recupera el acceso a la lista antes de guardar. Tu borrador sigue aquí.');
  const lease=active;try{const result=Checklists.rowValid(await rpc('save',{p_id:item.id,p_editor:editor,p_revision:active.row?.revision||0,p_payload:Checklists.normalize(item),p_deleted:deleted}));if(active===lease)lease.row=result;const rows=getRows().filter(r=>r.id!==item.id);rows.push(result);localStorage.setItem(dataKey,JSON.stringify(rows));emit('Lista guardada y compartida.');return result}catch(e){if(active)active.valid=false;emit(e.message);throw e}
 }
 const save=item=>serialized(()=>write(item));
 const remove=id=>serialized(()=>{const item=getItems().find(x=>x.id===id);if(!item)throw Error('La lista ya no existe.');return write(item,true)});
 const toggle=(id,checked)=>serialized(()=>{const item=active?.row&&!active.row.deleted_at?Checklists.normalize(active.row.payload):null;if(!item?.points.some(p=>p.id===id))return null;return write({...item,points:item.points.map(p=>p.id===id?{...p,checked}:p)})});
 async function tick(){if(busy||!CloudSession.connected()||document.hidden)return;busy=true;try{if(active){const a=active,lock=await rpc('access',{p_id:a.id,p_editor:editor,p_action:'renew'});if(active===a){a.valid=!!lock.acquired;a.requested=!!lock.requested;emit(a.valid?(a.requested?'Amorcito quiere acceder a la lista. Guarda y ciérrala cuando termines.':'Solo tú puedes editar esta lista.'):'El acceso ha caducado. Tu borrador se conserva.')}}await read();if(waiting){const lock=await rpc('access',{p_id:waiting,p_editor:editor,p_action:'status'});if(lock.available){waiting=null;emit('La lista ya está libre. Puedes abrirla.')}}else if(!active)emit('Listas compartidas al día.');else emit()}catch(e){if(active)active.valid=false;emit('Sin conexión o sin acceso. Tu borrador se conserva. '+e.message)}finally{busy=false}}
 async function importItems(items){for(const item of Checklists.backupItems(items)){const access=await acquire(item.id);if(!access)throw Error('Hay una lista en uso. Reintenta la importación cuando quede libre.');try{await save(item)}finally{await release()}}}
 CloudSession.subscribe(()=>{if(!CloudSession.connected()){if(active)active.valid=false;emit('Conecta vuestro espacio privado para editar las listas.')}else tick()});
 window.addEventListener('storage',e=>{if([dataKey,draftKey].includes(e.key))emit()});window.addEventListener('online',tick);window.addEventListener('focus',tick);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});setInterval(tick,10000);
 return {getItems,status,drafts,keepDraft,clearDraft,acquire,release,save,remove,toggle,tick,importItems,subscribe:fn=>{listeners.add(fn);fn(status());return()=>listeners.delete(fn)}};
})();
