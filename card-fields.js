(function(root){
 'use strict';
 function imageSource(value){const s=typeof value==='string'?value:'';if(s.length<=120000&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(s))return s;try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
 async function imageFromFile(file){
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>10*1024*1024)throw Error('Elige una imagen JPG, PNG o WebP de hasta 10 MB.');
  const bitmap=await createImageBitmap(file);try{const canvas=document.createElement('canvas'),scale=Math.min(1,640/Math.max(bitmap.width,bitmap.height));canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#f7f5f0';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);for(const quality of [.8,.65,.5,.35]){const result=canvas.toDataURL('image/jpeg',quality);if(result.length<=120000)return result}throw Error('La imagen contiene demasiado detalle. Elige otra más pequeña.')}finally{bitmap.close()}
 }
 function parseSessions(text){return text.split(/\r?\n/).filter(l=>l.trim()).map(line=>{const m=line.trim().match(/^(\d{4}-\d{2}-\d{2})\s+([0-2]\d:[0-5]\d)(?:\s*[-–]\s*([0-2]\d:[0-5]\d))?(?:\s+(.+))?$/);if(!m||m[2]>'23:59'||m[3]>'23:59'||new Date(m[1]+'T12:00:00Z').toISOString().slice(0,10)!==m[1])throw Error('Sesiones: usa una línea por función: AAAA-MM-DD HH:MM (opcional: -HH:MM y nota).');return {date:m[1],time:m[2],endTime:m[3]||'',label:m[4]||'',mode:'',url:''}}).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))}
 const api={imageSource,imageFromFile,parseSessions};if(typeof module==='object'&&module.exports)module.exports=api;else root.CardFields=api;
})(typeof window==='object'?window:globalThis);
