// Fresh browser contexts and synthetic backend only. Never touches the user's session.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('../node_modules/playwright');const root=path.join(__dirname,'..');
const allowed=new Set(['index.html','app.js','documents.js','classifier.js','event-data.js','culture-data.js','cinema-data.js','cloud-connect.js','cloud-migrate.js','cloud-sync.js','cloud-session.js','cloud-controller.js','calm.css','supabase-public.json','logo-espe-miguel.jpg']);
const server=http.createServer((req,res)=>{const name=req.url==='/'?'index.html':req.url.slice(1).split('?')[0];if(req.url==='/api/status'){res.setHeader('content-type','application/json');return res.end('{"configured":false}')}if(!allowed.has(name)){res.writeHead(404);return res.end()}res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.json')?'application/json':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':'image/jpeg');res.end(fs.readFileSync(path.join(root,name)))});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const origin='http://127.0.0.1:'+server.address().port,rows=new Map(),files=new Map(),errors=[],writes=[];let refreshes=0,offline=false;
 async function device(){const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('https://*.supabase.co/**',async route=>{
  if(offline)return route.abort();const req=route.request(),u=new URL(req.url()),method=req.method();
  if(u.pathname==='/auth/v1/token'){if(u.searchParams.get('grant_type')==='refresh_token')refreshes++;return route.fulfill({json:{access_token:'synthetic-access',refresh_token:'synthetic-refresh',expires_in:3600}})}
  if(u.pathname==='/auth/v1/user')return route.fulfill({json:{id:'synthetic-user'}});
  if(u.pathname==='/rest/v1/planes_members')return route.fulfill({json:[{slot:1}]});
  if(u.pathname.startsWith('/storage/')){const key=u.pathname.split('/planes-documents/')[1];if(method==='POST'){files.set(key,req.postDataBuffer());return route.fulfill({json:{}})}return files.has(key)?route.fulfill({body:files.get(key)}):route.fulfill({status:404,body:''})}
  if(u.pathname==='/rest/v1/planes_items'){
   if(method==='GET')return route.fulfill({json:[...rows.values()].slice(Number(u.searchParams.get('offset')||0),Number(u.searchParams.get('offset')||0)+500)});
   writes.push(method);const body=req.postDataJSON();let saved;
   if(method==='POST'){if(rows.has(body.id))return route.fulfill({status:409,body:''});saved={...body,revision:1};rows.set(body.id,saved)}
   else if(method==='PATCH'){const id=u.searchParams.get('id').slice(3),old=rows.get(id);if(old.revision!==Number(u.searchParams.get('revision').slice(3)))return route.fulfill({json:[]});saved={...old,...body,revision:old.revision+1};rows.set(id,saved)}
   else throw Error('Unexpected data write '+method);
   return route.fulfill({json:[saved]});
  }
  throw Error('Unexpected request '+u.pathname);
 });const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.goto(origin);return {context,page};}
 const a=await device(),b=await device();
 await a.page.evaluate(async()=>{await Documents.put([{id:'doc',name:'menu.txt',blob:new Blob(['menu'])}]);localStorage.setItem('lo-nuestro-v1',JSON.stringify([{id:'one',title:'Prueba compartida',kind:'restaurant',attachments:[{id:'doc',name:'menu.txt',size:4}]}]))});await a.page.reload();
 async function login(page){await page.locator('#settings').click();await page.locator('#cloudLogin [name=email]').fill('synthetic@example.org');await page.locator('#cloudLogin [name=password]').fill('synthetic-password');await page.locator('#cloudLogin button').click();await page.locator('#cloudEnable').waitFor();assert.equal(await page.locator('#cloudLogin [name=password]').inputValue(),'')}
 await login(a.page);assert.equal(rows.size,0);await a.page.locator('#cloudEnable').click();await a.page.waitForFunction(()=>SharedSpace.status().message.startsWith('Sincronizado.'));assert.equal(rows.size,1);
 await login(b.page);await b.page.locator('#cloudEnable').click();await b.page.waitForFunction(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1')||'[]').length===1);assert.equal(await b.page.evaluate(async()=>await(await Documents.get('doc')).blob.text()),'menu');
 // Change via actual UI, then let the other isolated browser pull automatically.
 await a.page.locator('#modal [data-close]').click();await a.page.locator('[data-page="restaurant"]').first().click();await a.page.locator('.card[data-detail]').first().click();await a.page.locator('[name=title]').fill('Cambio de Miguel');await a.page.locator('#editForm button[type=submit]').click();await a.page.waitForFunction(()=>!SharedSpace.status().message.includes('Hay cambios'));
 await a.page.evaluate(()=>SharedSpace.tick());await b.page.evaluate(()=>SharedSpace.tick());await b.page.waitForFunction(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))[0].title==='Cambio de Miguel');
 // Persisted renewable session survives a reload and refreshes without password.
 await b.page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('planes-cloud-session-v1'));s.expires=0;localStorage.setItem('planes-cloud-session-v1',JSON.stringify(s))});await b.page.reload();await b.page.waitForFunction(()=>SharedSpace.status().message.startsWith('Sincronizado.'));assert.ok(refreshes>=1);
 // Simultaneous edits are retained and surfaced. Resolve through the real UI.
 await a.page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('lo-nuestro-v1'));x[0].title='Version A';localStorage.setItem('lo-nuestro-v1',JSON.stringify(x))});await b.page.evaluate(()=>{const x=JSON.parse(localStorage.getItem('lo-nuestro-v1'));x[0].title='Version B';localStorage.setItem('lo-nuestro-v1',JSON.stringify(x))});await a.page.evaluate(()=>SharedSpace.tick());await b.page.evaluate(()=>SharedSpace.tick());assert.equal(await b.page.evaluate(()=>SharedSpace.status().conflicts.length),1);assert.equal(rows.get('one').payload.title,'Version A');await b.page.locator('#settings').click();await b.page.getByText('Usar versión compartida',{exact:true}).click();await b.page.waitForFunction(()=>SharedSpace.status().conflicts.length===0);assert.equal(await b.page.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))[0].title),'Version A');
 // Failed reads preserve data; deletion markers propagate after reconnection.
 offline=true;await b.page.evaluate(()=>SharedSpace.tick());assert.equal(await b.page.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1')).length),1);offline=false;
 await a.page.evaluate(()=>{localStorage.setItem('lo-nuestro-v1','[]')});await a.page.evaluate(()=>SharedSpace.tick());await b.page.evaluate(()=>SharedSpace.tick());assert.deepEqual(await b.page.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))),[]);assert.ok(rows.get('one').deleted_at);
 assert.ok(!writes.includes('DELETE'));assert.deepEqual(errors,[]);console.log('PASS two browsers: explicit activation, attachment, UI edit, renewable session, conflict resolution, offline preservation and deletion');
}finally{await browser.close();await new Promise(r=>server.close(r))}})().catch(e=>{console.error(e);process.exitCode=1});
