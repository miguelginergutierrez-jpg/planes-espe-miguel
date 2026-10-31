(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Checklists=factory()})(globalThis,function(){
 'use strict';
 function normalize(x){
  if(!x||typeof x.id!=='string'||!x.id||x.id.length>200||typeof x.title!=='string'||!x.title.trim()||x.title.length>160||!Array.isArray(x.points)||x.points.length>500)throw Error('Lista no válida. Se conserva tu copia.');
  const points=x.points.map(p=>{if(!p||typeof p.id!=='string'||!p.id||p.id.length>200||typeof p.text!=='string'||!p.text.trim()||p.text.length>2000)throw Error('Punto de lista no válido.');return {id:p.id,text:p.text.trim(),checked:p.checked===true}});
  if(new Set(points.map(p=>p.id)).size!==points.length)throw Error('Hay puntos duplicados.');return {id:x.id,title:x.title.trim(),points};
 }
 function backupItems(value){if(!Array.isArray(value)||value.length>1000)throw Error('Copia de listas no válida.');const items=value.map(normalize);if(new Set(items.map(x=>x.id)).size!==items.length)throw Error('La copia contiene listas duplicadas.');return items}
 function rowValid(r){normalize(r?.payload);if(r.id!==r.payload.id||!Number.isSafeInteger(r.revision)||r.revision<1||!(r.deleted_at===null||typeof r.deleted_at==='string'))throw Error('Respuesta de listas no válida.');return r}
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 return {normalize,backupItems,rowValid,same};
});
