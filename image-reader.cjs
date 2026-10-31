'use strict';
// Raster bytes only. Fetches use the DNS-pinned reader, never a user's browser.
function dimensions(b){
 if(!Buffer.isBuffer(b)||b.length<12)throw Error('Imagen no válida');
 if(b.length>=24&&b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return {mime:'image/png',width:b.readUInt32BE(16),height:b.readUInt32BE(20)};
 if(['GIF87a','GIF89a'].includes(b.subarray(0,6).toString())&&b.length>=10)return {mime:'image/gif',width:b.readUInt16LE(6),height:b.readUInt16LE(8)};
 if(b[0]===255&&b[1]===216){
  let i=2;while(i+4<b.length){if(b[i++]!==255)throw Error('JPEG no válido');while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;if(marker===1||marker>=208&&marker<=215)continue;const size=b.readUInt16BE(i);if(size<2||i+size>b.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)&&size>=8)return {mime:'image/jpeg',height:b.readUInt16BE(i+3),width:b.readUInt16BE(i+5)};i+=size;}
 }
 if(b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'){
  for(let i=12;i+8<=b.length;){const tag=b.subarray(i,i+4).toString(),size=b.readUInt32LE(i+4),p=i+8;if(p+size>b.length)break;
   if(tag==='VP8X'&&size>=10)return {mime:'image/webp',width:b.readUIntLE(p+4,3)+1,height:b.readUIntLE(p+7,3)+1};
   if(tag==='VP8L'&&size>=5&&b[p]===47){const bits=b.readUInt32LE(p+1);return {mime:'image/webp',width:(bits&16383)+1,height:((bits>>>14)&16383)+1};}
   if(tag==='VP8 '&&size>=10&&b.subarray(p+3,p+6).equals(Buffer.from([157,1,42])))return {mime:'image/webp',width:b.readUInt16LE(p+6)&16383,height:b.readUInt16LE(p+8)&16383};
   i=p+size+(size%2);
  }
 }
 throw Error('Formato de foto no admitido');
}
function validateRaster(body){
 if(body.length>2000000)throw Error('Foto demasiado grande');
 const info=dimensions(body);if(info.width<100||info.height<80||info.width>6000||info.height>6000||info.width*info.height>8000000)throw Error('Dimensiones de foto no válidas');return info;
}
async function encodeImage(body,{signal=AbortSignal.timeout(9000)}={}){
 const info=validateRaster(body);signal.throwIfAborted();
 const {chromium}=require(require('./reader-runtime.cjs').resolve('playwright'));
 const browser=await chromium.launch({...require('./render-reader.cjs').browserOptions(),timeout:7000});
 const close=()=>browser.close().catch(()=>{});signal.addEventListener('abort',close,{once:true});
 try{
  signal.throwIfAborted();const context=await browser.newContext({serviceWorkers:'block',acceptDownloads:false});
  await context.routeWebSocket('**/*',r=>r.close());await context.route('**/*',r=>r.abort());
  const page=await context.newPage();
  return await page.evaluate(async input=>{
   const bitmap=await createImageBitmap(await(await fetch(input)).blob());
   try{const canvas=document.createElement('canvas');
    for(const side of [480,360,240]){const scale=Math.min(1,side/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const c=canvas.getContext('2d');c.fillStyle='#fffefb';c.fillRect(0,0,canvas.width,canvas.height);c.drawImage(bitmap,0,0,canvas.width,canvas.height);
     for(const quality of [.72,.6,.45,.3]){const data=canvas.toDataURL('image/webp',quality);if(data.startsWith('data:image/webp;')&&data.length<=45000)return data;}
    }throw Error('No se pudo reducir la foto');
   }finally{bitmap.close()}
  },'data:'+info.mime+';base64,'+body.toString('base64'));
 }finally{signal.removeEventListener('abort',close);await close()}
}
async function copyImage(url,{readResource=require('./public-reader.cjs').readResource,encode=encodeImage,signal=AbortSignal.timeout(11000)}={}){
 const response=await readResource(url,{signal,maxBytes:2000000,maxOutputBytes:2000000,accept:'image/webp,image/jpeg,image/png,image/gif'});
 validateRaster(response.body);return encode(response.body,{signal});
}
module.exports={dimensions,validateRaster,encodeImage,copyImage};
