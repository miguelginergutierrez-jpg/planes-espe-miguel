const http=require('node:http'),https=require('node:https'),dns=require('node:dns').promises,zlib=require('node:zlib');
const {promisify}=require('node:util');
function publicIP(ip){const a=ip.split('.').map(Number);return a.length===4&&a.every(n=>Number.isInteger(n)&&n>=0&&n<=255)&&![0,10,127].includes(a[0])&&a[0]<224&&!(a[0]===169&&a[1]===254)&&!(a[0]===172&&a[1]>=16&&a[1]<=31)&&!(a[0]===192&&(a[1]===168||a[1]===0||a[1]===2))&&!(a[0]===100&&a[1]>=64&&a[1]<=127)&&!(a[0]===198&&(a[1]===18||a[1]===19||a[1]===51))&&!(a[0]===203&&a[1]===0)}
async function readResource(raw,{signal=AbortSignal.timeout(12000),redirects=0}={}){
 const u=new URL(raw);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.port&&!['80','443'].includes(u.port))throw Error('Enlace no permitido');
 signal.throwIfAborted();const addresses=await dns.lookup(u.hostname,{family:4,all:true});signal.throwIfAborted();if(!addresses.length||addresses.some(x=>!publicIP(x.address)))throw Error('Solo páginas públicas');
 return new Promise((resolve,reject)=>{const transport=u.protocol==='https:'?https:http;const req=transport.get(u,{signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; PlanesEspeMiguel/1.0)','Accept':'text/html,application/xhtml+xml,application/json,text/calendar,text/plain;q=0.9,*/*;q=0.5','Accept-Language':'es,ca;q=0.9,en;q=0.7','Accept-Encoding':'gzip, deflate, br'},lookup:(_h,opts,cb)=>opts.all?cb(null,[addresses[0]]):cb(null,addresses[0].address,4)},res=>{
 if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){res.resume();if(redirects>=5)return reject(Error('Demasiadas redirecciones'));readResource(new URL(res.headers.location,u).href,{signal,redirects:redirects+1}).then(resolve,reject);return}
 if(res.statusCode!==200){res.resume();return reject(Error('Página no disponible ('+res.statusCode+')'))}
 let chunks=[],size=0;res.on('data',c=>{size+=c.length;if(size>6000000){req.destroy(Error('Contenido demasiado grande'));return}chunks.push(c)});res.on('end',async()=>{try{let body=Buffer.concat(chunks);const encoding=res.headers['content-encoding'];const unzip=encoding==='gzip'?zlib.gunzip:encoding==='br'?zlib.brotliDecompress:encoding==='deflate'?zlib.inflate:null;if(unzip)body=await promisify(unzip)(body,{maxOutputLength:8000000});if(body.length>8000000)throw Error('Contenido demasiado grande');signal.throwIfAborted();resolve({url:u.href,body,headers:res.headers})}catch(e){reject(e)}});res.on('error',reject)
 });req.setTimeout(8000,()=>req.destroy(Error('Tiempo agotado')));req.on('error',reject)});
}
async function readPage(raw,options={}){return require('./source-reader.cjs').documentPage(await readResource(raw,options))}
module.exports={readResource,readPage,publicIP};
