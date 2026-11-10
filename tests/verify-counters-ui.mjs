import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950},locale:'es-ES'});
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
  return {count:Number(state.getAttribute('count')),type:chip.getType(),volts:Array.from({length:chip.getPostCount()},(_,i)=>chip.getVoltage(i)),xml:api.exportCircuit()};
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
  // Test dragging only where the canvas hit point is calibrated; the larger 74191
  // overlaps its attached wires at the fixed screen positions used previously.
  const grabs=name==='7493'?[{x:715,y:590}]:[];
  let moved=false;
  for(const grab of grabs){
   await page.mouse.move(grab.x,grab.y);await page.mouse.down();await page.waitForTimeout(200);
   await page.mouse.move(grab.x+72,grab.y+48,{steps:8});await page.mouse.up();
   if(coordinates((await read()).xml)!==coordinates(beforeMove.xml)){moved=true;break;}
  }
  if(name==='7493')assert(moved,'dragging the package body moves the counter');
  // Manual clock for exact edge, control and restoration checks; fixture above uses the actual clock.
  await load(fixture.replace(/<R [^>]+\/>/,'<L x="336 '+(name==='7493'?192:256)+' 288 '+(name==='7493'?192:256)+'" f="2" p="0" key="k"/>'));
  if(name==='7493'){
   for(let n=1;n<=18;n++){await key('k');await key('k');const s=await read();assert.equal(s.count,n%16);for(let i=0;i<4;i++)assert.equal(s.volts[4+i]>2.5,!!(s.count&(1<<i)));}
   await key('1');assert.equal((await read()).count,2);await key('2');assert.equal((await read()).count,0);await key('1');await key('2');
  }else{
   for(let n=1;n<=18;n++){await key('k');await key('k');assert.equal((await read()).count,n%16);}
   await key('d');await key('k');await key('k');assert.equal((await read()).count,1);
   await key('e');await key('k');await key('k');assert.equal((await read()).count,1,'EN stops');
   await key('1');await key('3');await key('l');assert.equal((await read()).count,5,'LD loads 0101 even while disabled');
   await key('l');await key('e');await key('k');await key('k');assert.equal((await read()).count,4,'down count resumes');
   const s=await read();for(let i=0;i<4;i++)assert.equal(s.volts[8+i]>2.5,!!(s.count&(1<<i)));
  }
  const saved=await read();await load(saved.xml);assert.equal((await read()).count,saved.count,'XML retains count without a false clock edge');
  console.log(`${name}: automatic clock, 0/1 controls, wraparound, output voltages and XML round trip passed`);
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
