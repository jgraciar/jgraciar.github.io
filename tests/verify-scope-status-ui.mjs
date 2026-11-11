import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1450,height:960}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('labStartConfigured','1'));
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html?lang=es');
 await page.waitForFunction(()=>window.CircuitJS1?.getElements
   && document.querySelector('#jgr-scope-info')?.textContent?.includes('t = '),
   null,{timeout:90000});
 const panel=page.locator('#jgr-scope-info');
 async function check(label){
  await panel.waitFor({state:'visible'});
  const lines=(await panel.innerText()).split('\n').map(x=>x.trim()).filter(Boolean);
  assert(lines[0]?.startsWith('t = ')&&lines[0].length>4,label+': falta tiempo');
  assert(lines[1]?.includes('=')&&lines[1].split('=').at(-1)?.trim(),
    label+': falta intervalo de tiempo: '+JSON.stringify(lines));
  return lines[0];
 }
 await check('con osciloscopios');
 await page.evaluate(()=>window.CircuitJS1.setSimRunning(false));
 await check('detenido con osciloscopios');
 const count=await page.evaluate(()=>{
  const doc=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');
  const original=doc.querySelectorAll('o').length;
  doc.querySelectorAll('o').forEach(e=>e.remove());
  window.CircuitJS1.importCircuit(new XMLSerializer().serializeToString(doc),false);
  const after=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');
  return {original,remaining:after.querySelectorAll('o').length};
 });
 assert(count.original>0,'El circuito inicial debe contener osciloscopios');
 assert.equal(count.remaining,0,'El circuito importado no debe contener osciloscopios');
 await check('sin osciloscopios');
 await page.evaluate(()=>window.CircuitJS1.setSimRunning(true));
 await page.waitForFunction(()=>window.CircuitJS1.getTime()>0.01,null,{timeout:30000});
 const prior=await check('simulación en marcha sin osciloscopios');
 await page.waitForFunction(prior=>document.querySelector('#jgr-scope-info')
   ?.textContent?.split('\n')[0]!==prior,prior,{timeout:30000});
 await check('tiempo actualizado');
 const canvas=await page.locator('.canvasWrapper > canvas').boundingBox();
 assert(canvas,'No se encuentra el lienzo');
 await page.mouse.move(canvas.x+canvas.width/2,canvas.y+canvas.height/2);
 await check('puntero sobre el circuito');
 await page.evaluate(()=>window.CircuitJS1.setSimRunning(false));
 await check('detenido sin osciloscopios');
 assert.deepEqual(errors,[],'Errores de navegador');
 console.log('OK: tiempo y paso temporal permanentes con/sin osciloscopios, en marcha y detenidos');
} finally {
 await browser.close();
}
