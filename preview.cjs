const {readPage,readResource,publicIP}=require('./public-reader.cjs');
const pending=new Map(),cache=new Map();
async function inspect(url){
 const parsed=new URL(url);if(!['http:','https:'].includes(parsed.protocol))throw Error('Enlace no válido');
 const key=parsed.href,hit=cache.get(key);if(hit&&hit.expires>Date.now())return hit.value;if(pending.has(key))return pending.get(key);
 const job=require('./research.cjs').research(key,{readPage,renderPage:(url,options)=>require('./render-reader.cjs').renderPage(url,{...options,readResource})}).then(value=>{cache.set(key,{value,expires:Date.now()+(value.notice?20000:15*60*1000)});if(cache.size>100)cache.delete(cache.keys().next().value);return value}).finally(()=>pending.delete(key));pending.set(key,job);return job;
}
module.exports={inspect,publicIP,readPage};
