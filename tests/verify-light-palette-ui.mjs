import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try {
 for(const light of [true,false]){
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   localStorage.setItem('labStartConfigured','1');
   window.paletteColors={};
   window.scopeBackgroundPaints=[];
   window.scopeGridDirections={};
   const proto=CanvasRenderingContext2D.prototype;
   const move=proto.moveTo,line=proto.lineTo;
   proto.moveTo=function(x,y){this.jgrGridStart=[x,y];return move.call(this,x,y);};
   proto.lineTo=function(x,y){
    const start=this.jgrGridStart;
    if(start && ['#707070','#b0b0b0','#e2e5e9','#9aa2ac'].includes(this.strokeStyle)){
     const key=String(this.strokeStyle);
     const seen=window.scopeGridDirections[key]??(window.scopeGridDirections[key]={h:0,v:0});
     if(y===start[1] && Math.abs(x-start[0])>20)seen.h++;
     if(x===start[0] && Math.abs(y-start[1])>20)seen.v++;
    }
    return line.call(this,x,y);
   };
   for(const method of ['fillRect','stroke']){
    const original=CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method]=function(...args){
     const color=method==='stroke'?this.strokeStyle:this.fillStyle;
     window.paletteColors[color]=(window.paletteColors[color]||0)+1;
     if(method==='fillRect' && this.canvas.parentElement?.classList.contains('canvasWrapper') && args[1]>this.canvas.height*.5 && args[2]>this.canvas.width*.7 && args[3]>20){
      window.scopeBackgroundPaints.push(String(color));
     }
     return original.apply(this,args);
    };
   }
  });
  await page.goto(`http://127.0.0.1:8767/circuitjgr.html?lang=en&whiteBackground=${light}`);
  await page.waitForFunction(()=>window.CircuitJS1?.getTime()>0.1);
  await page.waitForFunction(light=>Object.keys(window.paletteColors).includes(light?'#6a1b9a':'#ffff00'),light);
  const canvas=page.locator('.canvasWrapper > canvas');
  assert.equal(await canvas.evaluate(c=>c.style.backgroundColor),light?'rgb(255, 255, 255)':'rgb(0, 0, 0)');
  await page.waitForFunction(light=>{
   const seen=window.scopeGridDirections[light?'#e2e5e9':'#707070'];return seen?.h>0 && seen?.v>0;
  },light);
  const colors=await page.evaluate(()=>window.paletteColors);
  const backgrounds=await page.evaluate(()=>window.scopeBackgroundPaints);
  assert(backgrounds.length>0,'Debe comprobarse el relleno real de la zona de osciloscopios');
  assert(backgrounds.every(color=>color===(light?'#ffffff':'#111111')),'El fondo del osciloscopio debe ser blanco puro o el negro original: '+JSON.stringify([...new Set(backgrounds)]));
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
