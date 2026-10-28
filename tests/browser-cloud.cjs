// Isolated browser, synthetic credentials and local server. No real account.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(require('../reader-runtime.cjs').resolve('playwright'));
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{
 if(req.url==='/api/status'){res.setHeader('content-type','application/json');return res.end('{"configured":false}')}
 const name=req.url==='/'?'index.html':req.url.slice(1).split('?')[0];
 if(!/^(?:index\.html|app\.js|cloud-connect\.js|cloud-migrate\.js|documents\.js|classifier\.js|event-data\.js|culture-data\.js|cinema-data\.js|calm\.css|logo-espe-miguel\.jpg|supabase-public\.json)$/.test(name)){res.writeHead(404);return res.end()}
 res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.json')?'application/json':name.endsWith('.html')?'text/html':'image/jpeg');res.end(fs.readFileSync(path.join(root,name)));
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({headless:true,channel:'msedge'});
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[],requests=[];let authorized=true,invalidPassword=false;const remoteRows=[],remoteFiles=new Map();
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://*.supabase.co/**',async route=>{const r=route.request(),u=new URL(r.url());requests.push([r.method(),u.pathname]);
   if(u.pathname==='/auth/v1/token')return route.fulfill({status:invalidPassword?400:200,json:invalidPassword?{error:'invalid_grant'}:{access_token:'synthetic-token',expires_in:3600}});
   if(u.pathname==='/auth/v1/user')return route.fulfill({json:{id:'synthetic-user'}});
   if(u.pathname==='/rest/v1/planes_members')return route.fulfill({json:authorized?[{slot:1}]:[]});
   if(u.pathname==='/rest/v1/planes_items'){if(r.method()==='POST'){remoteRows.push(...JSON.parse(r.postData()));return route.fulfill({status:201,body:''})}return route.fulfill({json:u.searchParams.get('limit')==='0'?[]:remoteRows})}
   if(u.pathname.startsWith('/storage/v1/object/')){const key=u.pathname.split('/planes-documents/')[1];if(r.method()==='POST'){remoteFiles.set(key,r.postDataBuffer());return route.fulfill({json:{Key:key}})}return remoteFiles.has(key)?route.fulfill({body:remoteFiles.get(key),contentType:'text/plain'}):route.fulfill({status:400,json:{statusCode:'404'}})}
   throw Error('Unexpected remote request');
  });
  await page.goto('http://127.0.0.1:'+server.address().port);
  await page.evaluate(async()=>{await Documents.put([{id:'doc',name:'menu.txt',blob:new Blob(['menu'],{type:'text/plain'})}]);localStorage.setItem('lo-nuestro-v1',JSON.stringify([{id:'keep',kind:'restaurant',title:'Conservar esta ficha',status:'Pendiente',attachments:[{id:'doc',name:'menu.txt',size:4,type:'text/plain'}]}]))});await page.reload();
  const original=await page.evaluate(()=>localStorage.getItem('lo-nuestro-v1'));
  const login=async()=>{await page.locator('#cloudLogin [name=email]').fill('test@example.org');await page.locator('#cloudLogin [name=password]').fill('synthetic-password');await page.locator('#cloudLogin button').click()};
  await page.locator('#settings').click();await login();await page.getByText('Conexión verificada.',{exact:false}).waitFor();
  assert.equal(await page.locator('#cloudLogin [name=password]').inputValue(),'');
  assert.equal(await page.evaluate(()=>localStorage.getItem('lo-nuestro-v1')),original);
  await page.reload();await page.locator('#settings').click();await page.getByText('Conexión verificada.',{exact:false}).waitFor();
  await page.locator('#cloudDisconnect').click();authorized=false;await login();await page.getByText('Tu cuenta existe, pero todavía no tiene acceso',{exact:false}).waitFor();
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('planes-cloud-check-v1')),null);
  invalidPassword=true;await login();await page.getByText('Comprueba el correo y la contraseña',{exact:false}).waitFor();
  assert.equal(await page.locator('#cloudLogin [name=password]').inputValue(),'');
  assert.equal(await page.evaluate(()=>localStorage.getItem('lo-nuestro-v1')),original);
  assert.ok(requests.filter(([method])=>method!=='GET').every(([method,p])=>method==='POST'&&p==='/auth/v1/token'));
  authorized=true;invalidPassword=false;await login();await page.getByText('Conexión verificada.',{exact:false}).waitFor();
  page.on('dialog',d=>d.accept());await page.locator('#cloudCopy').click();await page.getByText('Copia verificada: 1 fichas y 1 documentos',{exact:false}).waitFor();
  assert.equal(remoteRows.length,1);assert.equal(remoteRows[0].payload.title,'Conservar esta ficha');assert.equal(remoteFiles.size,1);assert.equal([...remoteFiles.values()][0].toString(),'menu');
  await page.locator('#cloudCopy').click();await page.getByText('Copia verificada: 1 fichas y 1 documentos',{exact:false}).waitFor();assert.equal(remoteRows.length,1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('lo-nuestro-v1')),original);
  assert.deepEqual(errors,[]);console.log('PASS login, permissions, local preservation, explicit copy with document and repeat without duplication');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
