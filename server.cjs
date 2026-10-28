const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const lan = process.argv.includes('--lan');
const port = 4173;
try{process.loadEnvFile(path.join(__dirname,'.env'))}catch(e){if(e.code!=='ENOENT')console.error('No se pudo leer la configuración de IA')}

http.createServer(async(req,res) => {
  if(req.url==='/api/status'&&req.method==='GET'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(require('./ai-reader.cjs').configuration()));return;}
  if(req.url==='/api/inspect'&&req.method==='POST'){
    const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data))};
    if(req.headers.origin!==`http://${req.headers.host}`||!String(req.headers['content-type']).startsWith('application/json'))return json(403,{error:'Origen no permitido'});
    try{let body='';for await(const chunk of req){body+=chunk;if(body.length>12000)return json(413,{error:'Enlace demasiado largo'})}const result=await require('./preview.cjs').inspect(JSON.parse(body).url);return json(200,result)}catch{return json(400,{error:'Enlace no válido'})}
  }
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
  const files={'/':'index.html','/index.html':'index.html','/logo-espe-miguel.jpg':'logo-espe-miguel.jpg','/documents.js':'documents.js','/supabase-public.json':'supabase-public.json','/cloud-migrate.js':'cloud-migrate.js','/cloud-connect.js':'cloud-connect.js','/app.js':'app.js','/classifier.js':'classifier.js','/event-data.js':'event-data.js','/culture-data.js':'culture-data.js','/cinema-data.js':'cinema-data.js','/calm.css':'calm.css'};
  const file=files[req.url.split('?')[0]];
  if(!file){res.writeHead(404);res.end('No encontrado');return;}
  res.writeHead(200, {'Content-Type':file.endsWith('.json')?'application/json; charset=utf-8':file.endsWith('.jpg')?'image/jpeg':file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'});
  res.end(req.method==='HEAD'?undefined:fs.readFileSync(path.join(__dirname,file)));
}).listen(port, lan?'0.0.0.0':'127.0.0.1',()=>{
  console.log('Planes Espe & Miguel: http://localhost:'+port);
  if(lan) for(const entries of Object.values(os.networkInterfaces())) for(const addr of entries||[]) if(addr.family==='IPv4'&&!addr.internal) console.log('Movil (misma Wi-Fi): http://'+addr.address+':'+port);
  console.log('Mantén esta ventana abierta. Ctrl+C para detener.');
}).on('error',e=>{console.error('No se pudo iniciar: '+e.message);process.exitCode=1});
