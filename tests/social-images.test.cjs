const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {postURL,isInstagramLink,media,readInstagram}=require('../instagram-reader.cjs');
const {prepareSocialImage}=require('../preview.cjs');
const {dimensions,validateRaster,copyImage}=require('../image-reader.cjs');
const {classify}=require('../classifier.js');
const {makePayload}=require('../shortcut-api.cjs');
const url='https://www.instagram.com/p/Testing123/';
const image='https://scontent.example.cdninstagram.com/v/photo.jpg?a=1&b=2';
const page=html=>({url,html});

test('Instagram accepts canonical account prefixes and share links, never lookalike hosts or profiles',()=>{
 assert.equal(postURL('https://www.instagram.com/restaurant/p/Testing123/?igsh=tracking'),url);
 assert.equal(postURL('https://instagram.com/reel/Testing123/'),'https://www.instagram.com/reel/Testing123/');
 assert.equal(isInstagramLink('https://www.instagram.com/share/reel/Sharing123/'),true);
 for(const bad of ['https://instagram.com.evil.org/p/Testing123/','https://a:b@instagram.com/p/Testing123/','http://instagram.com/p/Testing123/','https://instagram.com/account/'])assert.equal(isInstagramLink(bad),false);
});
test('Instagram reads encoded public preview URLs despite the CDN name and account canonical',()=>{
 const html='<meta property="og:url" content="https://www.instagram.com/restaurant/p/Testing123/"><meta property="og:image" content="'+image.replace('&','&amp;')+'">';
 assert.deepEqual(media(page(html),url),[image]);
 assert.equal(classify(url,html).image,image);
});
test('Instagram binds JSON photos to the requested post, ignoring recommendations and avatars',()=>{
 const html='<script type="application/json">'+JSON.stringify({other:{shortcode:'Other123',display_url:image},requested:{shortcode:'Testing123',display_url:image},translations:['this account is private']})+'</script>';
 assert.deepEqual(media(page(html),url),[image]);
 assert.deepEqual(media(page('<meta property="og:url" content="https://www.instagram.com/p/Other123/"><meta property="og:image" content="'+image+'">'),url),[]);
 assert.deepEqual(media(page('<h1>This account is private</h1><meta property="og:image" content="'+image+'">'),url),[]);
 assert.deepEqual(media(page('<meta property="og:image" content="https://scontent.cdninstagram.com/profile_pic.jpg">'),url),[]);
});
test('Instagram uses public embed metadata when available but never renders a login screen as a photo',async()=>{
 const calls=[];
 const result=await readInstagram(url,{readPage:async target=>{calls.push(target);return page(target.endsWith('/embed/')?'<meta property="og:image" content="'+image+'">':'<html><body><main>Una publicación</main></body></html>')},renderPage:()=>assert.fail()});
 assert.equal(result.image,image);assert.equal(calls.length,2);
 const denied=await readInstagram(url,{readPage:async()=>({url:'https://www.instagram.com/accounts/login/',html:'Login'}),renderPage:()=>assert.fail()});
 assert.equal(denied.image,'');assert.match(denied.notice,/foto|captura/);
});
test('Instagram share redirects preserve the identity of the resolved post',async()=>{
 const result=await readInstagram('https://www.instagram.com/share/reel/Sharing123/',{readPage:async target=>{assert.equal(target,'https://www.instagram.com/share/reel/Sharing123/');return page('<meta property="og:image" content="'+image+'">')}});
 assert.equal(result.image,image);assert.equal(result.url,'https://www.instagram.com/share/reel/Sharing123/');
});
test('social photos become embedded copies and failed copies have an explicit fallback',async()=>{
 const data='data:image/webp;base64,YQ==';
 const info=await prepareSocialImage({image,imageCandidates:[image],rejectedFields:['image']},url,{copyImage:async candidate=>{assert.equal(candidate,image);return data}});
 assert.equal(info.image,data);assert.deepEqual(info.rejectedFields,[]);assert.equal(info.imageCandidates,undefined);
 const missing=await prepareSocialImage({image},url,{copyImage:async()=>{throw Error('403')}});
 assert.equal(missing.image,'');assert.match(missing.notice,/captura/);assert.ok(missing.rejectedFields.includes('image'));
});
test('raster validation rejects SVG, oversized downloads and decompression bombs before browser decoding',()=>{
 const png=fs.readFileSync('icon-192.png');assert.deepEqual(dimensions(png),{mime:'image/png',width:192,height:192});validateRaster(png);
 assert.throws(()=>validateRaster(Buffer.from('<svg onload="alert(1)"></svg>')));
 assert.throws(()=>validateRaster(Buffer.alloc(2000001)));
 const bomb=Buffer.from(png);bomb.writeUInt32BE(6000,16);bomb.writeUInt32BE(6000,20);assert.throws(()=>validateRaster(bomb),/Dimensiones/);
});
test('image downloads pass strict byte limits to the protected reader and preserve errors',async()=>{
 const png=fs.readFileSync('icon-192.png');
 const result=await copyImage(image,{readResource:async(target,options)=>{assert.equal(target,image);assert.equal(options.maxBytes,2000000);assert.equal(options.maxOutputBytes,2000000);assert.match(options.accept,/image\/webp/);return {body:png}},encode:async body=>{assert.equal(body,png);return 'compact'}});
 assert.equal(result,'compact');
 await assert.rejects(copyImage(image,{readResource:async()=>{throw Error('Solo páginas públicas')},encode:()=>assert.fail()}),/públicas/);
});
test('iPhone shortcut preserves complete embedded photos instead of truncating at ten thousand characters',()=>{
 const photo='data:image/webp;base64,'+'a'.repeat(20000),payload=makePayload({kind:'restaurant',title:'Foto',image:photo},'https://example.org/');
 assert.equal(payload.image,photo);
});
