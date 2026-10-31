(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FoodTypes=api})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const rules=[
  ['Mexicana',/\b(mexican\w*|tacos?|taqueria|tex.?mex)\b/],
  ['Japonesa',/\b(japon\w*|japan\w*|sushi|ramen|izakaya)\b/],
  ['China',/\b(chin[ao]|chinese|cantones\w*|sichuan|dim sum)\b/],
  ['Arroces',/\b(arroces|arroceria|paellas?|rice restaurant)\b/],
  ['Catalana',/\b(catalan\w*|cuina catalana)\b/],
  ['Valenciana',/\b(valencian\w*)\b/],
  ['Tailandesa',/\b(thai\w*|tailand\w*)\b/],
  ['Vietnamita',/\b(vietnam\w*)\b/],
  ['Coreana',/\b(corean\w*|korean\w*)\b/],
  ['Africana',/\b(african\w*|etiop\w*|senegales\w*)\b/],
  ['Peruana',/\b(peruan\w*|peruvian|cevicheria)\b/],
  ['Italiana',/\b(italian\w*|pizza|pizzeria|trattoria|osteria)\b/],
  ['Árabe',/\b(arab\w*|arabic|marroqu\w*|moroccan|magrebi\w*)\b/],
  ['Europa del Este',/\b(europa del este|eastern european|ruman\w*|romanian|polac\w*|polish|ucranian\w*|ukrainian|rus[ao]|russian|balcan\w*)\b/],
  ['India',/\b(india|indio|indian|hindu|tandoori)\b/],
  ['Griega',/\b(grieg\w*|greek)\b/],
  ['Turca',/\b(turc[ao]|turkish|kebab)\b/],
  ['Libanesa',/\b(libanes\w*|lebanese)\b/],
  ['Argentina',/\b(argentin\w*)\b/],
  ['Brasileña',/\b(brasil\w*|brazil\w*)\b/],
  ['Mediterránea',/\b(mediterran\w*)\b/],
  ['Española',/\b(espanol\w*|spanish)\b/],
  ['Tapas',/\b(tapas|tapeo)\b/],
  ['Vegetariana / Vegana',/\b(vegetarian\w*|vegan\w*)\b/],
  ['Hamburguesas',/\b(hamburgues\w*|burgers?)\b/],
  ['Pescados y mariscos',/\b(marisqueria|seafood|pescados y mariscos)\b/],
  ['Bodega',/\b(bodega|vinoteca|wine bar)\b/],
  ['Fusión',/\b(fusion|nikkei)\b/]
 ];
 const types=Object.freeze([...rules.map(([type])=>type),'Otros']);
 const text=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function infer(record){
  // Structured cuisine takes precedence. Do not infer cuisine from city/address.
  for(const source of [record.cuisine,[record.title,record.summary].filter(Boolean).join(' ')]){
   const value=text(source);if(!value)continue;
   const matches=rules.filter(([,pattern])=>pattern.test(value)).map(([type])=>type);
   if(matches.includes('Fusión'))return 'Fusión';
   if(matches.length)return matches[0];
  }
  return 'Otros';
 }
 function resolve(record){return record.manualFields?.includes('cuisineType')&&types.includes(record.cuisineType)?record.cuisineType:infer(record)}
 return {types,infer,resolve};
});
