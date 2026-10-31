const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto');
try{process.loadEnvFile(path.join(__dirname,'.env'))}catch(e){if(e.code!=='ENOENT')console.error('No se pudo leer la configuración de IA')}
const files={'/':'index.html','/index.html':'index.html','/logo-espe-miguel.jpg':'logo-espe-miguel.jpg','/icon-192.png':'icon-192.png','/icon-512.png':'icon-512.png','/manifest.webmanifest':'manifest.webmanifest','/pwa.js':'pwa.js','/documents.js':'documents.js','/supabase-public.json':'supabase-public.json','/cloud-migrate.js':'cloud-migrate.js','/cloud-sync.js':'cloud-sync.js','/cloud-session.js':'cloud-session.js','/cloud-controller.js':'cloud-controller.js','/cloud-connect.js':'cloud-connect.js','/share-input.js':'share-input.js','/card-fields.js':'card-fields.js','/app.js':'app.js','/classifier.js':'classifier.js','/event-data.js':'event-data.js','/culture-data.js':'culture-data.js','/cinema-data.js':'cinema-data.js','/calm.css':'calm.css','/season-autumn.png':'season-autumn.png','/season-winter.png':'season-winter.png','/season-spring.png':'season-spring.png','/season-summer.png':'season-summer.png'};
function createServer({env=process.env,inspect=url=>require('./preview.cjs').inspect(url),authorize=header=>require('./host-auth.cjs').requireMember(header),shortcut=require('./shortcut-api.cjs').createShortcutAPI(),readerStatus={state:'not-checked'}}={}){
 const hosted=env.PLANES_REQUIRE_AUTH==='1'||env.NODE_ENV==='production';let active=0;const rates=new Map();
 const hash=crypto.createHash('sha256');for(const name of Object.values(files)){if(fs.existsSync(path.join(__dirname,name)))hash.update(fs.readFileSync(path.join(__dirname,name)))}const shellVersion=hash.digest('hex').slice(0,16);
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' https://*.supabase.co; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
  if(req.url==='/healthz'&&req.method==='GET')return json(200,{ok:true});
  if(req.url==='/api/status'&&req.method==='GET')return json(200,{...require('./ai-reader.cjs').configuration(),authRequired:hosted,dynamicReader:readerStatus});
  if(req.url==='/api/share'&&req.method==='POST'){
   try{
    if(!String(req.headers['content-type']).startsWith('application/json'))return json(415,{ok:false,message:'Envía el enlace como JSON.'});
    let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>12000)return json(413,{ok:false,message:'El enlace es demasiado largo.'});body+=chunk.toString()}
    let data,url;try{data=JSON.parse(body);url=new URL(data.url);if(typeof data.url!=='string'||data.url.length>8000||!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error()}catch{return json(400,{ok:false,message:'Comparte un enlace web válido.'})}
    await shortcut.check(data.token);
    const key='share:'+crypto.createHash('sha256').update(data.token).digest('hex'),now=Date.now();
    for(const [id,bucket]of rates)if(bucket.until<now)rates.delete(id);
    const bucket=rates.get(key)||{until:now+60000,count:0};bucket.count++;rates.set(key,bucket);
    if(bucket.count>8||active>=1)return json(429,{ok:false,message:'Hay otro enlace en lectura. Espera un minuto y vuelve a compartir.'});
    active++;try{
     let info;try{info=await inspect(url.href)}catch{info={kind:'inbox',title:url.hostname}}
     const payload=require('./shortcut-api.cjs').makePayload(info,url.href);
     const result=await shortcut.save(data.token,url.href,payload);
     return json(200,{ok:true,message:result==='duplicate'?'Este enlace ya estaba guardado.':payload.kind==='inbox'?'Guardado en Planes. Queda por revisar.':'Guardado en Planes.',result});
    }finally{active--}
   }catch(e){return json(e.status||503,{ok:false,message:e.status?e.message:'No se pudo confirmar el guardado. Reintenta el mismo enlace.'})}
  }
  if(req.url==='/api/inspect'&&req.method==='POST'){
   const origin=hosted?(env.PLANES_PUBLIC_ORIGIN||env.RENDER_EXTERNAL_URL):'http://'+req.headers.host;
   if(!origin||req.headers.origin!==origin||!String(req.headers['content-type']).startsWith('application/json'))return json(403,{error:'Origen no permitido'});
   try{
    let body='',size=0;for await(const chunk of req){size+=chunk.length;if(size>12000)return json(413,{error:'Enlace demasiado largo'});body+=chunk.toString()}
    let url;try{url=new URL(JSON.parse(body).url);if(!['http:','https:'].includes(url.protocol)||url.username||url.password)throw Error()}catch{return json(400,{error:'Enlace no válido'})}
    if(hosted){
     const user=await authorize(req.headers.authorization),now=Date.now();
     for(const [id,bucket] of rates)if(bucket.until<now)rates.delete(id);
     const bucket=rates.get(user)||{until:now+60000,count:0};bucket.count++;rates.set(user,bucket);
     if(bucket.count>8)return json(429,{error:'Espera un minuto antes de leer más enlaces.'});
     if(active>=1)return json(429,{error:'Se está leyendo otro enlace. Inténtalo de nuevo en unos segundos.'});
    }
    active++;try{return json(200,await inspect(url.href))}finally{active--}
   }catch(e){return json(e.status||400,{error:e.status?e.message:'No se pudo leer el enlace.'})}
  }
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
  const pathname=req.url.split('?')[0];
  if(pathname==='/sw.js'){
   res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-cache','Service-Worker-Allowed':'/'});
   return res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(__dirname,'sw.js'),'utf8').replace('__SHELL_VERSION__',shellVersion));
  }
  const file=files[pathname];if(!file){res.writeHead(404);res.end('No encontrado');return;}
  res.writeHead(200,{'Content-Type':file.endsWith('.webmanifest')?'application/manifest+json':file.endsWith('.json')?'application/json; charset=utf-8':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.png')?'image/png':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-cache'});
  res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(__dirname,file)));
 });
}
if(require.main===module){
 const hosted=process.env.PLANES_REQUIRE_AUTH==='1'||process.env.NODE_ENV==='production',lan=process.argv.includes('--lan'),port=Number(process.env.PORT||4173),host=hosted||lan?'0.0.0.0':'127.0.0.1';
 const readerStatus={state:hosted?'checking':'not-checked'};
 createServer({readerStatus}).listen(port,host,()=>{
  console.log('Planes Espe & Miguel: '+(process.env.RENDER_EXTERNAL_URL||'http://localhost:'+port));
  if(hosted)require('./reader-health.cjs').check().then(result=>{Object.assign(readerStatus,result);console.log('Lector dinámico: '+result.state)});
  if(lan)for(const entries of Object.values(os.networkInterfaces()))for(const addr of entries||[])if(addr.family==='IPv4'&&!addr.internal)console.log('Movil (misma Wi-Fi): http://'+addr.address+':'+port);
 }).on('error',e=>{console.error('No se pudo iniciar: '+e.message);process.exitCode=1});
}
module.exports={createServer};
