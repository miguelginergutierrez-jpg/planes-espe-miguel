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
  await p.addStyleTag({content:'*,*::before,*::after{transition:none!important;animation:none!important}'});
  await p.evaluate(()=>{
   records=[
    {id:'jan',title:'Enero',date:'2035-01-12',city:'Barcelona',status:'Reservado'},
    {id:'feb',title:'Febrero',date:'2035-02-03',city:'Valencia'},
    {id:'range',title:'Dos meses',date:'2035-01-30',endDate:'2035-02-02'},
    {id:'sessions',title:'Sesiones separadas',date:'2034-12-01',endDate:'2035-02-15',occurrences:[{date:'2034-12-01',time:'19:00'},{date:'2035-02-15',time:'19:00'}]},
    {id:'none',title:'Sin fecha'}
   ].map(x=>normalize({kind:'plan',...x}));
   month=new Date(2035,0,1);
  });
  await p.locator('button[data-page=plan]').click();
  const ids=()=>p.locator('.cards .card').evaluateAll(es=>es.map(e=>e.dataset.detail));
  assert.deepEqual(await ids(),['jan','range']);
  await p.locator('[data-month="1"]').click();
  assert.deepEqual(await ids(),['sessions','range','feb']);
  await p.locator('[data-month="1"]').click();
  assert.deepEqual(await ids(),[]);
  await p.locator('[data-mode=list]').click();
  assert.deepEqual(await ids(),['sessions','jan','range','feb','none']);
  await p.locator('[data-city=Barcelona]').click();assert.deepEqual(await ids(),['jan']);
  await p.locator('[data-city=Todas]').click();
  await p.locator('#statusFilter').selectOption('Reservado');assert.deepEqual(await ids(),['jan']);
  await p.locator('#statusFilter').selectOption('Todos');
  for(const width of [320,390,768,1100]){
   await p.setViewportSize({width,height:844});
   let expected;
   for(const section of ['plan','restaurant','buy']){
    await p.locator(`button[data-page=${section}]`).click();
    const boxes=await p.locator('[data-city]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}}));
    if(expected)assert.deepEqual(boxes,expected,`Filtros ${section} a ${width}px`);else expected=boxes;
    assert.ok(boxes.every(b=>b.height===38),JSON.stringify({section,width,boxes}));
    if(section==='plan'){
     const heights=await p.locator('[data-mode],#statusFilter').evaluateAll(es=>es.map(e=>e.getBoundingClientRect().height));
     assert.ok(heights.every(h=>h===38),JSON.stringify(heights));
     await p.locator('[data-mode=calendar]').click();
     assert.deepEqual(await p.locator('[data-city]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})),boxes);
    }
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Desbordamiento ${section} ${width}`);
   }
  }
  await p.setViewportSize({width:390,height:844});await p.locator('button[data-page=plan]').click();
  await p.evaluate(()=>{month=new Date(2035,0,1);renderResults()});
  await p.screenshot({path:'test-results/agenda-month.png',fullPage:true});
  assert.deepEqual(errors,[]);
  console.log('PASS month filtering, spanning plans, discrete sessions, undated list, chronological order, filters and identical controls at 320/390/768/1100px');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
