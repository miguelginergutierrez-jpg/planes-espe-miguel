const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../event-data.js');
const {classify}=require('../classifier.js');
const {venueData}=require('../venue-data.cjs');
const {research}=require('../research.cjs');
const {verify}=require('../verification.cjs');
const page=(body,head='')=>`<html><head>${head}</head><body>${body}</body></html>`;
const table=`<table><tr><th>Días</th><th>Horas</th><th>Preus</th></tr><tr><td>De dilluns a dissabte</td><td>de 09.00 h a 19.30 h</td><td>Entrada Gratuïta</td></tr><tr><td>Diumenge i festius</td><td>de 09.00 h a 14.30 h</td><td></td></tr></table>`;
const listing=(name,period)=>page(`<header><h1 id="site-name">Portal de ciudad</h1><select><option>1–30 €</option></select></header><div id="contenidor-detall"><h2 class="title">Exposició "${name}"</h2><p>La exposición explora la relación del arte con la naturaleza y las distintas formas de vivir en una ciudad.</p><p>El artista vivió en el Palau Antiguo.</p><p>Activitats paral·leles</p><p>Dijous 22 d’octubre a les 19 h.</p>${table}<dl><dt>Se celebra en:</dt><dd><a href="/museo">Museu de Prova</a></dd><dt>Dirección:</dt><dd>Passeig de Prova, 107</dd><dt>Ciudad:</dt><dd>Barcelona</dd><dt>Cuándo</dt><dd>${period}</dd></dl></div>`);

for(const [value,date,endDate] of [
 ['De 14/10/2026 a 08/12/2026','2026-10-14','2026-12-08'],
 ['15/09/2026 – 08/01/2027','2026-09-15','2027-01-08'],
 ['7 d’octubre de 2026 al 17 de gener 2027','2026-10-07','2027-01-17'],
 ["7 d'octubre de 2026 al 17 de gener de 2027",'2026-10-07','2027-01-17'],
 ['07 oct. 2026 – 10 gen. 2027','2026-10-07','2027-01-10'],
 ['01/10 — 25/10/26','2026-10-01','2026-10-25'],
 ['11.10.2026 – 01.11.2026','2026-10-11','2026-11-01']
])test('period: '+value,()=>assert.deepEqual(E.period(value),{date,endDate}));

test('invalid dates never become real dates',()=>{
 assert.equal(E.dateIn('31/02/2027'),'');assert.equal(E.dateIn('7 d’octubre de 2026'),'2026-10-07');
});
test('municipal table keeps weekday/time association and main period, not parallel tours',()=>{
 const r=classify('https://agenda.example/exposicio-natura',listing('Natura','De 14/10/2026 a 08/12/2026'));
 assert.equal(r.kind,'plan');assert.equal(r.title,'Natura');assert.equal(r.venue,'Museu de Prova');
 assert.equal(r.address,'Passeig de Prova, 107, Barcelona');assert.equal(r.city,'Barcelona');
 assert.equal(r.date,'2026-10-14');assert.equal(r.endDate,'2026-12-08');assert.equal(r.scheduleMode,'period');
 assert.equal(r.occurrences.length,0);assert.match(r.time,/dilluns a dissabte:.*09.00.*19.30/);assert.match(r.time,/Diumenge i festius:.*14.30/);
 assert.equal(r.price,'Entrada Gratuïta');
});
test('a different exhibition retains its own cross-year period',()=>{
 const r=classify('https://agenda.example/exposicio-ciutats',listing('Ciutats','De 15/09/2026 a 08/01/2027'));
 assert.equal(r.date,'2026-09-15');assert.equal(r.endDate,'2027-01-08');
});
test('opening night is not the daily schedule of the exhibition',()=>{
 const html=page(`<main><h1>Exposició Natura</h1><p>Dates: 7 d’octubre de 2026 al 17 de gener 2027</p><p>Inauguració: 7 d’octubre de 2026 a les 19 h.</p><p>La exposición explora las relaciones entre arte, naturaleza y vida cotidiana a través de pintura y escultura.</p></main>`);
 const r=classify('https://museum.example/exposiciones/natura',html);
 assert.equal(r.date,'2026-10-07');assert.equal(r.endDate,'2027-01-17');assert.equal(r.occurrences.length,0);assert.equal(r.time,'');
});

