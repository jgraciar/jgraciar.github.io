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
   if((text==='74191'||text==='7493')&&y<1000){
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
  const elements=Array.from(api.getElements());
  const display=elements.find(e=>e.getType()==='DecimalDisplayElm');
  const allJK=elements.filter(e=>e.getType()==='JKFlipFlopElm'); const jk=allJK.slice(0,4);
  const jkCount=jk.reduce((n,e,i)=>n|(e.getVoltage(3)>2.5?1<<i:0),0);
  const segments=elements.filter(e=>e.getType()==='SevenSegElm').map(e=>Array.from({length:7},(_,i)=>e.getVoltage(i)>2.5?1<<i:0).reduce((a,b)=>a|b,0));
  const displayValue=display?Array.from({length:4},(_,i)=>display.getVoltage(i)>2.5?1<<i:0).reduce((a,b)=>a+b,0):null;
  return {count:Number(state.getAttribute('count')),type:chip.getType(),volts:Array.from({length:chip.getPostCount()},(_,i)=>chip.getVoltage(i)),xml:api.exportCircuit(),displayValue,jkCount,segments:segments.slice(0,2),splitSegments:segments.slice(2),splitCounts:Array.from(xml.querySelectorAll('Counter7493')).slice(1).map((e,i)=>Number(e.getAttribute('count'))>>(i===0?0:1)),splitT:elements.filter(e=>e.getType()==='TFlipFlopElm').map(e=>e.getVoltage(1)>2.5?1:0),displayText:window.counterDecimalText};
 });
 const load=async xml=>{await page.evaluate(xml=>{window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit(xml,false);window.CircuitJS1.setSimRunning(false);},xml);await advance(.005);};
 const key=async k=>{await page.keyboard.press(k);await advance(.001);};
 for(const name of ['7493','74191']){
  const fixture=readFileSync(new URL(`./fixtures/${name}-practice.xml`,import.meta.url),'utf8');
  assert.equal((fixture.match(/<g\s/g)||[]).length,name==='7493'?1:0,'one necessary common return for physical switches');
  assert.equal((fixture.match(/<M\s/g)||[]).length,name==='74191'?6:16,'all counter outputs have visible logic indicators');
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
   for(let n=1;n<=18;n++){await key('k');await key('k');const s=await read();assert.equal(s.count,n%16);for(let i=0;i<4;i++)assert.equal(s.volts[4+i]>2.5,!!(s.count&(1<<i)));assert.equal(s.displayValue,s.count,'four display inputs follow QA/QB/QC/QD');assert.equal(s.jkCount,s.count,'JK chain and 7493 count together');assert.deepEqual(s.segments,Array(2).fill([63,6,91,79,102,109,125,7,127,111,119,124,57,94,121,113][s.count]),'both seven-segment displays decode the same state');assert.equal(s.displayText,String(s.count),'decimal display renders the full 0–15 count');}
   await key('e');await key('k');await key('k');assert.equal((await read()).jkCount,2,'J=K switch holds JK chain');await key('e');await key('r');assert.equal((await read()).count,0);assert.equal((await read()).jkCount,0,'common reset clears both counters');await key('r');
  }else{
   for(let n=1;n<=18;n++){await key('k');await key('k');assert.equal((await read()).count,n%16);}
   await key('d');await key('k');await key('k');assert.equal((await read()).count,1);
   await key('e');await key('k');await key('k');assert.equal((await read()).count,1,'EN stops');
   await key('1');await key('3');await key('l');assert.equal((await read()).count,5,'LD loads 0101 even while disabled');
   await key('l');await key('e');await key('k');await key('k');assert.equal((await read()).count,4,'down count resumes');
   const s=await read();for(let i=0;i<4;i++)assert.equal(s.volts[8+i]>2.5,!!(s.count&(1<<i)));
  }
  if(name==='7493'){
   let clockIndex=0;
   const manual=fixture.replace(/<R [^>]+wf="2"[^>]*\/>/g,tag=>{
    const x=tag.match(/x="([^"]+)"/)[1];return `<L x="${x}" f="2" p="0" key="${clockIndex++===0?'k':'h'}"/>`;
   });
   assert.equal(clockIndex,2,'two independent clocks'); await load(manual);await key('a');await key('b');
   const masks=[63,6,91,79,102,109,125,7,127,111,119,124,57,94,121,113];
   const check=async(a,b)=>{const s=await read();assert.deepEqual(s.splitCounts,[a,b],'independent IC counts');assert.deepEqual(s.splitT,[a,b&1,(b>>1)&1,(b>>2)&1],'T counters match each section');assert.deepEqual(s.splitSegments,[masks[a],masks[b],masks[a],masks[b]],'separate displays');};
   await check(0,0);
   for(let n=1;n<=9;n++){await key('h');await key('h');await check(n%2,0);}
   for(let n=1;n<=9;n++){await key('k');await key('k');await check(1,n%8);}
   const topBefore=(await read()).count;
   await key('a');await check(0,1);assert.equal((await read()).count,topBefore,'Q1 reset does not affect upper counter');await key('a');
   await key('h');await key('h');await check(1,1);
   await key('b');await check(1,0);assert.equal((await read()).count,topBefore,'three-bit reset does not affect upper counter');await key('b');
   await key('k');await key('k');await check(1,1);
   await key('r');await check(1,1);assert.equal((await read()).count,0,'upper reset remains separate');await key('r');
   console.log('Independent modulo-2 and modulo-8 counters: T equivalence, clocks, displays and isolated resets passed');
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
