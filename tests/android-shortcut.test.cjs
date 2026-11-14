const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const android=require('../android-shortcut.js');
test('Android: restricted endpoint, private variables and headless response settings',()=>{
 const c=android.config('a'.repeat(64)),s=c.categories[0].shortcuts[0];
 assert.equal(s.url,'https://planes-espe-miguel.onrender.com/api/share');assert.equal(s.method,'POST');assert.equal(s.acceptAllCertificates,false);
 assert.equal(s.waitForInternet,false);assert.equal(s.codeOnSuccess,'');assert.equal(s.codeOnFailure,'');assert.equal(s.responseHandling.uiType,'notification');assert.equal(s.excludeFromHistory,true);assert.equal(s.runOnAppStart,false);
 assert.equal(c.variables.filter(v=>v.isShareText).length,1);assert(c.variables.every(v=>v.isSecret&&v.isExcludeValueFromExport));
 assert.throws(()=>android.config('bad'));
});
test('Android: shared title and URL become JSON without an opening script',()=>{
 const c=android.config('b'.repeat(64)),s=c.categories[0].shortcuts[0];
 function execute(text){const vars={planes_enlace:text,planes_permiso:'b'.repeat(64)};vm.runInNewContext(s.codeOnPrepare,{getVariable:k=>vars[k],setVariable:(k,v)=>vars[k]=v});return JSON.parse(vars.planes_body)}
 assert.deepEqual(execute('Mira este plan\nhttps://example.org/?q=%22hola%22&x=1'),{url:'https://example.org/?q=%22hola%22&x=1',token:'b'.repeat(64)});
 assert.equal(execute('Un plan (https://example.org/).').url,'https://example.org/');
 assert.throws(()=>execute('https://a.example https://b.example'));assert.throws(()=>execute('Sin enlace'));
});
test('Android: import ZIP contains config and original logo with correct offsets and CRC',()=>{
 const icon=new Uint8Array(fs.readFileSync('icon-192.png')),zip=Buffer.from(android.archive('c'.repeat(64),icon));
 let pos=0,entries=[];while(zip.readUInt32LE(pos)===0x04034b50){const size=zip.readUInt32LE(pos+18),n=zip.readUInt16LE(pos+26),name=zip.subarray(pos+30,pos+30+n).toString(),data=zip.subarray(pos+30+n,pos+30+n+size);assert.equal(require('node:zlib').crc32(data),zip.readUInt32LE(pos+14));entries.push({name,data});pos+=30+n+size}
 assert.equal(zip.readUInt32LE(pos),0x02014b50);assert.equal(zip.readUInt32LE(zip.length-6),pos);assert.equal(entries[0].name,'shortcuts.json');
 const config=JSON.parse(entries[0].data);assert.equal(config.categories[0].shortcuts[0].iconName,entries[1].name);assert.deepEqual(entries[1].data,Buffer.from(icon));assert.throws(()=>android.archive('c'.repeat(64),new Uint8Array(2)));
});