function cinemaGraph(){
 const film='https://cinema.example/film',venue=film+'#venue';
 const event=(date,time,price)=>({'@type':'ScreeningEvent',startDate:date+'T'+time+':00+01:00',workPresented:{'@id':film},location:{'@id':venue},offers:{price,priceCurrency:'EUR',url:'https://tickets.example/'+date+time},inLanguage:'VOSE'});
 return {'@graph':[
  {'@id':venue,'@type':'MovieTheater',name:'Cinema de Prova',address:{streetAddress:'Carrer de Prova, 32',postalCode:'08012',addressLocality:'Barcelona'}},
  {'@id':film,'@type':'Movie',name:'La película',url:film,datePublished:'2026-10-22',image:'https://cdn.example/poster.webp',description:'Una mujer descubre que su inquilino ha instalado a su hijo en su casa y la convivencia transforma su rutina.',event:[event('2026-10-26','19:00','5.40'),event('2026-10-27','20:45','6.50')]},
  {'@type':'ScreeningEvent',workPresented:{'@id':'https://cinema.example/unrelated'},startDate:'2026-11-30T09:00:00+01:00'}
 ]};
}
const graphHTML=graph=>page('<main><h1>La película</h1><article><time datetime="2026-10-22">22/10/2026</time><span>19:00</span><span>20:45</span></article></main>',`<script type="application/ld+json">${JSON.stringify(graph)}</script>`);
test('cinema graph resolves film, venue and each screening, excluding release and other films',()=>{
 const r=classify('https://cinema.example/film',graphHTML(cinemaGraph()));
 assert.equal(r.kind,'plan');assert.equal(r.activityType,'Cine');assert.equal(r.title,'La película');
 assert.equal(r.image,'https://cdn.example/poster.webp');assert.match(r.summary,/^Cine: Una mujer/);
 assert.equal(r.venue,'Cinema de Prova');assert.equal(r.address,'Carrer de Prova, 32, 08012 Barcelona');
 assert.equal(r.date,'2026-10-26');assert.equal(r.endDate,'2026-10-27');assert.equal(r.price,'5,4–6,5 €');
 assert.deepEqual(r.occurrences.map(o=>[o.date,o.time,o.label]),[['2026-10-26','19:00','VOSE'],['2026-10-27','20:45','VOSE']]);
});
test('a film without an ID does not acquire screenings of another film without an ID',()=>{
 const graph={'@graph':[{'@type':'Movie',name:'La película'}, {'@type':'ScreeningEvent',workPresented:{'@type':'Movie',name:'Otra película'},startDate:'2026-11-30T09:00:00+01:00'}]};
 const html=page('<main><h1>La película</h1></main>',`<script type="application/ld+json">${JSON.stringify(graph)}</script>`);
 const r=classify('https://cinema.example/film',html);assert.equal(r.occurrences.length,0);
});
test('a surrounding movie article cannot attach all clocks to its release date',()=>{
 assert.deepEqual(E.datedRows('<article class="film"><time>22/10/2026</time><h2>Sesiones</h2><span>19:00</span><span>21:00</span></article>',s=>s.replace(/<[^>]+>/g,' ')),[]);
});

const idea={kind:'plan',activityType:'Exposición',venue:'Museu de Prova',city:'Valencia'};
test('venue reading excludes library, ticket-office and parking hours/prices',()=>{
 const html=page(`<main><h1>Museu de Prova</h1><h2>Museu</h2><p>De dimarts a diumenge de 10 a 19 h</p><p>Dilluns tancat</p><h2>Horaris de taquilles</h2><p>De 9 a 22 h</p><h2>Biblioteca</h2><p>De 8 a 15 h</p><h2>Localització</h2><p>Carrer de Prova, 118. 46003 València</p><p>Parking 2 €</p><p>Entrada general 5.00€</p><p>Entrada gratuïta, diumenges tot el dia</p></main>`);
 const r=venueData({html},idea);assert.match(r.time,/10 a 19/);assert.doesNotMatch(r.time,/22|15/);assert.match(r.price,/5.00/);assert.doesNotMatch(r.price,/2 €/);assert.equal(r.city,'Valencia');
});
test('only the named venue can supply footer information',()=>{
 const html=page('<main><h1>Exposición</h1></main><footer><p>Organizador diferente</p><h2>Horari</h2><p>De 9 a 23 h</p><p>Calle de Prova, 2</p><p>46003 Valencia</p></footer>');
 assert.deepEqual(venueData({html},idea,{footerOnly:true}),{});
});
test('same named venue footer supplies multi-line opening hours and exact address',()=>{
 const html=page('<main></main><footer><p>Museu de Prova</p><p>Horari de dimarts a diumenge</p><p>de 10:00 a 20:00 h.</p><p>C/ Museu, nº 2.</p><p>46003 Valencia</p></footer>');
 const r=venueData({html},{...idea,venue:'Museu de Prova. Sala A'},{footerOnly:true});assert.match(r.time,/dimarts.*10:00.*20:00/);assert.match(r.address,/46003 Valencia/);
});
test('research follows visitor information and reports conflicting venue schedules',async()=>{
 const origin='https://museum.example';
 const html=page(`<main><h1>Exposición Natura</h1><p>Dates: 7 d’octubre de 2026 al 17 de gener 2027</p><p>Lloc: Museu de Prova</p><p>Esta exposición explora la relación entre el arte y la naturaleza y presenta nuevas formas de entender el mundo.</p></main><footer><p><a href="/venue">Museu de Prova</a></p><p>Horari de dimarts a diumenge</p><p>de 10:00 a 20:00 h.</p><p>C/ Museu, 2</p><p>46003 Valencia</p></footer>`);
 const pages={
  [origin+'/exposiciones/natura']:html,
  [origin+'/venue']:page('<main><h1>Museu de Prova</h1><a href="/practical">Informació general</a></main>'),
  [origin+'/practical']:page('<main><h1>Museu de Prova</h1><h2>Horari</h2><p>De dimarts a diumenge d’11:00 a 21:00 hores</p><p>Entrada gratuïta</p></main>')
 };
 const readPage=async url=>{assert.ok(pages[url],'unexpected research URL '+url);return {url,html:pages[url]}};
 const r=await research(origin+'/exposiciones/natura',{readPage,configured:false,analyze:async()=>({status:'unconfigured'})});
 assert.equal(r.price,'Entrada gratuita');assert.equal(r.city,'Valencia');assert.match(r.time,/10:00 a 20:00/);
 assert.equal(r.verification.status,'review');assert.ok(r.verification.issues.some(i=>i.field==='time'));assert.equal(r.researchPages,'3');
});
test('verification rejects impossible dates and preserves concrete source values against AI rewrites',()=>{
 const p={url:'https://museum.example/expo',html:page('<main><p>Dates: 07 oct. 2026 – 10 gen. 2027</p></main>')};
 const r=verify({kind:'plan',date:'2026-11-07',endDate:'2027-02-31',aiStatus:'ready'},[p],{date:'2026-10-07'});
 assert.equal(r.date,'2026-10-07');assert.equal(r.endDate,'');assert.equal(r.verification.status,'review');
});
