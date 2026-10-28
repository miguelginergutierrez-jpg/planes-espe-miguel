'use strict';
// Browser integration; one reconciliation at a time across all tabs.
window.SharedSpace=(()=>{
 const key='planes-sync-state-v1',journal='planes-sync-journal-v1',dataKey='lo-nuestro-v1',listeners=new Set();
 let adapter,running=false,scheduled,conflicts=[],message='Sincronización sin activar.',generation=0;
 function state(){const s=JSON.parse(localStorage.getItem(key)||'{"enabled":false,"base":[]}');if(!Array.isArray(s.base)||typeof s.enabled!=='boolean')throw Error('No se pudo leer el estado de sincronización.');return s}
 function emit(text){if(text)message=text;listeners.forEach(fn=>fn({message,conflicts,enabled:state().enabled}));}
 function recover(){const raw=localStorage.getItem(journal);if(!raw)return;const j=JSON.parse(raw),current=localStorage.getItem(dataKey);if(current!==j.before&&current!==j.after)throw Error('Hay cambios locales posteriores a una sincronización interrumpida. Conserva una copia antes de continuar.');localStorage.setItem(dataKey,j.after);localStorage.setItem(key,j.state);localStorage.removeItem(journal);}
 function commit(expected,next,base,found){
  const before=localStorage.getItem(dataKey);if(!CloudSync.equalCollection(expected,adapter.getItems()))throw Error('Hay cambios nuevos en este navegador. Se reintentará la sincronización.');
  const normalized=next.map(adapter.normalize),after=JSON.stringify(normalized),newState=JSON.stringify({...state(),base});
  if(before===after&&localStorage.getItem(key)===newState){conflicts=found;emit();return;}
  localStorage.setItem(journal,JSON.stringify({before,after,state:newState}));
  localStorage.setItem(dataKey,after);localStorage.setItem(key,newState);localStorage.removeItem(journal);
  conflicts=found;adapter.changed(normalized);emit();
 }
 async function tick(){
  if(!adapter||running||!state().enabled||!CloudSession.connected()||document.hidden)return;
  running=true;const epoch=generation;
  try{
   if(!navigator.locks)throw Error('La sincronización necesita un navegador actualizado y conexión segura.');
   await navigator.locks.request('planes-sync',async()=>{
    if(epoch!==generation||!state().enabled||!CloudSession.connected())return;
    recover();await CloudSession.check();const items=adapter.getItems(),s=state();
    const guard=()=>{if(epoch!==generation||!state().enabled||!CloudSession.connected())throw Error('Sincronización detenida.');};
    const result=await CloudSync.cycle({items,base:s.base,request:(...args)=>{guard();return CloudSession.request(...args)},getDocument:Documents.get,putDocuments:Documents.put,normalize:adapter.normalize,commit:(...args)=>{guard();commit(...args)}});
    emit(result.conflicts.length?'Hay cambios simultáneos. Revisa las fichas en Ajustes.':'Sincronizado. Los cambios se comparten automáticamente.');
    adapter.expire();
   });
  }catch(e){emit((e.name==='TypeError'?'Sin conexión. Tus cambios se enviarán cuando vuelva Internet.':e.message)+' La copia local se conserva.');}
  finally{running=false;}
 }
 async function enable(){await CloudSession.check();await CloudSync.readRows(CloudSession.request);localStorage.setItem(key,JSON.stringify({...state(),enabled:true}));emit('Sincronizando…');return tick();}
 function pause(){generation++;localStorage.setItem(key,JSON.stringify({...state(),enabled:false}));emit('Sincronización en pausa. Tus fichas se conservan.');}
 async function resolve(id,choice){
  if(running)throw Error('Espera a que termine la sincronización.');
  await navigator.locks.request('planes-sync',async()=>{
   const c=conflicts.find(c=>c.id===id);if(!c||!c.remote)throw Error('Vuelve a sincronizar antes de resolver este cambio.');
   const items=adapter.getItems(),current=items.find(x=>x.id===id)||null;if(!CloudSync.equal(current,c.local))throw Error('La ficha local ha cambiado. Vuelve a sincronizar.');
   let next=items;
   if(choice==='remote'){
    const files=[];for(const a of c.remote.deleted_at?[]:c.remote.payload.attachments||[])files.push(await CloudSync.download(a,CloudSession.request));if(files.length)await Documents.put(files);
    next=items.filter(x=>x.id!==id);if(!c.remote.deleted_at)next.push(adapter.normalize(c.remote.payload));
   }
   const base=state().base.filter(r=>r.id!==id);base.push(c.remote);
   commit(items,next,base,conflicts.filter(x=>x.id!==id));
  });return tick();
 }
 function init(a){adapter=a;recover();adapter.changed(JSON.parse(localStorage.getItem(dataKey)||'[]').map(adapter.normalize));adapter.expire();
  setInterval(tick,30000);window.addEventListener('online',tick);window.addEventListener('focus',tick);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
  CloudSession.subscribe(()=>{generation++;if(CloudSession.connected())tick();else emit('Sesión desconectada. Tus fichas se conservan.');});setTimeout(tick,0);
 }
 function schedule(){clearTimeout(scheduled);scheduled=setTimeout(tick,500);}
 // Separate timeout from interval so local edits never disable polling.
 return {init,tick,enable,pause,resolve,schedule,subscribe:fn=>{listeners.add(fn);fn({message,conflicts,enabled:state().enabled});return()=>listeners.delete(fn)},status:()=>({message,conflicts,enabled:state().enabled})};
})();
