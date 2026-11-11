import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 for(const light of [true,false]){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.setItem('labStartConfigured','1');
   window.paletteColors={};
   for(const method of ['fillRect','stroke']){
    const original=CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method]=function(...args){
     const color=method==='stroke'?this.strokeStyle:this.fillStyle;
     window.paletteColors[color]=(window.paletteColors[color]||0)+1;
     return original.apply(this,args);
    };
   }
  });
  await page.goto(`http://127.0.0.1:8767/circuitjgr.html?lang=en&whiteBackground=${light}`);
  await page.waitForFunction(()=>window.CircuitJS1?.getTime()>0.1);
  await page.waitForFunction(light=>Object.keys(window.paletteColors).includes(light?'#6a1b9a':'#ffff00'),light);
  const canvas=page.locator('.canvasWrapper > canvas');
  assert.equal(await canvas.evaluate(c=>c.style.backgroundColor),light?'rgb(255, 255, 255)':'rgb(0, 0, 0)');
  const colors=await page.evaluate(()=>window.paletteColors);
  if(light){assert(colors['#e2e5e9'],'Cuadrícula clara del osciloscopio');assert(!colors['#ffff00'],'Sin corriente amarilla sobre blanco');}
  // Exercise the actual menu twice in the same running simulation.
  for(const nextLight of [!light,light]){
   await page.evaluate(()=>{window.paletteColors={};});
   await page.locator('.gwt-MenuBar-horizontal > table > tbody > tr > td:nth-child(5)').click();
   await page.locator('.gwt-MenuBar-horizontal li').filter({hasText:'White Background',visible:true}).click();
   await page.waitForFunction(light=>{
    const c=document.querySelector('.canvasWrapper > canvas');
    return c?.style.backgroundColor===(light?'rgb(255, 255, 255)':'rgb(0, 0, 0)')
      && window.paletteColors[light?'#6a1b9a':'#ffff00'];
   },nextLight);
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('OK: circuito y osciloscopio claros, corriente contrastada y fondo negro conservado.');
} finally {await browser.close();}
