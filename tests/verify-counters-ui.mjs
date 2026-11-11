import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950},locale:'es-ES'});
 // Observe the label as it is painted, including zoom, pan and canvas scaling.
 // This stays in the test: no private component fields or fixed screen positions.
 await page.addInitScript(()=>{
  const fillText=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){
   if(text==='74191'||text==='7493'){
    const m=this.getTransform(),r=this.canvas.getBoundingClientRect();
    const cx=x+this.measureText(text).width/2,cy=y+5+(text==='74191'?144:96)/2; // label gap + half the package height
    window.counterGrabs??={};window.counterGrabs[text]={x:r.left+(m.a*cx+m.c*cy+m.e)*r.width/this.canvas.width,
     y:r.top+(m.b*cx+m.d*cy+m.f)*r.height/this.canvas.height,
     dy:-80*m.d*r.height/this.canvas.height};
   }
   if(this.canvas.matches('.canvasWrapper > canvas')&&y===216&&x>1015&&x<1060&&/^(?:[0-9]|1[0-5])$/.test(String(text)))window.counterDecimalText=String(text);
   return fillText.call(this,text,x,y,...rest);
  };
 });
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/circuitjgr.html');
 await page.locator('#lab-start-accept').click({timeout:30000});
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 const advance=async dt=>{
  await page.evaluate(dt=>{const api=window.CircuitJS1,target=api.getTime()+dt;window.counterTarget=false;
   api.ontimestep=()=>{if(api.getTime()>=target){api.setSimRunning(false);api.ontimestep=null;window.counterTarget=true;}};api.setSimRunning(true);
  },dt);
  await page.waitForFunction(()=>window.counterTarget,null,{timeout:30000});
 };
 const read=()=>page.evaluate(()=>{
  const api=window.CircuitJS1,chip=Array.from(api.getElements()).find(e=>/Counter74/.test(e.getType()));
  const xml=new DOMParser().parseFromString(api.exportCircuit(),'application/xml');
  const state=xml.querySelector('Counter7493,Counter74191');
  const display=Array.from(api.getElements()).find(e=>e.getType()==='DecimalDisplayElm');
  const displayValue=display?Array.from({length:4},(_,i)=>display.getVoltage(i)>2.5?1<<i:0).reduce((a,b)=>a+b,0):null;
  return {count:Number(state.getAttribute('count')),type:chip.getType(),volts:Array.from({length:chip.getPostCount()},(_,i)=>chip.getVoltage(i)),xml:api.exportCircuit(),displayValue,displayText:window.counterDecimalText};
 });
 const load=async xml=>{await page.evaluate(xml=>{window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit(xml,false);window.CircuitJS1.setSimRunning(false);},xml);await advance(.005);};
 const key=async k=>{await page.keyboard.press(k);await advance(.001);};
 for(const name of ['7493','74191']){
  const fixture=readFileSync(new URL(`./fixtures/${name}-practice.xml`,import.meta.url),'utf8');
  assert(!/<g\s/.test(fixture),'no unnecessary ground elements');
  assert.equal((fixture.match(/<M\s/g)||[]).length,name==='74191'?6:4,'all counter outputs have visible logic indicators');
  await load(fixture);const start=await read();await advance(.5);assert.equal((await read()).count,(start.count+1)%16,'actual 2 Hz clock counts');
  await page.screenshot({path:`/tmp/counter-${name}.png`});
  const beforeMove=await read();
  const coordinates=xml=>xml.match(/<Counter74[^>]*\sx="([^"]+)"/)[1];
  await page.waitForFunction(name=>!!window.counterGrabs?.[name],name);
  const grabs=[{...await page.evaluate(name=>window.counterGrabs[name],name),dx:0}];
  let moved=false;
  for(const grab of grabs){
   await page.mouse.move(grab.x,grab.y);await page.mouse.down();await page.waitForTimeout(200);
   await page.mouse.move(grab.x+grab.dx,grab.y+grab.dy,{steps:8});await page.mouse.up();
   if(coordinates((await read()).xml)!==coordinates(beforeMove.xml)){moved=true;break;}
  }
  assert(moved,'dragging the package body moves the '+name+' counter');
  {
   const state=await read();
   assert(state.type.includes('Counter'+name),'counter component is loaded');
   assert.equal(state.volts.length,name==='74191'?14:8,'all output and control pins are exposed');
   assert.equal(state.count,beforeMove.count,'dragging a stopped counter preserves count');
   const connected=await page.evaluate(name=>{
    const xml=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');
    const pos=xml.querySelector('Counter'+name).getAttribute('x').trim().split(/\s+/).map(Number);
    const ends=Array.from(xml.querySelectorAll('rw')).flatMap(w=>{
     const p=w.getAttribute('x').trim().split(/\s+/).map(Number);
     return [[p[0],p[1]],[p[2],p[3]]];
    });
    const west=name==='74191'?[0,1,2,3,4,5,6,7]:[0,2,4,5];
    const eastCount=name==='74191'?6:4,right=pos[0]+(name==='74191'?96:80);
    return [...west.map(i=>[pos[0],pos[1]+16*i]),
     ...Array.from({length:eastCount},(_,i)=>[right,pos[1]+16*i])]
     .map(([x,y])=>ends.filter(([ex,ey])=>ex===x&&ey===y).length);
   },name);
   assert.deepEqual(connected,name==='74191'?Array(14).fill(1):[1,1,1,1,2,1,1,1],
    'every pin retains its routed wires, including QA feedback');
   await advance(.5);
   assert.equal((await read()).count,(state.count+1)%16,'clock still counts after moving');
   const movedState=await read();await load(movedState.xml);
   assert.equal((await read()).count,movedState.count,'moved circuit retains count on import');
   await page.screenshot({path:`/tmp/counter-${name}-moved.png`});
  }
  // Manual clock for exact edge, control and restoration checks; fixture above uses the actual clock.
  await load(fixture.replace(/<R [^>]+\/>/,'<L x="336 '+(name==='7493'?192:256)+' 288 '+(name==='7493'?192:256)+'" f="2" p="0" key="k"/>'));
  if(name==='7493'){
   for(let n=1;n<=18;n++){await key('k');await key('k');const s=await read();assert.equal(s.count,n%16);for(let i=0;i<4;i++)assert.equal(s.volts[4+i]>2.5,!!(s.count&(1<<i)));assert.equal(s.displayValue,s.count,'four display inputs follow QA/QB/QC/QD');assert.equal(s.displayText,String(s.count),'decimal display renders the full 0–15 count');}
   await key('1');assert.equal((await read()).count,2);await key('2');assert.equal((await read()).count,0);await key('1');await key('2');
  }else{
   for(let n=1;n<=18;n++){await key('k');await key('k');assert.equal((await read()).count,n%16);}
   await key('d');await key('k');await key('k');assert.equal((await read()).count,1);
   await key('e');await key('k');await key('k');assert.equal((await read()).count,1,'EN stops');
   await key('1');await key('3');await key('l');assert.equal((await read()).count,5,'LD loads 0101 even while disabled');
   await key('l');await key('e');await key('k');await key('k');assert.equal((await read()).count,4,'down count resumes');
   const s=await read();for(let i=0;i<4;i++)assert.equal(s.volts[8+i]>2.5,!!(s.count&(1<<i)));
  }
  if(name==='7493')console.log('7493: original indicators retained; decimal display matches every count 0–15 through the four horizontal elbow branches');
  const saved=await read();await load(saved.xml);assert.equal((await read()).count,saved.count,'XML retains count without a false clock edge');
  console.log(`${name}: dragged package, retained connections, automatic clock, 0/1 controls, wraparound, output voltages and XML round trip passed`);
 }
 for(const lang of ['zz','es']){
  const fallback=await browser.newPage();
  await fallback.route('**/locale/locale_'+lang+'.txt',route=>route.fulfill({status:404,body:''}));
  await fallback.goto('http://127.0.0.1:8767/circuitjgr.html?lang='+lang);
  await fallback.waitForFunction(()=>!!window.CircuitJS1?.getElements);
  await fallback.waitForFunction(()=>/File\s+Edit\s+Draw/.test(document.body.innerText),null,{timeout:10000});
  await fallback.close();
 }
 assert.deepEqual(errors,[],'no browser runtime errors');
}finally{await browser.close();}
