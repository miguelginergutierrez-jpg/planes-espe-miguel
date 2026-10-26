// Optional UI integration check. Start node server.cjs first. Uses a fresh browser context only.
const assert=require('node:assert/strict');
const {chromium}=require(require('../reader-runtime.cjs').resolve('playwright'));
const origin='http://localhost:4173';
const url='https://agenda.example/exposiciones/natura';
const result={kind:'plan',title:'Natura',workTitle:'Natura',activityType:'Exposición',venue:'Museu de Prova',url,city:'Barcelona',date:'2030-10-14',endDate:'2030-12-08',time:'Lunes a sábado: 09:00–19:30; domingos: 09:00–14:30',price:'Entrada gratuita',summary:'Exposición sobre las relaciones entre el arte y la naturaleza.',image:origin+'/logo-espe-miguel.jpg',address:'Carrer de Prova, 107, Barcelona',occurrences:[],scheduleMode:'period',analysisVersion:'15',summarySource:'extract',aiStatus:'unconfigured',verification:{status:'review',checkedAt:'2026-10-26T12:00:00Z',issues:[{field:'time',reason:'El recinto publica horarios distintos en sus páginas; confirmar antes de la visita.'}],sources:[url]},notice:'Hay diferencias entre fuentes o datos pendientes de revisar.'};
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},locale:'es-ES'});
  await context.route('**/api/status',route=>route.fulfill({json:{configured:false}}));
  await context.route('**/api/inspect',route=>route.fulfill({json:result}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);
  await page.locator('#link').fill(url);await page.locator('#capture button').first().click();
  await page.waitForFunction(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1')||'[]').length===1);
  await page.locator('[data-page="plan"]').first().click();await page.locator('.card[data-detail]').first().click();
  assert.equal(await page.locator('[name="date"]').inputValue(),result.date);
  assert.equal(await page.locator('[name="endDate"]').inputValue(),result.endDate);
  assert.match(await page.locator('[name="summary"]').inputValue(),/arte y la naturaleza/);
  assert.match(await page.locator('#analysisStatus').innerText(),/horarios distintos/);
  await page.locator('#editForm button[type="submit"]').click();await page.reload();
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))[0].analysisVersion),'15');
  console.log('PASS: capture, populated fields, persistent source-conflict warning, save/reload.');

  await page.evaluate(record=>localStorage.setItem('lo-nuestro-v1',JSON.stringify([record])),{id:'legacy',kind:'buy',title:'Portal antiguo',url,image:'https://agenda.example/undefined',analysisVersion:'14',status:'Pendiente',created:'2026-10-26T10:00:00Z',updated:'2026-10-26T10:00:00Z',notes:'Conservar esta nota',manualFields:['notes'],attachments:[]});
  await page.reload();await page.locator('[data-page="buy"]').click();await page.locator('.card[data-detail="legacy"]').click();
  await page.waitForFunction(()=>document.querySelector('[name="kind"]')?.value==='plan'&&document.querySelector('[name="date"]')?.value==='2030-10-14');
  assert.equal(await page.locator('[name="notes"]').inputValue(),'Conservar esta nota');
  assert.equal(await page.locator('.sheet-cover').getAttribute('src'),result.image);
  await page.locator('#editForm button[type="submit"]').click();await page.reload();
  const migrated=await page.evaluate(()=>JSON.parse(localStorage.getItem('lo-nuestro-v1'))[0]);
  assert.equal(migrated.kind,'plan');assert.equal(migrated.date,result.date);assert.equal(migrated.notes,'Conservar esta nota');assert.equal(migrated.image,result.image);
  console.log('PASS: legacy misclassification and missing image repaired without losing notes.');

  await page.evaluate(record=>localStorage.setItem('lo-nuestro-v1',JSON.stringify([record])),{...migrated,title:'Mi título',titleMode:'manual',city:'Valencia',cityMode:'manual',date:'2032-01-10',endDate:'2032-01-11',time:'18:00',manualFields:['date','endDate','time','notes'],analysisVersion:'14'});
  await page.reload();await page.locator('[data-page="plan"]').first().click();await page.locator('.card[data-detail]').first().click();
  await page.waitForFunction(()=>document.querySelector('#analysisStatus')?.textContent.includes('Resumen extraído'));
  assert.equal(await page.locator('[name="title"]').inputValue(),'Mi título');assert.equal(await page.locator('[name="city"]').inputValue(),'Valencia');
  assert.equal(await page.locator('[name="date"]').inputValue(),'2032-01-10');assert.equal(await page.locator('[name="time"]').inputValue(),'18:00');
  assert.deepEqual(errors,[]);console.log('PASS: manual fields preserved; no browser JavaScript errors.');
  await context.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
