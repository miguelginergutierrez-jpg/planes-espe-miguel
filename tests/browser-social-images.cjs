const assert=require('node:assert/strict'),fs=require('node:fs');
const {chromium}=require('playwright'),{createServer}=require('../server.cjs');
const {copyImage}=require('../image-reader.cjs');
(async()=>{
 const source=fs.readFileSync('logo-espe-miguel.jpg');
 const photo=await copyImage('https://scontent.test.cdninstagram.com/photo.jpg',{readResource:async()=>({body:source})});
 assert.ok(photo.startsWith('data:image/webp;')&&photo.length<=45000);
 const server=createServer({env:{},inspect:async url=>({kind:'restaurant',title:'Ficha con foto',url,image:photo,summary:'Datos de prueba',analysisVersion:'17'})});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;
 try{
  browser=await chromium.launch({channel:'msedge',headless:true});const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:'+server.address().port);
  await p.locator('#link').fill('https://www.instagram.com/p/Testing123/');await p.locator('#capture button').click();await p.waitForFunction(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1')||'[]').length===1);
  await p.locator('#nav button[data-page=restaurant]').click();await p.locator('.card img').evaluate(e=>e.decode());
  const record=await p.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))[0]);assert.equal(record.image,photo);
  await p.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await context.setOffline(true);
  await p.reload({waitUntil:'domcontentloaded'});await p.locator('#nav button[data-page=restaurant]').click();await p.locator('.card img').evaluate(e=>e.decode());
  assert.equal(await p.locator('.card img').getAttribute('src'),photo);await context.setOffline(false);
  await p.reload();await p.locator('#nav button[data-page=restaurant]').click();await p.locator('.card').click();await p.locator('.sheet-cover').evaluate(e=>e.decode());
  await p.locator('#editForm').evaluate(form=>{
   const canvas=document.createElement('canvas');canvas.width=600;canvas.height=400;canvas.getContext('2d').fillRect(0,0,600,400);
   const bytes=Uint8Array.from(atob(canvas.toDataURL().split(',')[1]),c=>c.charCodeAt(0));const transfer=new DataTransfer();transfer.items.add(new File([bytes],'captura.png',{type:'image/png'}));
   form.dispatchEvent(new ClipboardEvent('paste',{clipboardData:transfer,bubbles:true,cancelable:true}));
  });
  await p.waitForFunction(original=>document.querySelector('[name=image]').value!==original&&document.querySelector('[name=image]').value.startsWith('data:image/webp;'),photo);
  await p.locator('#editForm button[type=submit]').click();await p.waitForFunction(()=>!document.querySelector('#modal').open);
  const updated=await p.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))[0]);assert.ok(updated.manualFields.includes('image'));assert.ok(updated.image.length<=60000);
  await p.evaluate(()=>{const records=JSON.parse(localStorage.getItem('lo-nuestro-v1'));records[0].analysisVersion='16';localStorage.setItem('lo-nuestro-v1',JSON.stringify(records))});await p.reload();await p.locator('#nav button[data-page=restaurant]').click();await p.locator('.card').click();await p.waitForFunction(()=>document.querySelector('#analysisStatus')?.textContent.includes('Resumen'));assert.equal(await p.locator('[name=image]').inputValue(),updated.image);
  await p.locator('.sheet-cover').evaluate(e=>e.dispatchEvent(new Event('error')));assert.notEqual(await p.locator('.image-editor').evaluate(e=>getComputedStyle(e).display),'none');
  assert.deepEqual(errors,[]);console.log('PASS compact public photo, save/reload, pasted screenshot, protected manual photo and usable fallback after a broken image; bytes='+Buffer.from(photo.split(',')[1],'base64').length);
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
