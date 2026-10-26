// Files are kept in IndexedDB rather than the much smaller localStorage quota.
const Documents=(()=>{
 let connection;
 function db(){if(!connection)connection=new Promise((resolve,reject)=>{const r=indexedDB.open('lo-nuestro-documents',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('No se pueden guardar documentos en este navegador.'))});return connection}
 async function run(mode,fn){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('files',mode);let result;const request=fn(tx.objectStore('files'));if(request)request.onsuccess=()=>result=request.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('No se pudo guardar el documento'))})}
 const get=id=>run('readonly',s=>s.get(id));
 const put=items=>run('readwrite',s=>{for(const i of items)s.put(i)});
 const remove=ids=>ids.length?run('readwrite',s=>{for(const id of ids)s.delete(id)}):Promise.resolve();
 async function download(id){const f=await get(id);if(!f)throw Error('No se encuentra este documento. Importa una copia que lo incluya.');const a=document.createElement('a');a.href=URL.createObjectURL(f.blob);a.download=f.name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),30000)}
 const base64=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob)});
 async function pack(items){const files=[];for(const id of new Set(items.flatMap(x=>(x.attachments||[]).map(a=>a.id)))){const f=await get(id);if(!f)throw Error('Falta un documento. No se ha exportado una copia incompleta.');files.push({id:f.id,name:f.name,type:f.blob.type,size:f.blob.size,data:await base64(f.blob)})}return files}
 async function unpack(files,items){if(!Array.isArray(files)||files.length>500)throw Error('Documentos no válidos');const table=new Map();let total=0;for(const f of files){if(!f||typeof f.id!=='string'||typeof f.data!=='string'||table.has(f.id))throw Error('Documento no válido');const bytes=Uint8Array.from(atob(f.data),c=>c.charCodeAt(0));total+=bytes.length;if(bytes.length>10*1024*1024||total>60*1024*1024)throw Error('Copia de documentos demasiado grande');table.set(f.id,{...f,id:uid(),blob:new Blob([bytes],{type:typeof f.type==='string'?f.type:'application/octet-stream'})})}const needed=[];for(const x of items){x.attachments=(x.attachments||[]).map(a=>{const f=table.get(a.id);if(!f||f.blob.size!==a.size)throw Error('La copia no contiene todos sus documentos');needed.push(f);return {...a,id:f.id}})}return [...new Map(needed.map(f=>[f.id,f])).values()]}
 return {get,put,remove,download,pack,unpack};
})();
