'use strict';
// Three-way reconciliation. Never treats failed reads as an empty collection.
((root,factory)=>{if(typeof module==='object'&&module.exports)module.exports=factory();else root.CloudSync=factory()})(globalThis,()=>{
 const clone=x=>JSON.parse(JSON.stringify(x));
 function stable(x){if(Array.isArray(x))return '['+x.map(stable).join(',')+']';if(x&&typeof x==='object')return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+stable(x[k])).join(',')+'}';return JSON.stringify(x)}
 // cloudPath is transport metadata; old copies can have it only on the server.
 function content(x){if(!x)return null;const y=clone(x);for(const a of y.attachments||[])delete a.cloudPath;return y}
 const equal=(a,b)=>stable(content(a))===stable(content(b));
 function validate(item){if(!item||typeof item.id!=='string'||!item.id||item.id.length>200||!['plan','restaurant','buy','inbox'].includes(item.kind)||typeof item.title!=='string'||!item.title.trim()||!Array.isArray(item.attachments||[]))throw Error('La nube contiene una ficha no válida. Se conserva la copia local.');return item}
 function rowValid(row){validate(row.payload);if(row.id!==row.payload.id||!Number.isSafeInteger(row.revision)||row.revision<1||!(row.deleted_at===null||typeof row.deleted_at==='string'))throw Error('Respuesta de sincronización no válida.');return row}
 async function readRows(request){const all=[];for(let offset=0;offset<=10000;offset+=500){const r=await request('/rest/v1/planes_items?select=id,payload,revision,deleted_at&order=id&limit=500&offset='+offset);if(!r.ok)throw Error(r.status===400?'Falta preparar la sincronización en Supabase (actualización 002).':'No se pudieron leer las fichas compartidas. Tu copia local se conserva.');const rows=await r.json();if(!Array.isArray(rows))throw Error('Respuesta de nube no válida.');rows.forEach(rowValid);all.push(...rows);if(rows.length<500){if(new Set(all.map(x=>x.id)).size!==all.length)throw Error('La colección cambió durante la lectura. Reintentando sin sustituir datos.');return all}}throw Error('La colección supera el límite de sincronización.');}
 async function digest(blob){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('')}
 function pathOK(path){return /^(initial|sync)\/[a-f0-9]{64}$/.test(path||'')}
 async function download(attachment,request){
  if(!pathOK(attachment.cloudPath))throw Error('Un documento remoto no tiene una ruta válida.');
  const r=await request('/storage/v1/object/authenticated/planes-documents/'+attachment.cloudPath);
  if(!r.ok)throw Error('No se pudo descargar un documento. Se conserva la ficha local.');
  const blob=await r.blob();if(blob.size!==attachment.size||blob.size>10485760||await digest(blob)!==attachment.cloudPath.split('/')[1])throw Error('No coincide el documento descargado.');
  return {id:attachment.id,name:attachment.name,blob};
 }
 async function prepare(item,{getDocument,request}){
  const payload=clone(item);validate(payload);
  for(const a of payload.attachments||[]){
   if(!Number.isInteger(a.size)||a.size<0||a.size>10485760)throw Error('Documento demasiado grande o no válido.');
   const file=await getDocument(a.id);if(!file?.blob||file.blob.size!==a.size)throw Error('Falta un documento local. No se ha subido una ficha incompleta.');
   const hash=await digest(file.blob);a.cloudPath='sync/'+hash;
   let r=await request('/storage/v1/object/authenticated/planes-documents/'+a.cloudPath);
   if(!r.ok){let missing=r.status===404;if(r.status===400){const e=await r.json();missing=String(e.statusCode)==='404'||e.error==='not_found'||e.code==='NoSuchKey'}if(!missing)throw Error('No se pudo comprobar un documento remoto.');
    r=await request('/storage/v1/object/planes-documents/'+a.cloudPath,{method:'POST',headers:{'Content-Type':file.blob.type||'application/octet-stream','x-upsert':'false'},body:file.blob});
    if(!r.ok&&![400,409].includes(r.status))throw Error('No se pudo subir el documento.');
    r=await request('/storage/v1/object/authenticated/planes-documents/'+a.cloudPath);
   }
   if(!r.ok||await digest(await r.blob())!==hash)throw Error('No se pudo verificar el documento subido.');
  }
  return payload;
 }
 // commit(expectedItems,nextItems,nextBase,conflicts) must be synchronous and
 // reject if local edits happened while network requests were pending.
 async function cycle({items,base=[],request,getDocument,putDocuments,commit,normalize=x=>x}){
  items=clone(items);base=clone(base);items.forEach(validate);
  const rows=await readRows(request),remote=new Map(rows.map(r=>[r.id,r])),known=new Map(base.map(r=>[r.id,rowValid(r)])),local=new Map(items.map(x=>[x.id,x]));
  if(local.size!==items.length)throw Error('Hay identificadores locales duplicados.');
  const next=new Map(local),nextBase=new Map(known),conflicts=[];
  // All downloaded records are normalized before their first local write.
  for(const r of rows)if(!r.deleted_at)r.payload=normalize(r.payload);
  async function take(r){if(r.deleted_at)next.delete(r.id);else{
    const files=[];let total=0;for(const a of r.payload.attachments||[]){total+=a.size;if(total>50*1024*1024)throw Error('La ficha supera el límite de documentos.');const cached=await getDocument(a.id);if(!cached?.blob||cached.blob.size!==a.size||!pathOK(a.cloudPath)||await digest(cached.blob)!==a.cloudPath.split('/')[1])files.push(await download(a,request));}
    if(files.length)await putDocuments(files);next.set(r.id,r.payload);
   }nextBase.set(r.id,r);
  }
  for(const id of new Set([...local.keys(),...remote.keys(),...known.keys()])){
   const l=local.get(id)||null,r=remote.get(id),b=known.get(id),rp=r&&!r.deleted_at?r.payload:null,bp=b&&!b.deleted_at?b.payload:null;
   if(!r&&b){throw Error('Falta una ficha remota conocida. No se propagará un borrado sin marca.');}
   if(r&&equal(l,rp)){await take(r);continue;}
   const localChanged=b?!equal(l,bp):!!l;
   const remoteChanged=b?(!r||r.revision!==b.revision):!!r;
   if(localChanged&&remoteChanged){conflicts.push({id,local:l,remote:r});continue;}
   if(!localChanged){if(r)await take(r);continue;}
   const payload=l?await prepare(l,{getDocument,request}):r.payload;
   const body={payload,deleted_at:l?null:new Date().toISOString()};
   const response=await request('/rest/v1/planes_items'+(r?'?id=eq.'+encodeURIComponent(id)+'&revision=eq.'+r.revision:''),{
    method:r?'PATCH':'POST',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify(r?body:{id,...body})});
   if(response.status===409){conflicts.push({id,local:l,remote:r||null});continue;}
   if(!response.ok)throw Error('No se pudo guardar en la nube. Tus cambios locales siguen pendientes.');
   const result=await response.json();if(!Array.isArray(result)||result.length!==1){conflicts.push({id,local:l,remote:r||null});continue;}
   const saved=rowValid(result[0]);nextBase.set(id,saved);if(l)next.set(id,normalize(saved.payload));else next.delete(id);
  }
  const nextItems=[...next.values()];if(nextItems.flatMap(x=>x.attachments||[]).reduce((n,a)=>n+a.size,0)>60*1024*1024)throw Error('La colección compartida supera los 60 MB de documentos.');
  commit(items,nextItems,[...nextBase.values()],conflicts);
  return {conflicts};
 }
 const equalCollection=(a,b)=>stable(a.map(content).sort((x,y)=>x.id.localeCompare(y.id)))===stable(b.map(content).sort((x,y)=>x.id.localeCompare(y.id)));
 return {cycle,readRows,equal,equalCollection,digest,download};
});
