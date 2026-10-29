// Optional PostgreSQL/WASM verification: PGLITE_MODULE points to a local @electric-sql/pglite installation.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require(process.env.PGLITE_MODULE||'@electric-sql/pglite');
(async()=>{const db=new PGlite();const user='00000000-0000-4000-8000-000000000001';
 try{
 await db.exec(`create role anon; create role authenticated; create schema auth;
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth to anon,authenticated;
 create table public.planes_members(user_id uuid primary key);
 create table public.planes_items(id text primary key,payload jsonb not null,deleted_at timestamptz);
 alter table public.planes_items enable row level security;
 insert into public.planes_members values('${user}');`);
 const migration=fs.readFileSync('supabase/migrations/003_shortcut_access.sql','utf8');await db.exec(migration);await db.exec(migration);
 await db.exec('set role anon');await assert.rejects(db.query('select * from public.planes_shortcut_tokens'));await assert.rejects(db.query('select public.planes_shortcut_create()'));await assert.rejects(db.query('select * from public.planes_items'));
 await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${user}',false)`);
 let token=(await db.query('select public.planes_shortcut_create() as token')).rows[0].token;assert.match(token,/^[a-f0-9]{64}$/);
 await db.exec('reset role; set role anon');
 assert.equal((await db.query('select public.planes_shortcut_check($1) as ok',[token])).rows[0].ok,true);
 const save=(t,url='https://example.org/',extra={})=>db.query('select public.planes_shortcut_save($1,$2,$3::jsonb) as result',[t,url,JSON.stringify({kind:'restaurant',title:'Fixture',id:'evil-id',status:'Comprado',attachments:[{id:'bad'}],...extra})]);
 await assert.rejects(save('0'.repeat(64)));assert.equal((await save(token)).rows[0].result,'saved');assert.equal((await save(token)).rows[0].result,'duplicate');
 await db.exec('reset role');const rows=(await db.query('select * from public.planes_items')).rows;assert.equal(rows.length,1);assert.notEqual(rows[0].id,'evil-id');assert.equal(rows[0].payload.status,'Pendiente');assert.deepEqual(rows[0].payload.attachments,[]);
 await db.exec(`set role authenticated`);await db.query('select public.planes_shortcut_create()');await db.exec('set role anon');await assert.rejects(save(token));
 await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',false)`);await assert.rejects(db.query('select public.planes_shortcut_create()'));
 await db.exec(`select set_config('request.jwt.claim.sub','${user}',false)`);token=(await db.query('select public.planes_shortcut_create() as token')).rows[0].token;
 await db.exec('set role anon');for(let i=0;i<8;i++)await save(token,'https://example.org/rate');await assert.rejects(save(token),/Espera/);
 await db.exec('set role authenticated');await db.query('select public.planes_shortcut_revoke()');await db.exec('set role anon');assert.equal((await db.query('select public.planes_shortcut_check($1) as ok',[token])).rows[0].ok,false);
 console.log('PASS SQL: idempotent migration, roles, no table access, non-member denied, hash authorization, deduplication, safe fields, rotation, rate limit and revoke');
 }finally{await db.close()}
})().catch(e=>{console.error(e.message);process.exitCode=1});
