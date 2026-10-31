const assert=require('node:assert/strict'),{chromium}=require('playwright'),{createServer}=require('../server.cjs');
(async()=>{
 let cuisine='Japanese';const server=createServer({env:{},inspect:async url=>({url,kind:url.includes('plan')?'plan':'restaurant',title:'Lectura automática',cuisine,date:url.includes('plan')?'2099-01-01':'',summary:'Descripción comprobada'})});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  const base='http://127.0.0.1:'+server.address().port;await p.goto(base);
  await p.evaluate(()=>{records=[{id:'mex',kind:'restaurant',title:'Tacos de prueba',cuisine:'Mexican',city:'Barcelona'},{id:'jap',kind:'restaurant',title:'Sushi de prueba',cuisine:'Japanese',city:'Valencia'},{id:'unknown',kind:'restaurant',title:'Mesa de prueba',city:'Barcelona'},{id:'old-plan',kind:'plan',title:'Plan anterior',status:'No Reservado'}].map(normalize);persist(records)});
  await p.locator('[data-page=restaurant]').click();assert.equal(await p.locator('.card').count(),3);assert.match(await p.locator('[data-detail=mex]').innerText(),/Mexicana/);
  for(const width of [320,390,768,1100]){
   await p.setViewportSize({width,height:844});const boxes=await p.evaluate(()=>{const a=document.querySelector('[data-city]').getBoundingClientRect(),b=document.querySelector('#cuisineFilter').getBoundingClientRect(),c=document.querySelector('.collection-controls').getBoundingClientRect();return {y:a.y,fy:b.y,h:a.height,fh:b.height,right:b.right,end:c.right,scroll:document.documentElement.scrollWidth,width:innerWidth}});
   assert.equal(boxes.y,boxes.fy);assert.equal(boxes.h,boxes.fh);assert.ok(Math.abs(boxes.right-boxes.end)<2,JSON.stringify(boxes));assert.ok(boxes.scroll<=boxes.width,JSON.stringify(boxes));
  }
  await p.setViewportSize({width:390,height:844});await p.screenshot({path:'test-results/comer-food-types.png',fullPage:true});await p.locator('#cuisineFilter').selectOption('Japonesa');assert.equal(await p.locator('.card').count(),1);
  await p.locator('[data-city=Barcelona]').click();assert.equal(await p.locator('.card').count(),0);assert.equal(await p.locator('#cuisineFilter').inputValue(),'Japonesa');
  await p.locator('#cuisineFilter').selectOption('Todos');await p.locator('[data-detail=mex]').click();assert.equal(await p.locator('[name=cuisineType]').inputValue(),'Mexicana');await p.locator('[name=cuisineType]').selectOption('Peruana');await p.locator('#editForm button[type=submit]').click();
  await p.waitForFunction(()=>!document.querySelector('#modal').open);await p.reload();await p.locator('[data-page=restaurant]').click();await p.locator('#cuisineFilter').selectOption('Peruana');assert.equal(await p.locator('.card').count(),1);
  await p.locator('[data-detail=mex]').click();await p.locator('[name=url]').fill(base+'/restaurant-one');await p.locator('[name=url]').press('Tab');await p.waitForFunction(()=>document.querySelector('#analysisStatus')?.textContent.includes('Resumen extraído'));assert.equal(await p.locator('[name=cuisineType]').inputValue(),'Peruana');await p.locator('#editForm button[type=submit]').click();await p.waitForFunction(()=>!document.querySelector('#modal').open);
  await p.locator('nav [data-page=home]').click();await p.locator('#link').fill(base+'/restaurant-two');await p.locator('#capture button').click();await p.waitForFunction(()=>records.some(x=>x.url.endsWith('/restaurant-two')));assert.equal(await p.evaluate(()=>records.find(x=>x.url.endsWith('/restaurant-two')).cuisineType),'Japonesa');
  await p.locator('nav [data-page=home]').click();await p.locator('#link').fill(base+'/new-plan');await p.locator('#capture button').click();await p.waitForFunction(()=>records.some(x=>x.url.endsWith('/new-plan')));assert.equal(await p.evaluate(()=>records.find(x=>x.url.endsWith('/new-plan')).status),'Reservado');
  await p.evaluate(()=>editor(null,'personal-Espe',null,todayInMadrid()));assert.equal(await p.locator('[name=status]').inputValue(),'Reservado');assert.equal(await p.locator('[name=cuisineType]').count(),0);await p.locator('#editForm button[type=submit]').click();await p.waitForFunction(()=>!document.querySelector('#modal').open);
  assert.equal(await p.evaluate(()=>records.find(x=>x.id==='old-plan').status),'No Reservado');
  for(const section of ['plan','buy']){await p.locator(`[data-page=${section}]`).click();assert.equal(await p.locator('#cuisineFilter').count(),0)}
  assert.deepEqual(errors,[]);console.log('PASS food filters/layout, automatic/manual cuisine, persistence/reanalysis and new plan defaults');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
