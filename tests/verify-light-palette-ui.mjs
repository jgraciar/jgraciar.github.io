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
   window.scopeScaleLabels={};
   window.scopeGridDirections={};
   window.scopeGridRight=0;
   const proto=CanvasRenderingContext2D.prototype;
   const move=proto.moveTo,line=proto.lineTo;
   proto.moveTo=function(x,y){this.jgrGridStart=[x,y];return move.call(this,x,y);};
   proto.lineTo=function(x,y){
    const start=this.jgrGridStart;
    if(start && ['#707070','#b0b0b0','#e2e5e9','#9aa2ac'].includes(this.strokeStyle)){
     const key=String(this.strokeStyle);
     const seen=window.scopeGridDirections[key]??(window.scopeGridDirections[key]={h:0,v:0});
     if(y===start[1] && Math.abs(x-start[0])>20){
      seen.h++;
      window.scopeGridRight=Math.max(window.scopeGridRight,this.getTransform().transformPoint({x:Math.max(x,start[0]),y}).x);
     }
     if(x===start[0] && Math.abs(y-start[1])>20)seen.v++;
    }
    return line.call(this,x,y);
   };
   for(const method of ['fillRect','stroke','fillText']){
    const original=CanvasRenderingContext2D.prototype[method];
    CanvasRenderingContext2D.prototype[method]=function(...args){
     const color=method==='stroke'?this.strokeStyle:this.fillStyle;
     window.paletteColors[color]=(window.paletteColors[color]||0)+1;
     if(method==='fillText' && this.textAlign==='right' && String(args[0]).includes('/div')){
      const point=this.getTransform().transformPoint({x:args[1],y:args[2]});
      window.scopeScaleLabels[String(args[0])+'@'+point.x]=String(args[0]);
     }
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
  await page.waitForFunction(()=>window.scopeGridRight>=document.querySelector('.canvasWrapper > canvas').width-15);
  await page.locator('#jgr-scope-info').waitFor({state:'visible'});
  assert.match(await page.locator('#jgr-scope-info').textContent(),/t = /,'Tiempo conservado en el panel de controles');
  await page.waitForFunction(()=>{
   const labels=Object.values(window.scopeScaleLabels);
   return labels.some(s=>s.startsWith('H: ')) && labels.some(s=>s.startsWith('V: ')) && labels.some(s=>/V\/div$/.test(s)) && labels.some(s=>/A\/div$/.test(s)) && labels.some(s=>/W\/div$/.test(s));
  });
  const autoMaximum=await page.evaluate(()=>{
   const xml=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');
   return Array.from(xml.querySelectorAll('o')).map(scope=>{
    const raw=scope.getAttribute('f')||'0';const flags=raw.startsWith('x')?parseInt(raw.slice(1),16):Number(raw);
    return (flags&8192)!==0 && (flags&16)===0;
   });
  });
  assert(autoMaximum.length>0 && autoMaximum.every(Boolean),'Todos los osciloscopios iniciales deben usar Auto (escala máxima)');
  const previousTimeScales=await page.evaluate(()=>{
   const previous=Object.values(window.scopeScaleLabels).filter(s=>s.startsWith('H: '));
   window.scopeScaleLabels={};
   window.CircuitJS1.setMaxTimeStep(window.CircuitJS1.getMaxTimeStep()*10);
   return previous;
  });
  await page.waitForFunction(previous=>Object.values(window.scopeScaleLabels).some(s=>s.startsWith('H: ')&&!previous.includes(s)),previousTimeScales);
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
