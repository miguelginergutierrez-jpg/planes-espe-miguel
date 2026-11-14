(function(root){
 'use strict';
 function parse(hash){
  const params=new URLSearchParams(String(hash||'').replace(/^#/,''));
  if(!params.has('share'))return null;
  const value=params.get('share').trim();
  if(value.length>8000)throw Error('El enlace compartido es demasiado largo.');
  let url;try{url=new URL(value)}catch{throw Error('Comparte un enlace web, no una imagen o un texto.');}
  if(!['https:','http:'].includes(url.protocol)||url.username||url.password||/\s/.test(value))throw Error('Comparte un único enlace http o https válido.');
  return url.href;
 }
 function android(fields){const values=[fields.url||'',fields.text||''];if(!values.some(v=>v.trim()))values.push(fields.title||'');const links=new Set();for(const text of values)for(const m of String(text).matchAll(/https?:\/\/[^\s<>"']+/gi)){let value=m[0].replace(/[.,;!]+$/,'');for(const [a,b]of [['(',')'],['[',']']])while(value.endsWith(b)&&value.split(b).length>value.split(a).length)value=value.slice(0,-1);links.add(parse('#share='+encodeURIComponent(value)))}if(links.size!==1)throw Error('Comparte un solo enlace web cada vez.');return [...links][0]}
 async function intent(action,id,value){return new Promise((resolve,reject)=>{const open=indexedDB.open('planes-share-intents-v1',1);open.onupgradeneeded=()=>open.result.createObjectStore('pending',{keyPath:'id'});open.onerror=()=>reject(open.error);open.onsuccess=()=>{const db=open.result,tx=db.transaction('pending',action==='get'?'readonly':'readwrite'),store=tx.objectStore('pending');let result;const request=action==='put'?store.put({id,url:value,created:Date.now()}):action==='delete'?store.delete(id):store.get(id);request.onsuccess=()=>result=request.result;tx.oncomplete=()=>{db.close();resolve(action==='get'&&result&&Date.now()-result.created>86400000?null:result)};tx.onerror=()=>{db.close();reject(tx.error)}}})}
 const api={parse,android,intent};if(typeof module==='object'&&module.exports)module.exports=api;else root.SharedLink=api;
})(typeof window==='object'?window:globalThis);
