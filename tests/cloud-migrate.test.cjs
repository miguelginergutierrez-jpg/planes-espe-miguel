const {test}=require('node:test'),assert=require('node:assert/strict');
const {migrate}=require('../cloud-migrate.js');
const idea=()=>({id:'one',kind:'restaurant',title:'Example',attachments:[{id:'doc',name:'menu.txt',size:4}]});
function backend(){const rows=new Map(),files=new Map(),writes=[];let failUpload=false,conflict=false,loseResponse=false;
 return {rows,files,writes,setFailUpload:()=>failUpload=true,setConflict:()=>conflict=true,setLoseResponse:()=>loseResponse=true,request:async(path,opt={})=>{
  if(opt.method==='POST'){writes.push(path);
   if(path.startsWith('/storage/')){if(failUpload)return new Response('',{status:503});files.set(path.split('/planes-documents/')[1],opt.body);return new Response('{}')}
   if(conflict)return new Response('',{status:409});
   for(const x of JSON.parse(opt.body)){if(rows.has(x.id))return new Response('',{status:409});rows.set(x.id,x.payload)}
   if(loseResponse){loseResponse=false;throw Error('Lost response')}
   return new Response(null,{status:201});
  }
  if(path.startsWith('/storage/')){const b=files.get(path.split('/planes-documents/')[1]);return b?new Response(b):new Response(JSON.stringify({statusCode:'404'}),{status:400})}
  return new Response(JSON.stringify([...rows].map(([id,payload])=>({id,payload}))));
 }};
}
const document=async()=>({blob:new Blob(['menu'],{type:'text/plain'})});
test('initial copy verifies attachments and records without mutating local data',async()=>{const b=backend(),items=[idea()],before=JSON.stringify(items);const r=await migrate({items,getDocument:document,request:b.request});assert.equal(r.items,1);assert.equal(r.documents,1);assert.equal(b.files.size,1);assert.match(b.rows.get('one').attachments[0].cloudPath,/^initial\/[a-f0-9]{64}$/);assert.equal(JSON.stringify(items),before);assert.ok(b.writes[0].startsWith('/storage/'))});
test('repeated copy does not duplicate or overwrite',async()=>{const b=backend(),args={items:[idea()],getDocument:document,request:b.request};await migrate(args);const count=b.writes.length;const r=await migrate(args);assert.equal(r.added,0);assert.equal(b.writes.length,count)});
test('a different remote record blocks writes',async()=>{const b=backend();b.rows.set('one',{...idea(),title:'Remote edit'});await assert.rejects(migrate({items:[idea()],getDocument:document,request:b.request}),/versión diferente/);assert.equal(b.writes.length,0)});
test('missing local document blocks all uploads',async()=>{const b=backend();await assert.rejects(migrate({items:[idea()],getDocument:async()=>null,request:b.request}),/Falta un documento/);assert.equal(b.writes.length,0)});
test('failed document upload does not create records with missing files',async()=>{const b=backend();b.setFailUpload();await assert.rejects(migrate({items:[idea()],getDocument:document,request:b.request}),/subir un documento/);assert.equal(b.rows.size,0)});
test('concurrent insertion is reported without upsert or delete',async()=>{const b=backend();b.setConflict();await assert.rejects(migrate({items:[idea()],getDocument:document,request:b.request}),/No se han podido copiar/);assert.equal(b.rows.size,0)});
test('retry after an uncertain commit checks existing copy and succeeds',async()=>{const b=backend();b.setLoseResponse();const args={items:[idea()],getDocument:document,request:b.request};await assert.rejects(migrate(args),/Lost response/);assert.equal((await migrate(args)).added,0);assert.equal(b.rows.size,1)});
test('unauthorized reads never trigger writes',async()=>{let writes=0;await assert.rejects(migrate({items:[{...idea(),attachments:[]}],request:async(p,o)=>{if(o?.method)writes++;return new Response('',{status:401})}}),/consultar/);assert.equal(writes,0)});
