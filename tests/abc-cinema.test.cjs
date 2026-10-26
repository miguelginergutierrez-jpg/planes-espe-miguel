const test=require('node:test');
const assert=require('node:assert/strict');
const {classify}=require('../classifier.js');
const html=`<html><head><title>Cines ABC</title></head><body>
<div class="modal oculta"><h3 class="title">Título ventana</h3></div>
<div class="ficha"><div class="ficha-titulo"><div id-ficha="1">LA BOLA NEGRA</div></div>
<div class="ficha-imagen"><img src="https://park.cinesabc.com/obj/cartel.jpg"></div>
<div class="ficha-sinopsis">Las vidas interconectadas de tres hombres en tres épocas distintas.</div></div>
<div id="tabs-sesiones"><ul><li data-panel="tabs-1" data-fecha="26/10/2026"></li><li data-panel="tabs-2" data-fecha="27/10/2026"></li></ul>
<div id="tabs-1"><div class="hora-ses">16:00</div><div class="hora-ses">21:30</div></div>
<div id="tabs-2"><div class="hora-ses">17:50</div></div></div>
</body></html>`;
test('ABC-style cinema ficha prefers content title over generic modal title',()=>{
 const r=classify('https://park.cinesabc.com/index?pag=ficha&evento=3332',html);
 assert.equal(r.title,'LA BOLA NEGRA');assert.equal(r.activityType,'Cine');assert.equal(r.occurrences.length,3);assert.equal(r.date,'2026-10-26');assert.equal(r.endDate,'2026-10-27');assert.equal(r.image,'https://park.cinesabc.com/obj/cartel.jpg');assert.match(r.summary,/vidas interconectadas/);
});
