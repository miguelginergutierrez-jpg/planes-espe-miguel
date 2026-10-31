const {readPage,readResource,publicIP}=require('./public-reader.cjs');
const pending=new Map(),cache=new Map();
async function inspect(url){
 const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error('Enlace no válido');
 const key=parsed.href,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;if(pending.has(key))return pending.get(key);
 const job=require('./research.cjs').research(key,{readPage,readResource,renderPage:(url,options)=>require('./render-reader.cjs').renderPage(url,{...options,readResource})}).then(value=>prepareSocialImage(value,key)).then(value=>{cache.set(key,{value,expires:Date.now()+(value.notice?20000:15*60*1000)});if(cache.size>100)cache.delete(cache.keys().next().value);return value}).finally(()=>pending.delete(key));pending.set(key,job);return job;
}
async function prepareSocialImage(info,url,{copyImage=require('./image-reader.cjs').copyImage}={}){
 if(!require('./instagram-reader.cjs').isInstagramLink(url)&&!require('./maps-reader.cjs').isMaps(info.mapsUrl||''))return info;
 const {imageCandidates,...result}=info,sources=[...new Set([info.image,...imageCandidates||[]].filter(Boolean))].slice(0,3);
 if(!sources.length)return result;
 const signal=AbortSignal.timeout(11000);
 for(const source of sources){try{const image=await copyImage(source,{readResource,signal});return {...result,image,rejectedFields:(result.rejectedFields||[]).filter(f=>f!=='image')}}catch{if(signal.aborted)break}}
 return {...result,image:'',needsReview:true,rejectedFields:[...new Set([...(result.rejectedFields||[]),'image'])],notice:[result.notice,'No se pudo copiar la foto pública. Puedes añadir una imagen o pegar una captura en la ficha.'].filter(Boolean).join(' ')};
}
module.exports={inspect,prepareSocialImage,publicIP,readPage};
