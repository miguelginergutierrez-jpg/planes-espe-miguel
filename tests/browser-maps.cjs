// Fresh browser and ephemeral server: never access the user's local storage.
const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(require('../reader-runtime.cjs').resolve('playwright'));
const root=path.join(__dirname,'..');
const result={kind:'restaurant',title:'Restaurante de prueba',url:'https://maps.app.goo.gl/test',city:'Barcelona',address:'Carrer de Prova, 3',summary:'Restaurante de cocina mediterránea.',cuisine:'Mediterránea',price:'10–20 €',phone:'931 11 22 33',website:'https://example.org/',googleRating:'4.5',googleReviews:'460',time:'Martes a sábado: 10:00–20:00',analysisVersion:'16',aiStatus:'unconfigured',summarySource:'extract'};
const server=http.createServer((req,res)=>{
 if(req.url==='/api/status'){res.setHeader('content-type','application/json');return res.end('{"configured":false}')}
 if(req.url==='/api/inspect'){res.setHeader('content-type','application/json');return res.end(JSON.stringify(result))}
 const name=req.url==='/'?'index.html':req.url.slice(1).split('?')[0];
 if(!/^[\w.-]+\.(html|js|css|jpg|png)$/.test(name)){res.writeHead(404);return res.end()}
 try{res.setHeader('content-type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':'image/jpeg');res.end(fs.readFileSync(path.join(root,name)))}catch{res.writeHead(404);res.end()}
});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{browser=await chromium.launch({headless:true,channel:'msedge'});const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
 await page.locator('#link').fill(result.url);await page.locator('#capture button').first().click();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1')||'[]').length===1);
 await page.locator('[data-page="restaurant"]').first().click();await page.locator('.card[data-detail]').click();
 for(const key of ['summary','phone','website','googleRating','googleReviews','address'])assert.equal(await page.locator('[name="'+key+'"]').inputValue(),result[key]);
 assert.equal(await page.getByText('Visitar web ↗',{exact:true}).getAttribute('href'),result.website);
 await page.locator('[name="phone"]').fill('932 22 33 44');await page.locator('#editForm button[type="submit"]').click();await page.reload();
 const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))[0]);assert.equal(record.phone,'932 22 33 44');assert.equal(record.googleRating,'4.5');assert.ok(record.manualFields.includes('phone'));
 // Reanalysis must preserve edits to the new restaurant fields too.
 await page.evaluate(()=>{const r=JSON.parse(localStorage.getItem('lo-nuestro-v1'));r[0].analysisVersion='15';localStorage.setItem('lo-nuestro-v1',JSON.stringify(r))});await page.reload();await page.locator('[data-page="restaurant"]').first().click();await page.locator('.card[data-detail]').click();await page.waitForFunction(()=>document.querySelector('#analysisStatus')?.textContent.includes('Resumen'));assert.equal(await page.locator('[name="phone"]').inputValue(),'932 22 33 44');assert.deepEqual(errors,[]);console.log('PASS restaurant capture, contact links, rating, save/reload and manual edit protection');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
