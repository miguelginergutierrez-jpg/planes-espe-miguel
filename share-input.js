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
 const api={parse};if(typeof module==='object'&&module.exports)module.exports=api;else root.SharedLink=api;
})(typeof window==='object'?window:globalThis);
