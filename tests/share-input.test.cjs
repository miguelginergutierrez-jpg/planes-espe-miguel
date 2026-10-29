const {test}=require('node:test'),assert=require('node:assert/strict'),{parse}=require('../share-input.js');
test('shared URL preserves encoded query, accents and inner fragment',()=>{
 const url='https://example.org/obra?nombre=ópera&entrada=2#horarios';
 assert.equal(parse('#share='+encodeURIComponent(url)),new URL(url).href);
});
test('normal navigation has no shared input',()=>assert.equal(parse('#agenda'),null));
test('shared input rejects scripts, credentials, prose and oversized payloads',()=>{
 for(const value of ['javascript:alert(1)','https://user:secret@example.org','mira https://example.org','https://example.org https://other.org','https://example.org/'+ 'a'.repeat(8000)])assert.throws(()=>parse('#share='+encodeURIComponent(value)));
});
