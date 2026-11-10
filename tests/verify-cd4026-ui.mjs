import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950},locale:'es-ES'});
 await page.addInitScript(()=>{
  const fillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){
   if(text==='4026'){
    const m=this.getTransform(),r=this.canvas.getBoundingClientRect();
    const cx=x+this.measureText(text).width/2;
    window.cd4026Grab={x:r.left+(m.a*cx+m.c*y+m.e)*r.width/this.canvas.width,
     y:r.top+(m.b*cx+m.d*y+m.f)*r.height/this.canvas.height,
     dy:-32*m.d*r.height/this.canvas.height};
   }
   return fillText.call(this,text,x,y,...rest);
  };
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/circuitjgr.html');
 await page.locator('#lab-start-accept').click({timeout:30000});
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 await page.evaluate(xml=>(window.CircuitJS1.importCircuit(xml,false),window.CircuitJS1.setSimRunning(true)),readFileSync(new URL('./fixtures/cd4026-practice.xml',import.meta.url),'utf8'));
 const read=()=>page.evaluate(()=>{
  const api=window.CircuitJS1,els=Array.from(api.getElements()),chip=els.find(e=>e.getType()==='CD4026Elm');
  const xml=new DOMParser().parseFromString(api.exportCircuit(),'application/xml');
  return {count:Number(xml.querySelector('CD4026')?.getAttribute('count')),info:chip?.getInfo(),
   volts:Array.from({length:16},(_,i)=>chip?.getVoltage(i)),
   segments:els.find(e=>e.getType()==='SevenSegElm')?.getInfo(),
   current:els.filter(e=>e.getType()==='ResistorElm').map(e=>e.getCurrent()),time:api.getTime(),running:api.isRunning()};
 });
 const advance=async dt=>{
  await page.evaluate(dt=>{
   const api=window.CircuitJS1,target=api.getTime()+dt;
   window.cd4026TargetReached=false;
   api.ontimestep=()=>{
    if(api.getTime()>=target){
     api.setSimRunning(false);api.ontimestep=null;window.cd4026TargetReached=true;
    }
   };
   api.setSimRunning(true);
  },dt);
  await page.waitForFunction(()=>window.cd4026TargetReached,null,{timeout:30000});
 };
 await advance(.03);
 let d=await read();assert.equal(d.count,0);assert.equal(d.volts[15],12);
 const pulse=async key=>{await page.keyboard.down(key);await advance(.03);await page.keyboard.up(key);await advance(.03);};
 // Drag before testing every displayed digit, so LED current checks also verify the moved circuit.
 await page.waitForFunction(()=>!!window.cd4026Grab);
 const before=await page.evaluate(()=>window.CircuitJS1.exportCircuit());
 const grab=await page.evaluate(()=>window.cd4026Grab);
 await page.mouse.move(grab.x,grab.y);await page.waitForTimeout(200);await page.mouse.down();await page.waitForTimeout(200);
 await page.mouse.move(grab.x,grab.y+grab.dy,{steps:8});await page.mouse.up();
 const geometry=await page.evaluate(()=>{
  const xml=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');
  const pos=xml.querySelector('CD4026').getAttribute('x').trim().split(/\s+/).map(Number);
  const ends=Array.from(xml.querySelectorAll('rw')).flatMap(w=>{
   const a=w.getAttribute('x').trim().split(/\s+/).map(Number);return [[a[0],a[1]],[a[2],a[3]]];
  });
  const [x,y]=pos;
  const pins=[[x,y],[x,y+32],[x,y+64],[x,y+96],[x+48,y-16],[x+48,y+160],
   ...Array.from({length:7},(_,i)=>[x+96,y+16*i])];
  return {position:pos,connections:pins.map(([x,y])=>ends.filter(([a,b])=>a===x&&b===y).length)};
 });
 const previous=before.match(/<CD4026[^>]* x="([^"]+)"/)[1].trim().split(/\s+/).map(Number);
 console.log('CD4026 drag geometry',JSON.stringify({grab,previous,after:geometry.position}));
 assert.equal(geometry.position[0],previous[0],'package keeps its horizontal position');
 assert.equal(geometry.position[1],previous[1]-32,'package moves vertically by 32 grid units');
 assert.deepEqual(geometry.connections,Array(13).fill(1),'all 13 used pins retain their routed wire');
 assert.equal((await read()).count,0,'dragging preserves the count');
 for(let n=1;n<=12;n++){
  await pulse('c');d=await read();assert.equal(d.count,n%10,'Count button '+n);
  assert(d.current.every(Number.isFinite));
  const expected=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'][n%10];
  d.current.slice(2).forEach((v,i)=>assert(expected.includes('abcdefg'[i])?v>.001:Math.abs(v)<1e-6,'LED current '+i+' for digit '+n%10));
 }
 await pulse('r');assert.equal((await read()).count,0);
 await pulse('c');assert.equal((await read()).count,1);
 await page.keyboard.down('c');await advance(.03);
 assert.equal((await read()).count,2);
 await advance(.2);assert.equal((await read()).count,2,'A held button must count once');
 await page.keyboard.up('c');await advance(.001);
 await page.keyboard.down('c');await advance(.03);
 assert.equal((await read()).count,2,'RC and Schmitt suppress a short release/bounce');
 await page.keyboard.up('c');await advance(.03);
 await pulse('r');await pulse('c');
 const xml=await page.evaluate(()=>window.CircuitJS1.exportCircuit());
 await page.evaluate(xml=>(window.CircuitJS1.importCircuit(xml,false),window.CircuitJS1.setSimRunning(true)),xml);await advance(.1);
 assert.equal((await read()).count,1,'XML roundtrip');
 await page.screenshot({path:process.env.CD4026_SCREENSHOT||'/tmp/cd4026-practice.png'});
 assert.deepEqual(errors,[]);console.log('OK CD4026 practice: package drag, 13 retained connections, 12 rapid button presses, 1 ms bounce rejection, 9→0, reset, LED currents and XML roundtrip');
}finally{await browser.close();}
