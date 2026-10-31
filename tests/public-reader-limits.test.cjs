const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),{EventEmitter}=require('node:events'),zlib=require('node:zlib');
function reader({ip='1.1.1.1',body=Buffer.from('oversized image'),encoding}={}){
 const calls=[],transport={get:(url,options,callback)=>{
  calls.push({url:url.href,options});const request=new EventEmitter();request.setTimeout=()=>request;request.destroy=error=>{request.destroyed=true;queueMicrotask(()=>request.emit('error',error))};
  queueMicrotask(()=>{const response=new EventEmitter();response.resume=()=>{};response.statusCode=url.pathname==='/redirect'?302:200;response.headers=url.pathname==='/redirect'?{location:'/image'}:{'content-encoding':encoding};callback(response);if(response.statusCode===200)queueMicrotask(()=>{response.emit('data',body);if(!request.destroyed)response.emit('end')})});return request;
 }};
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('public-reader.cjs','utf8'),{module,exports:module.exports,require:name=>name==='node:http'||name==='node:https'?transport:name==='node:dns'?{promises:{lookup:async()=>[{address:ip}]}}:require(name),URL,Buffer,AbortSignal,Error});
 return {...module.exports,calls};
}
test('public image limits and Accept survive redirects and reject excess bytes',async()=>{
 const r=reader();await assert.rejects(r.readResource('https://example.org/redirect',{maxBytes:4,maxOutputBytes:4,accept:'image/webp'}),/grande/);
 assert.equal(r.calls.length,2);assert.ok(r.calls.every(c=>c.options.headers.Accept==='image/webp'));
});
test('decompressed image limit is enforced and private DNS is rejected before fetching',async()=>{
 const compressed=reader({body:zlib.gzipSync(Buffer.alloc(100)),encoding:'gzip'});
 await assert.rejects(compressed.readResource('https://example.org/image',{maxBytes:200,maxOutputBytes:20}));
 const privateHost=reader({ip:'127.0.0.1'});await assert.rejects(privateHost.readResource('https://example.org/image'),/públicas/);assert.equal(privateHost.calls.length,0);
});
