const path=require('node:path');
function resolve(name){for(const id of [name,path.resolve(path.dirname(process.execPath),'../node_modules',name)]){try{return require.resolve(id)}catch{}}throw Error('Dependencia de lectura no disponible: '+name)}
module.exports={resolve};
