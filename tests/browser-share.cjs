const assert=require('node:assert/strict'),{chromium}=require('../node_modules/playwright'),{createServer}=require('../server.cjs');
(async()=>{let deny=true,calls=0;const env={PLANES_REQUIRE_AUTH:'1'};
 const server=createServer({env,authorize:async()=>{if(deny)throw Object.assign(Error('Sesión necesaria'),{status:401});return 'fixture'},inspect:async url=>{calls++;return {kind:'restaurant',title:'Restaurante compartido',url,analysisVersion:'16'}}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;env.PLANES_PUBLIC_ORIGIN=base;let browser;
 try{browser=await chromium.launch({channel:'msedge',headless:true});const ctx=await browser.newContext(),page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='https://example.org/menu?uno=1&dos=2#precio';
 await page.goto(base+'/#share='+encodeURIComponent(url));await page.locator('#modal[open]').waitFor();await page.locator('[data-close]').click();
 assert.equal(await page.locator('#link').inputValue(),url);assert.equal(new URL(page.url()).hash,'');assert.equal(calls,0);
 await page.locator('#capture button').click();await page.locator('#modal[open]').waitFor();await page.locator('[data-close]').click();assert.equal(await page.locator('#link').inputValue(),url);
 await page.reload();await page.locator('#modal[open]').waitFor();await page.locator('[data-close]').click();assert.equal(await page.locator('#link').inputValue(),url);
 deny=false;await page.locator('#capture button').click();await page.getByText('Restaurante compartido',{exact:true}).waitFor();assert.equal(calls,1);assert.equal(await page.locator('#link').inputValue(),'');
 await page.evaluate(hash=>location.hash=hash,'share='+encodeURIComponent(url));await page.waitForFunction(()=>document.querySelector('#link')?.value.includes('example.org'));await page.locator('#capture button').click();await page.getByText('Este enlace ya está guardado. No lo hemos duplicado.').waitFor();assert.equal(calls,1);
 await page.locator('#link').fill('https://keep.example/');await page.evaluate(()=>location.hash='share=https%3A%2F%2Fother.example%2F');await page.waitForFunction(()=>location.hash==='');assert.equal(await page.locator('#link').inputValue(),'https://keep.example/');
 assert.deepEqual(errors,[]);console.log('PASS share: encoded URL, no automatic writes, login/reload retention, duplicate and draft protection');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
