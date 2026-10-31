const {test}=require('node:test'),assert=require('node:assert/strict');
const {readInstagram,profileURL,isInstagramLink}=require('../instagram-reader.cjs');
const {prepareSocialImage}=require('../preview.cjs');
const photo=name=>'https://scontent.example.cdninstagram.com/v/'+name+'.jpg';
const json=value=>'<script type="application/json">'+JSON.stringify(value)+'</script>';
const post='https://www.instagram.com/p/Synthetic123/';
const profile='https://www.instagram.com/mesa_sintetica/';
const node=(text,extra={})=>({code:'Synthetic123',caption:{text},display_uri:photo('place'),user:{username:'reporter_barcelona'},taken_at:1600000000,...extra});
async function read(url,html,options={}){return readInstagram(url,{readPage:async target=>({url:target,html}),...options})}

test('profiles are canonical and cannot be confused with login, navigation or lookalike hosts',()=>{
 assert.equal(profileURL('https://instagram.com/Mesa_Sintetica?igsh=tracking'),profile);
 for(const path of ['accounts','explore','direct','stories','challenge','api','p'])assert.equal(isInstagramLink('https://www.instagram.com/'+path+'/'),false);
 assert.equal(profileURL('https://instagram.com.evil.org/mesa_sintetica/'),'');
 assert.equal(profileURL('https://user:secret@instagram.com/mesa_sintetica/'),'');
});
test('public Catalan restaurant caption supplies subject, menu price and hours rather than publisher or publication date',async()=>{
 const info=await read(post,json(node('El menjador del temple Casa Verda és un espai de cuina vegetariana. Menú de dos plats per només 9 euros. Obert entre setmana al migdia.')));
 assert.equal(info.kind,'restaurant');assert.equal(info.title,'Casa Verda');assert.equal(info.price,'9 €');assert.match(info.cuisine,/vegetariana/);assert.match(info.time,/entre setmana/);
 assert.equal(info.date,'');assert.equal(info.endDate,'');assert.equal(info.city,'');assert.ok(info.rejectedFields.includes('date'));assert.equal(info.image,photo('place'));
 assert.doesNotMatch(info.summary,/reporter|likes/);
});
test('p and reel canonical paths represent the same shortcode; landscape location becomes a plan without invented date',async()=>{
 const info=await read(post,'<meta property="og:url" content="https://www.instagram.com/turismo/reel/Synthetic123/">'+json(node('Descubre estos lagos, pueblos y rutas de montaña en Asturias.',{location:{name:'Valles de prueba'}})));
 assert.equal(info.kind,'plan');assert.equal(info.title,'Valles de prueba');assert.equal(info.venue,'Valles de prueba');assert.equal(info.city,'');assert.equal(info.date,'');assert.equal(info.image,photo('place'));
 const wrong=await read(post,'<meta property="og:url" content="https://www.instagram.com/p/Other123/">'+json(node('Un restaurante')));assert.equal(wrong.image,'');assert.equal(wrong.kind,'inbox');
});
test('restaurant profile uses own food photos rather than avatar, cocktails, recommendations or another owner',async()=>{
 const food={code:'Food123',caption:{text:'Ternera asada, salsa y arroz'},display_uri:photo('food'),user:{username:'mesa_sintetica'}};
 const user={username:'mesa_sintetica',full_name:'Mesa Sintética',is_private:false,biography:'Restaurante. Cocina peruana. Abrimos de 13h a 23h.',business_phone_number:'+34930000000',business_address_json:JSON.stringify({street_address:'Carrer de Prova 10',city_name:'Barcelona'}),profile_pic_url:photo('avatar'),polaris_ordered_timeline_connection:{edges:[{node:{...food,code:'Cocktail123',caption:{text:'Cócteles de autor'},display_uri:photo('cocktail')}},{node:food}]}};
 const html='<meta property="og:image" content="'+photo('avatar')+'">'+json({user,recommendation:{...food,user:{username:'someone_else'},display_uri:photo('unrelated')}});
 const result=await read(profile,html);assert.equal(result.kind,'restaurant');assert.equal(result.title,'Mesa Sintética');assert.equal(result.image,photo('food'));assert.match(result.cuisine,/peruana/);assert.equal(result.phone,'+34930000000');assert.equal(result.address,'Carrer de Prova 10, Barcelona');assert.equal(result.city,'Barcelona');
 const copied=await prepareSocialImage(result,profile,{copyImage:async source=>{assert.equal(source,photo('food'));return 'data:image/webp;base64,YQ=='}});assert.match(copied.image,/^data:image\/webp/);
});
test('furniture profile and publication go to Casa and retain shop information',async()=>{
 const furniture={username:'mesa_sintetica',full_name:'Muebles de Prueba',biography:'Tienda de muebles y decoración. Sofás, mesas y lámparas.',polaris_ordered_timeline_connection:{edges:[{node:{code:'Furniture123',caption:{text:'Nuestro sofá nuevo'},user:{username:'mesa_sintetica'},display_uri:photo('furniture')}}]}};
 const result=await read(profile,json(furniture));assert.equal(result.kind,'buy');assert.equal(result.title,'Muebles de Prueba');assert.equal(result.shop,'Muebles de Prueba');assert.equal(result.image,photo('furniture'));assert.equal(result.city,'');
 const publication=await read(post,json(node('Tienda de muebles artesanos. Mesa de roble por 390 euros.',{location:{name:'Muebles de Prueba'}})));assert.equal(publication.kind,'buy');assert.equal(publication.shop,'Muebles de Prueba');assert.equal(publication.price,'390 €');
});
test('only the profile declared website can enrich matching identity; source photos remain Instagram photos',async()=>{
 const website='https://example.org/',html=json({username:'mesa_sintetica',full_name:'Mesa Sintética',biography:'Restaurante de cocina mexicana.',external_url:website,polaris_ordered_timeline_connection:{edges:[{node:{code:'Food123',user:{username:'mesa_sintetica'},display_uri:photo('food')}}]}});
 const calls=[];const result=await readInstagram(profile,{readPage:async target=>{calls.push(target);return {url:target,html:target===profile?html:'<main><h1>Mesa Sintética</h1><address>Carrer de Prova 12, Barcelona</address><a href="tel:+34930000000">Llamar</a></main>'}}});
 assert.deepEqual(calls,[profile,website]);assert.equal(result.address,'Carrer de Prova 12, Barcelona');assert.equal(result.phone,'+34930000000');assert.equal(result.image,photo('food'));assert.deepEqual(result.verification.sources,[profile,website]);
 const mismatch=await readInstagram(profile,{readPage:async target=>({url:target,html:target===profile?html:'<h1>Otra empresa</h1><address>Calle equivocada 5</address>'})});assert.equal(mismatch.address,'');
});
test('private profiles and login gates never produce avatars or invented restaurant details',async()=>{
 const privateResult=await read(profile,json({username:'mesa_sintetica',full_name:'Restaurante privado',biography:'Cocina peruana',is_private:true,profile_pic_url:photo('avatar')}));assert.equal(privateResult.image,'');assert.equal(privateResult.kind,'inbox');assert.match(privateResult.notice,/privada/);
 const denied=await readInstagram(profile,{readPage:async()=>({url:'https://www.instagram.com/accounts/login/',html:'<h1>Log in to Instagram</h1>'}),renderPage:()=>assert.fail()});assert.equal(denied.image,'');assert.equal(denied.kind,'inbox');
});
test('metadata fallback removes social counters and stays bound to requested media',async()=>{
 const html='<meta property="og:url" content="'+post+'"><meta property="og:description" content="123 likes, 4 comments - reporter on October 18, 2026: &quot;Visita el parque de los Lagos. Un paisaje de montaña.&quot;"><meta property="og:image" content="'+photo('landscape')+'">';
 const result=await read(post,html);assert.equal(result.kind,'plan');assert.match(result.title,/parque de los Lagos/);assert.doesNotMatch(result.summary,/likes|comments|2026/);assert.equal(result.date,'');assert.equal(result.image,photo('landscape'));
});
