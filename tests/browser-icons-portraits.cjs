const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createServer}=require('../server.cjs');
(async()=>{
 const server=createServer({env:{}});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});
  const p=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);
  assert.equal(await p.locator('#settings svg').count(),1);
  assert.equal(await p.locator('#nav button svg').count(),4);
  assert.equal(await p.locator('#nav').innerText().then(s=>s.includes('🍴')),false);
  const bounds=await p.locator('#refresh svg path').evaluate(e=>{const b=e.getBBox();return {x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height}});
  assert.ok(bounds.x>=1&&bounds.y>=1&&bounds.right<=23&&bounds.bottom<=23,JSON.stringify(bounds));
  await p.evaluate(()=>{
   records=['Miguel','Espe'].map(owner=>normalize({id:owner,kind:'plan',title:'Plan '+owner,planOwner:owner}));
   records.push(normalize({id:'visit',kind:'plan',title:'Espe en Barcelona',trip:'Espe',planOwner:'Espe'}));
   records.push(normalize({id:'visit-miguel',kind:'plan',title:'Miguel en Valencia',trip:'Miguel',planOwner:'Miguel'}));
   records.push(normalize({id:'legacy',kind:'plan',title:'Espe en Barcelona',planOwner:'Espe'}));
  });
  await p.locator('button[data-page=plan]').click();await p.locator('[data-mode=list]').click();
  for(const owner of ['Miguel','Espe']){
   const picture=p.locator(`.card[data-detail="${owner}"] .art`);
   await picture.locator('img').evaluate(e=>e.decode());
   assert.ok((await picture.getAttribute('class')).includes('portrait-'+owner.toLowerCase()));
   assert.ok((await picture.boundingBox()).height<120,'El retrato conserva la tarjeta compacta');
  }
  for(const id of ['visit','visit-miguel','legacy']){
   assert.equal(await p.locator('.card[data-detail='+id+'] img').getAttribute('src'),'logo-espe-miguel.jpg');
   assert.equal(await p.locator('.card[data-detail='+id+'] .art[class*=portrait-]').count(),0);
  }
  const imageWidths=await p.locator('.art img').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().width));
  assert.ok(imageWidths.every(w=>w===imageWidths[0]));
  await p.locator('.card[data-detail=visit]').click();
  assert.equal(await p.locator('.sheet-cover').getAttribute('src'),'cover-visits-v3.jpg');
  const sharedWidth=(await p.locator('.sheet-cover').boundingBox()).width;
  await p.locator('#modal').press('Escape');
  await p.screenshot({path:'test-results/icons-portraits-list.png',fullPage:true});
  await p.locator('.card[data-detail=Espe]').click();
  await p.locator('.sheet-cover').evaluate(e=>e.decode());
  assert.equal(await p.locator('.sheet-cover.portrait-espe').count(),1);
  assert.equal(await p.locator('.sheet-cover').getAttribute('src'),'cover-espe-v3.jpg');
  assert.equal((await p.locator('.sheet-cover').boundingBox()).width,sharedWidth);
  await p.screenshot({path:'test-results/portrait-espe.png',fullPage:true});
  await p.locator('[data-owner=Miguel]').click();assert.equal(await p.locator('.sheet-cover.portrait-miguel').count(),1);
  await p.screenshot({path:'test-results/portrait-miguel.png',fullPage:true});
  await p.locator('[data-owner=Ambos]').click();assert.equal(await p.locator('.sheet-cover').count(),0);
  await p.locator('[data-owner=Espe]').click();assert.equal(await p.locator('.sheet-cover.portrait-espe').count(),1);
  // A chosen photo keeps its complete framing, even when the owner changes.
  await p.evaluate(()=>{const canvas=document.createElement('canvas');canvas.width=20;canvas.height=10;const input=document.querySelector('[name=image]');input.value=canvas.toDataURL();input.dispatchEvent(new Event('input',{bubbles:true}))});
  assert.equal(await p.locator('.sheet-cover[class*=portrait-]').count(),0);
  await p.locator('[data-owner=Miguel]').click();assert.equal(await p.locator('.sheet-cover[class*=portrait-]').count(),0);
  await p.locator('#editForm button[type=submit]').click();await p.waitForFunction(()=>!document.querySelector('#modal').open);
  assert.equal(await p.locator('.card[data-detail=Espe] .art[class*=portrait-]').count(),0);
  await p.locator('.card[data-detail=Espe]').click();
  await p.locator('#removeImage').evaluate(e=>e.click());assert.equal(await p.locator('.sheet-cover').count(),0);
  assert.deepEqual(errors,[]);
  console.log('PASS flat SVG icons, unclipped refresh paths, full visit logos, centered portraits of equal width, live owner preview and custom photo preservation');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
