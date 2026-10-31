const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');let PGlite;
try{({PGlite}=require('../test-results/sql-runtime/node_modules/@electric-sql/pglite'))}catch{}
test('PostgreSQL: exclusive list lease, requests, expiry, revisions, membership and denied direct writes',{skip:!PGlite},async()=>{
 const db=new PGlite();try{
  await db.exec("create role anon; create role authenticated; create schema auth; grant usage on schema auth to authenticated,anon; create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; create table public.planes_members(user_id uuid primary key,slot int); grant select on public.planes_members to authenticated;");
  const first=fs.readFileSync('supabase/migrations/001_shared_space.sql','utf8').match(/create function public\.planes_stamp_item\(\)[\s\S]*?\$\$;/)[0];await db.exec(first);await db.exec(fs.readFileSync('supabase/migrations/004_shared_lists.sql','utf8'));
  const a='00000000-0000-4000-8000-000000000001',b='00000000-0000-4000-8000-000000000002',outsider='00000000-0000-4000-8000-000000000003',ea='10000000-0000-4000-8000-000000000001',eb='10000000-0000-4000-8000-000000000002';
  await db.query('insert into public.planes_members values ($1,1),($2,2)',[a,b]);
  async function as(user){await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[user]);await db.exec('set role authenticated')}
  const access=async(editor,action)=> (await db.query('select public.planes_lists_access($1,$2,$3) as value',['fixture-list',editor,action])).rows[0].value;
  const payload={id:'fixture-list',title:'Compra sintética',points:[{id:'p',text:'Leche',checked:false}]};
  const save=async(editor,revision,item=payload,deleted=false)=>(await db.query('select public.planes_lists_save($1,$2,$3,$4::jsonb,$5) as value',['fixture-list',editor,revision,JSON.stringify(item),deleted])).rows[0].value;
  await as(a);assert.equal((await access(ea,'acquire')).acquired,true);assert.equal((await save(ea,0)).revision,1);
  await as(b);assert.equal((await access(eb,'acquire')).acquired,false);await assert.rejects(save(eb,1),/acceso caducado/);await assert.rejects(db.query('update public.planes_lists set payload=$1::jsonb',[JSON.stringify(payload)]),/permission denied/);await assert.rejects(db.query('select * from public.planes_list_locks'),/permission denied/);
  await as(a);assert.equal((await access(ea,'renew')).requested,true);await assert.rejects(save(ea,null),/ha cambiado/);await assert.rejects(access(ea,null),/no válida/);await assert.rejects(save(ea,0),/ha cambiado/);await assert.rejects(save(ea,1,{...payload,points:[...payload.points,...payload.points]}),/duplicados/);
  await db.exec("reset role; update public.planes_list_locks set until_at=clock_timestamp()-interval '1 second'");await as(b);assert.equal((await access(eb,'acquire')).acquired,true);assert.equal((await save(eb,1,{...payload,points:[{id:'second',text:'Pan',checked:true},{id:'first',text:'Leche',checked:false}]})).revision,2);
  await as(a);await assert.rejects(save(ea,2),/acceso caducado/);assert.equal((await access(ea,'renew')).acquired,false);
  await as(outsider);assert.equal((await db.query('select * from public.planes_lists')).rows.length,0);await assert.rejects(access(ea,'acquire'),/Acceso privado/);
  await as(b);const deleted=await save(eb,2,payload,true);assert.ok(deleted.deleted_at);assert.equal(deleted.payload.title,'Lista eliminada');assert.deepEqual(deleted.payload.points,[]);await access(eb,'release');await as(a);assert.equal((await access(ea,'acquire')).acquired,true);
  await db.exec('reset role; set role anon');await assert.rejects(db.query('select * from public.planes_lists'),/permission denied/);await assert.rejects(access(ea,'status'),/permission denied/);
 }finally{await db.close()}
});
