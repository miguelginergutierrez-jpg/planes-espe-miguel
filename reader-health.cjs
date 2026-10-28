'use strict';
// One synthetic startup check, without external HTTP or user documents.
async function check(render=require('./render-reader.cjs').renderPage){
 try{
  const result=await render('https://example.org/planes-runtime-check',{
   signal:AbortSignal.timeout(30000),
   readResource:async()=>({body:Buffer.from('<html><body><script>document.body.textContent="planes-dynamic-ready"</script></body></html>'),headers:{'content-type':'text/html'}})
  });
  if(!result.rendered||!/<body>planes-dynamic-ready<\/body>/.test(result.html))throw Error('Dynamic check failed');
  return {state:'ready'};
 }catch{return {state:'unavailable',notice:'La lectura dinámica no está disponible en este servidor; se mantiene la lectura pública directa.'};}
}
module.exports={check};
