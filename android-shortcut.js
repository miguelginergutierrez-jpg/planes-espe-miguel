/* Local-only HTTP Shortcuts export. Never upload the generated archive. */
(function(root){
 'use strict';
 const ICON='custom-icon_planes.png',FILENAME='guardar-en-planes-android.zip';
 function prepare(){
  const links=String(getVariable('planes_enlace')||'').match(/https?:\/\/[^\s<>"\u0000-\u001f]+/gi)||[];
  const urls=[...new Set(links.map(s=>s.replace(/[),.;!\]}>]+$/g,'')))];
  if(urls.length!==1)throw Error('Comparte un único enlace web con Guardar en Planes.');
  setVariable('planes_body',JSON.stringify({url:urls[0],token:getVariable('planes_permiso')}));
 }
 function config(token){
  if(!/^[a-f0-9]{64}$/.test(token))throw Error('Crea primero el permiso de este teléfono.');
  return {version:90,compatibilityVersion:90,categories:[{
   id:'fe47c4f8-29a8-41f1-8174-39f2a2bc82d7',name:'Planes',layoutType:'linear_list',shortcuts:[{
    id:'ac02d060-ff75-44a5-9260-01f4b0c0ce87',name:'Guardar en Planes',iconName:ICON,
    executionType:'app',method:'POST',url:'https://planes-espe-miguel.onrender.com/api/share',
    timeout:120000,waitForInternet:false,acceptAllCertificates:false,acceptCookies:false,
    launcherShortcut:true,requestBodyType:'custom_text',contentType:'application/json',
    bodyContent:'{{planes_body}}',codeOnPrepare:'('+prepare.toString()+')();',codeOnSuccess:'',codeOnFailure:'',
    excludeFromHistory:true,runOnAppStart:false,
    responseHandling:{uiType:'notification',successOutput:'message',successMessage:'Enlace guardado en Planes.',failureOutput:'simple'}
   }]}],variables:[
    {id:'de2188c4-f2c5-4454-938f-144d21058230',key:'planes_enlace',type:'constant',value:'',isShareText:true,rememberValue:false,urlEncode:false,jsonEncode:false,isSecret:true,isExcludeValueFromExport:true},
    {id:'e0ca522b-0e5d-4b19-9667-2c73140db505',key:'planes_permiso',type:'constant',value:token,isShareText:false,urlEncode:false,jsonEncode:false,isSecret:true,isExcludeValueFromExport:true}
   ]};
 }
 function crc32(data){let c=0xffffffff;for(const b of data){c^=b;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
 // Uncompressed ZIP (two small entries), supported by the official importer.
 function archive(token,icon){
  if(!(icon instanceof Uint8Array)||icon.length<8||icon[0]!==137||icon[1]!==80||icon[2]!==78||icon[3]!==71)throw Error('No se pudo preparar el logo. Reintenta la descarga.');
  const enc=new TextEncoder(),entries=[['shortcuts.json',enc.encode(JSON.stringify(config(token)))],[ICON,icon]],parts=[],directory=[];let offset=0;
  function record(size,values){const a=new Uint8Array(size),v=new DataView(a.buffer);for(const [pos,len,n]of values)len===2?v.setUint16(pos,n,true):v.setUint32(pos,n,true);return a}
  for(const [name,data]of entries){const n=enc.encode(name),crc=crc32(data),local=record(30,[[0,4,0x04034b50],[4,2,20],[10,2,0],[12,2,33],[14,4,crc],[18,4,data.length],[22,4,data.length],[26,2,n.length]]);
   parts.push(local,n,data);directory.push(record(46,[[0,4,0x02014b50],[4,2,20],[6,2,20],[14,2,33],[16,4,crc],[20,4,data.length],[24,4,data.length],[28,2,n.length],[42,4,offset]]),n);offset+=30+n.length+data.length;
  }
  const size=directory.reduce((s,a)=>s+a.length,0),end=record(22,[[0,4,0x06054b50],[8,2,entries.length],[10,2,entries.length],[12,4,size],[16,4,offset]]),out=new Uint8Array(offset+size+22);let pos=0;for(const a of [...parts,...directory,end]){out.set(a,pos);pos+=a.length}return out;
 }
 async function download(token){
  const r=await fetch('/icon-192.png');if(!r.ok)throw Error('No se pudo cargar el logo.');
  const data=archive(token,new Uint8Array(await r.arrayBuffer())),url=URL.createObjectURL(new Blob([data],{type:'application/zip'})),a=document.createElement('a');
  a.href=url;a.download=FILENAME;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }
 const api={config,archive,download,FILENAME};if(typeof module==='object'&&module.exports)module.exports=api;else root.AndroidShortcut=api;
})(typeof window==='object'?window:globalThis);
