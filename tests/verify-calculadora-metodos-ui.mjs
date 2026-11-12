import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
try{
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.CALCULATOR_URL||'http://127.0.0.1:8767/calculadora/');
 const options=await page.locator('#method option').evaluateAll(nodes=>nodes.map(n=>n.value));
 for(const method of ['cramer','direct','inverse','rank','equalization','elimination','substitution','auto'])assert(options.includes(method));
 for(const mode of ['grid','text']){
  if(mode==='grid'){
   await page.selectOption('#rows','2');await page.selectOption('#cols','2');await page.selectOption('#notation','letters');
   for(const [id,value] of [['0-0','2'],['0-1','3'],['0-2','12'],['1-0','1'],['1-1','-1'],['1-2','1']])await page.fill('#cell-'+id,value);
  }else{
   await page.click('#text-tab');await page.fill('#names','x, y');
   await page.fill('#equations','2(x + y) + y = 12\nx = y + 1');
  }
  for(const method of options){
   await page.selectOption('#method',method);await page.click('button[type="submit"]');
   assert(await page.locator('#error').isHidden(),await page.locator('#error').textContent());
   const text=await page.locator('#result').innerText();
   assert(text.includes('una única solución'),mode+' '+method);
   assert(text.includes('x = 3')&&text.includes('y = 2'),text);
   if(['equalization','elimination','substitution','auto'].includes(method)){
    assert(text.includes('Paso 1.'));assert(!text.includes('Reducción de Gauss-Jordan'));
   }
   await page.getByText('Comprobar la solución',{exact:true}).click();
   assert.equal(await page.locator('.check').count(),2);
  }
 }
 for(const method of ['equalization','elimination','substitution','auto']){
  for(const [equations,kind] of [['x + y = 2\n2x + 2y = 4','infinitas soluciones'],['x + y = 2\n2x + 2y = 5','no tiene solución'],['0x + y = 2\nx = 3','una única solución']]){
   await page.fill('#equations',equations);await page.selectOption('#method',method);await page.click('button[type="submit"]');
   assert(await page.locator('#error').isHidden());assert((await page.locator('#result').innerText()).includes(kind));
  }
 }
 await page.fill('#names','I1, I2, I3');
 await page.fill('#equations','I1 + I2 + I3 = 6,5\nI1 - I2 = 0,25\nI3 = 3,25');
 for(const method of ['equalization','elimination','substitution']){
  await page.selectOption('#method',method);await page.click('button[type="submit"]');assert(await page.locator('#error').isHidden());
  assert((await page.locator('.answer').innerText()).includes('3,25'));
 }
 await page.selectOption('#region','en');assert((await page.locator('.answer').innerText()).includes('3.25'));
 await page.uncheck('#decimal');assert.equal(await page.locator('.answer .fraction').count(),3);
 // HTML del editor se escapa antes de incorporarse al desarrollo.
 await page.fill('#names','x, y');await page.fill('#equations','x*y = 1\nx + y = 2');
 await page.click('button[type="submit"]');assert((await page.locator('#error').innerText()).includes('no es lineal'));
 await page.setViewportSize({width:390,height:844});await page.fill('#equations','x + y = 2\nx - y = 1');await page.click('button[type="submit"]');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Sin desbordamiento horizontal en móvil');
 assert.deepEqual(errors,[]);
 console.log('OK: los ocho métodos en ambas pestañas, compatibilidad, comprobación, tres incógnitas, formato regional, fracciones y móvil.');
}finally{await browser.close();}
