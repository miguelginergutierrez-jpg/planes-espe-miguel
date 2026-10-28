'use strict';
// Explicit one-way initial copy. No upserts, deletes or local storage writes.
((root,factory)=>{if(typeof module==='object'&&module.exports)module.exports=factory();else root.CloudMigration=factory()})(globalThis,()=>{
 const stable=v=>JSON.stringify(sort(v));
 function sort(v){if(Array.isArray(v))return v.map(sort);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])]));return v}
 async function digest(blob){return Array.from(new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),b=>b.toString(16).padStart(2,'0')).join('')}
 async function migrate({items,getDocument,request,onProgress=()=>{}}){
  const snapshot=JSON.parse(JSON.stringify(items));
  if(!Array.isArray(snapshot)||snapshot.length>10000)throw Error('La colección no es válida.');
  if(new Set(snapshot.map(x=>x.id)).size!==snapshot.length)throw Error('Hay fichas duplicadas en la copia local.');
  const files=new Map();let total=0;
  // Validate all attachments before the first write. Paths are immutable hashes,
  // so retries cannot replace a document referenced by another record.
  for(const item of snapshot){
   if(!item.id||!item.title||!['plan','buy','restaurant','inbox'].includes(item.kind))throw Error('Hay una ficha incompleta en la copia local.');
   for(const attachment of item.attachments||[]){
    let file=files.get(attachment.id);
    if(!file){file=await getDocument(attachment.id);if(!file?.blob)throw Error('Falta un documento local. No se ha copiado la colección.');if(file.blob.size>10485760)throw Error('Un documento supera los 10 MB.');total+=file.blob.size;if(total>60*1024*1024)throw Error('Los documentos superan los 60 MB.');file={...file,path:'initial/'+await digest(file.blob)};files.set(attachment.id,file)}
    if(file.blob.size!==attachment.size)throw Error('El tamaño de un documento no coincide con la ficha.');
    attachment.cloudPath=file.path;
   }
  }
  async function rows(){const all=[];for(let offset=0;offset<=10000;offset+=500){const r=await request('/rest/v1/planes_items?select=id,payload&order=id&limit=500&offset='+offset);if(!r.ok)throw Error('No se han podido consultar las fichas de la nube.');const batch=await r.json();if(!Array.isArray(batch))throw Error('Respuesta inesperada de la nube.');all.push(...batch);if(batch.length<500)return new Map(all.map(x=>[x.id,x.payload]))}throw Error('La colección remota supera el límite de esta migración.')}
  const existing=await rows(),missing=[];
  for(const item of snapshot){if(existing.has(item.id)){if(stable(existing.get(item.id))!==stable(item))throw Error('Ya existe una versión diferente de una ficha en la nube. No se ha sobrescrito: '+item.title)}else missing.push({id:item.id,payload:item})}
  const body=JSON.stringify(missing);if(new Blob([body]).size>5*1024*1024)throw Error('Las fichas superan el tamaño permitido para la copia inicial.');
  const verified=new Set();let done=0;
  async function matches(file){const r=await request('/storage/v1/object/authenticated/planes-documents/'+file.path);if(r.ok){if(await digest(await r.blob())!==file.path.split('/')[1])throw Error('El documento remoto no coincide; no se sobrescribirá.');return true}if(r.status===404)return false;if(r.status===400){const e=await r.json();if(String(e.statusCode)==='404'||e.error==='not_found'||e.code==='NoSuchKey')return false}throw Error('No se ha podido comprobar un documento en la nube.')}
  for(const file of files.values()){
   if(verified.has(file.path))continue;
   onProgress('Copiando documentos… '+done+' de '+files.size);
   if(!await matches(file)){
    const response=await request('/storage/v1/object/planes-documents/'+file.path,{method:'POST',headers:{'Content-Type':file.blob.type||'application/octet-stream','x-upsert':'false'},body:file.blob});
    // A concurrent upload of identical bytes is harmless, but is still verified.
    if(!response.ok&&![400,409].includes(response.status))throw Error('No se pudo subir un documento. Puedes reintentar la copia.');
    if(!await matches(file))throw Error('No se pudo verificar el documento subido. Puedes reintentar.');
   }
   verified.add(file.path);done++;
  }
  if(missing.length){onProgress('Copiando '+missing.length+' fichas…');const r=await request('/rest/v1/planes_items',{method:'POST',headers:{'Content-Type':'application/json',Prefer:'return=minimal'},body});if(!r.ok)throw Error('No se han podido copiar las fichas. No se han sobrescrito registros existentes. Puedes reintentar.');}
  onProgress('Verificando la copia…');const after=await rows();
  for(const item of snapshot)if(!after.has(item.id)||stable(after.get(item.id))!==stable(item))throw Error('La copia no coincide con la nube. Conserva la copia local y vuelve a comprobar.');
  return {items:snapshot.length,documents:files.size,added:missing.length};
 }
 return {migrate};
});
