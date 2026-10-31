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
     const gaps=await p.evaluate(()=>{
      const cities=[...document.querySelectorAll('[data-city]')].map(e=>e.getBoundingClientRect());
      const modes=[...document.querySelectorAll('[data-mode]')].map(e=>e.getBoundingClientRect());
      const status=document.querySelector('#statusFilter').getBoundingClientRect();
      return {inside:[cities[1].left-cities[0].right,cities[2].left-cities[1].right,modes[1].left-modes[0].right],groups:[modes[0].left-cities[2].right,status.left-modes[1].right]};
     });
     assert.ok(gaps.inside.every(g=>g===gaps.inside[0]&&g>=6),JSON.stringify(gaps));
     assert.equal(gaps.groups[0],gaps.groups[1],JSON.stringify(gaps));
     await p.locator('[data-mode=calendar]').click();
     assert.deepEqual(await p.locator('[data-city]').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}})),boxes);
    }
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Desbordamiento ${section} ${width}`);
   }
  }
  await p.setViewportSize({width:390,height:844});await p.locator('button[data-page=plan]').click();
  await p.evaluate(()=>{month=new Date(2035,0,1);renderResults()});
  await p.screenshot({path:'test-results/agenda-month.png',fullPage:true});
  for(const [monthIndex,season] of [[9,'autumn'],[11,'winter'],[2,'spring'],[6,'summer']]){
   await p.evaluate(m=>{month=new Date(2035,m,1);renderResults()},monthIndex);
   assert.equal(await p.locator('.calendar').getAttribute('data-season'),season);
   const layers=await p.locator('.season-art').evaluateAll(es=>es.map(e=>({opacity:Number(getComputedStyle(e).opacity),count:e.children.length,pointer:getComputedStyle(e).pointerEvents,z:getComputedStyle(e).zIndex})));
   assert.ok(layers.at(-1).opacity>layers[0].opacity&&layers.at(-1).opacity<.1);
   assert.ok(layers.at(-1).count>layers[0].count);
   assert.ok(layers.every(l=>l.pointer==='none'&&l.z==='-1'));
   const asset=await p.request.get(new URL('/season-'+season+'.png',p.url()).href);assert.equal(asset.status(),200);assert.match(asset.headers()['content-type'],/image\/png/);
   await p.screenshot({path:'test-results/calendar-'+season+'.png',fullPage:true});
  }
  await p.locator('.day-add').first().click();assert.equal(await p.locator('.day-options').count(),1);
  assert.deepEqual(errors,[]);
  console.log('PASS month filtering, chronological list, equal filter gaps at 320/390/768/1100px and progressive decorative seasons behind interactive dates');
 }finally{await browser?.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
