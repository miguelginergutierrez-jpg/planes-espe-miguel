const {test}=require('node:test'),assert=require('node:assert/strict');
const Food=require('../food-types.js'),{makePayload}=require('../shortcut-api.cjs');
test('restaurant cuisine uses structured evidence, aliases and conservative fallback',()=>{
 for(const [cuisine,type] of [['Restaurante japonés, sushi','Japonesa'],['Korean','Coreana'],['Arrocería','Arroces'],['Italian','Italiana'],['Cuina catalana','Catalana'],['Vietnamese','Vietnamita'],['Árabe','Árabe'],['Eastern European','Europa del Este'],['Wine bar','Bodega'],['Vegetarian','Vegetariana / Vegana']])assert.equal(Food.infer({cuisine}),type,cuisine);
 assert.equal(Food.infer({cuisine:'Mexican',title:'Sushi antiguo',summary:'Italia'}),'Mexicana');
 assert.equal(Food.infer({title:'Restaurante Thai'}),'Tailandesa');
 assert.equal(Food.infer({city:'Valencia',address:'Calle Japón, Barcelona',title:'La mesa'}),'Otros');
});
test('manual cuisine survives new extraction while automatic cuisine follows evidence',()=>{
 const record={cuisine:'Mexicana',cuisineType:'Italiana',manualFields:['cuisineType']};
 assert.equal(Food.resolve(record),'Italiana');assert.equal(record.cuisine,'Mexicana');
 assert.equal(Food.resolve({...record,manualFields:[]}),'Mexicana');
 assert.equal(Food.resolve({...record,cuisineType:'unknown'}),'Mexicana');
});
test('new shortcut plans are reserved; restaurants have a cuisine; historical events remain reviewable',()=>{
 const make=info=>makePayload(info,'https://example.org/');
 assert.equal(make({kind:'plan',title:'Nuevo',date:'2099-01-01'}).status,'Reservado');
 const restaurant=make({kind:'restaurant',cuisine:'Peruvian'});assert.equal(restaurant.status,'Pendiente');assert.equal(restaurant.cuisineType,'Peruana');
 const old=make({kind:'plan',date:'2000-01-01'});assert.equal(old.kind,'inbox');assert.equal(old.status,'Pendiente');
});
