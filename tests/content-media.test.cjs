const test = require('node:test');
const assert = require('node:assert/strict');
const {classify, pageText} = require('../classifier.js');

test('municipal detail heading wins over brand H1; cultural content is not furniture', () => {
  const html = `<head><meta name="description" content="Cuándo: De 14/10/2026 a 08/12/2026 - Web: https://museum.example/aparador/"></head>
    <header><h1 id="site-name">Guía municipal</h1><img src="/logo.svg"></header>
    <h2 class="title">Exposició "Cartografies urbanes"</h2><div id="contenidor-detall">
    <img src="https://media.example/cartografies.jpg">
    <p>La mostra recull les transformacions de la ciutat a través de fotografies, documents i escultures.</p>
    <h3>Activitats paral·leles</h3><p>Un taller familiar con personajes de teatro y relatos de aventuras para niños y niñas.</p>
    <h3>Horarios</h3><p>De dilluns a dissabte de 09.00 h a 19.30 h.</p></div>`;
  const result = classify('https://guide.example/detall/exposicio-cartografies_123.html', html);
  assert.equal(result.kind, 'plan');
  assert.equal(result.title, 'Cartografies urbanes');
  assert.equal(result.image, 'https://media.example/cartografies.jpg');
  assert.match(result.summary, /transformacions de la ciutat/);
  assert.doesNotMatch(result.summary, /Cuándo|taller familiar/);
  assert.match(pageText(html).text, /Horarios/);
});

test('Valencian exhibition prose wins over date, venue, curator and organizer labels', () => {
  const result = classify('https://museum.example/exposicion/univers-diari/', `<meta property="og:title" content="Univers diari">
    <main><h3>Univers diari</h3><p>Dates: 7 d’octubre de 2026 al 17 de gener 2027</p>
    <p>Lloc: Centre de les Arts. Sala principal oberta a tots els públics.</p>
    <p>Comissariat: Una comissària amb una trajectòria internacional als principals museus del món.</p>
    <p>Endinsar-nos en Univers diari és descobrir el món creatiu d’una artista contemporània. Un humor àcid travessa la seua obra, amb elements de l’art pop i una simbologia pròpia.</p></main>`);
  assert.equal(result.activityType, 'Exposición');
  assert.match(result.summary, /humor àcid|art pop/);
  assert.doesNotMatch(result.summary, /Dates:|2026|Comissariat/);
});

test('complete body synopsis replaces truncated social metadata and related events', () => {
  const result = classify('https://museum.example/exposiciones/formes-vives/', `<meta property="og:description" content="Esta mostra reunix obres de dues artistes. Els dos projectes…">
    <main><h1>Formes vives</h1><p>Exposició Museu Centre Principal</p><p>07 oct. 2026 – 10 gen. 2027</p>
    <p>Esta mostra reunix dos projectes sobre animals en perill d’extinció i les relacions entre cultura i naturalesa.</p>
    <h2 class="module-title">Relacionats</h2><p>Una divertida comedia narra la historia de una familia y sus personajes de aventuras.</p></main>`);
  assert.match(result.summary, /animals en perill/);
  assert.doesNotMatch(result.summary, /projectes…|comedia|familia|2026/);
});

test('responsive lazy images use an evidenced high resolution URL, excluding header and sponsor logos', () => {
  const result = classify('https://gallery.example/exposiciones/urban-life', `<header><img src="/header.jpg"></header>
    <main><h1>Urban life</h1><img src="/placeholder.gif" data-src="/urban-life-small.jpg"
      data-srcset="/urban-life-400.jpg 400w, /urban-life-1200.jpg 1200w, /urban-life-2400.jpg 2400w" width="1200" height="800">
      <img src="/sponsor-logo.jpg" width="1600" height="1000"></main>`);
  assert.equal(result.image, 'https://gallery.example/urban-life-1200.jpg');
});

test('hero upgrades a small social thumbnail using actual markup, without guessing filenames', () => {
  const result = classify('https://gallery.example/exposiciones/water/', `<meta property="og:image" content="https://cdn.example/water-300x168.jpg">
    <main><h1>Water</h1><img src="https://cdn.example/water-860x660.jpg" alt="Water"></main>`);
  assert.equal(result.image, 'https://cdn.example/water-860x660.jpg');
});

test('picture source images and background posters are supported', () => {
  const picture = classify('https://gallery.example/exposiciones/gardens', '<main><h1>Gardens</h1><picture><source srcset="/gardens.webp 900w"></picture></main>');
  assert.equal(picture.image, 'https://gallery.example/gardens.webp');
  const poster = classify('https://gallery.example/exposiciones/gardens', '<main><h1>Gardens</h1><div class="event-image hero" style="background-image: url(/gardens.jpg)"></div></main>');
  assert.equal(poster.image, 'https://gallery.example/gardens.jpg');
});

test('absent and unsafe image sources stay empty instead of producing /undefined or executable URLs', () => {
  for (const media of ['', '<img>', '<img src="undefined">', '<img src="/undefined">', '<img src="null">', '<img src="javascript:alert(1)">', '<img src="data:image/png;base64,AAAA">', '<img src="https://name:password@example.org/image.jpg">', '<img src="/pixel.png" width="1" height="1">']) {
    const result = classify('https://gallery.example/exposiciones/empty', '<main><h1>Empty</h1>' + media + '</main>');
    assert.equal(result.image, '', media);
  }
});

test('related headings with nested spans stop content and images at the event boundary', () => {
  const html = `<main><h1>Actual exhibition</h1><p>La muestra explora una colección de objetos cotidianos y su transformación mediante el diseño.</p>
    <h2>También puede interesarte...<span id="page-relacionats"></span></h2><img src="/other-show.jpg"><p>Other show details</p></main>`;
  const result = classify('https://gallery.example/exposiciones/actual', html);
  assert.equal(result.image, '');
  assert.doesNotMatch(pageText(html).text, /Other show/);
});

test('structured product type still outranks cultural words in a shop product', () => {
  const html = '<script type="application/ld+json">{"@type":"Product","name":"Lámpara Exposición","image":"/lamp.jpg"}</script><main><h1>Lámpara Exposición</h1></main>';
  const result = classify('https://shop.example/products/lampara-exposicion', html);
  assert.equal(result.kind, 'buy');
  assert.equal(result.image, 'https://shop.example/lamp.jpg');
});
