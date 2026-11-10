import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {digitalICs,digitalICParts,inputPins,outputPins} from '../scripts/LabDigitalIC.ts';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950},locale:'es-ES'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/circuitjgr.html');await page.locator('#lab-start-accept').click({timeout:30000});
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 const advance=async()=>{
  await page.evaluate(()=>{const api=window.CircuitJS1,target=api.getTime()+.001;window.icReady=false;
   api.ontimestep=()=>{if(api.getTime()>=target){api.setSimRunning(false);api.ontimestep=null;window.icReady=true;}};api.setSimRunning(true);});
  await page.waitForFunction(()=>window.icReady,null,{timeout:15000});
 };
 const key=async p=>{await page.keyboard.press(String.fromCharCode(96+p));await advance();};
 const load=async xml=>{await page.evaluate(xml=>{window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit(xml,false);},xml);await advance();};
 const read=()=>page.evaluate(()=>{
  const api=window.CircuitJS1,chip=Array.from(api.getElements()).find(e=>/^IC\d/.test(e.getType()));
  return {type:chip?.getType(),volts:chip?Array.from({length:chip.getPostCount()},(_,i)=>chip.getVoltage(i)):[],xml:api.exportCircuit()};
 });
 const circuit=(d,pattern=0)=>{
  const levels=Object.fromEntries(inputPins(d).map(p=>[p,0]));
  for(const g of d.gates)g.inputs.forEach((p,i)=>levels[p]=(pattern>>i)&1);
  for(const f of d.jk||[])levels[f.set]=levels[f.reset]=d.family==='TTL'?1:0;
  for(const f of d.rs||[])levels[f.set]=levels[f.reset]=d.mode==='rs-nand'?1:0;
  if(d.enable)levels[d.enable]=1;
  const pos=p=>p<=d.pins/2?[480,160+16*p,-1]:[640,160+16*(d.pins-p+1),1];
  const nodes=[`<IC${d.part} x="480 160 624 160" f="1"/>`];
  const [vx,vy,vs]=pos(d.vcc),[gx,gy,gs]=pos(d.gnd);
  nodes.push(`<R x="${vx} ${vy} ${vx+32*vs} ${vy}" f="0" wf="0" maxv="5"/>`,`<g x="${gx} ${gy} ${gx+32*gs} ${gy}" f="0"/>`);
  for(const p of inputPins(d)){const [x,y,s]=pos(p);nodes.push(`<L x="${x} ${y} ${x+32*s} ${y}" f="2" p="${levels[p]}" key="${String.fromCharCode(96+p)}"/>`);}
  for(const p of outputPins(d)){const [x,y,s]=pos(p),end=x+80*s;
   nodes.push(`<r x="${x} ${y} ${end} ${y}" f="0" r="10000"/>`,`<g x="${end} ${y} ${end+16*s} ${y}" f="0"/>`);
  }
  return '<cir f="0" ts="0.00001" ic="125" cb="50" pb="50" vr="5" mts="5e-11">'+nodes.join('')+'</cir>';
 };
 const level=async(p,expected,label)=>{const s=await read();assert(Number.isFinite(s.volts[p-1]),label+' finite');assert(expected?s.volts[p-1]>4.5:Math.abs(s.volts[p-1])<.1,label+' actual pin voltage '+s.volts[p-1]);};
 for(const part of digitalICParts){
  const d=digitalICs[part];await load(circuit(d));let s=await read();
  assert.equal(s.type,'IC'+part+'Elm');assert.equal(s.volts.length,d.pins);await level(d.vcc,true,part+' supply');
  if(d.gates.length){
   const n=d.gates[0].inputs.length,kind=d.gates[0].kind;
   for(const bits of [...new Set([0,(1<<n)-1,1,((1<<n)-1)^1])]){
    await load(circuit(d,bits));const ones=bits.toString(2).replaceAll('0','').length;
    const expected={AND:ones===n,NAND:ones!==n,OR:ones>0,NOR:ones===0,XOR:ones%2===1,NOT:ones===0,SCHMITT:ones===0}[kind];
    for(const g of d.gates)await level(g.output,expected,part+' '+kind+' pattern '+bits);
   }
  }else if(d.jk){
   const f=d.jk[0],other=d.jk[1];await level(f.q,false,part+' initial Q');await level(f.nq,true,part+' initial /Q');
   await key(f.j);await key(f.k);await key(f.clock);await level(f.q,d.mode==='rising',part+' rising');
   await key(f.clock);await level(f.q,true,part+' falling');await level(other.q,false,part+' independent second channel');
   await key(f.clock);await key(f.clock);await level(f.q,false,part+' toggle');
   await key(other.set);await level(other.q,true,part+' asynchronous set');await key(other.set);
   await key(other.reset);await level(other.q,false,part+' asynchronous reset');await key(other.reset);
  }else{
   const f=d.rs[0];await key(f.set);await level(f.q,true,part+' RS set');await key(f.set);await level(f.q,true,part+' RS hold');
   await key(d.enable);await level(f.q,false,part+' high-Z output pulled down by external 10 kohm');
   await key(f.reset);await key(f.reset);await key(d.enable);await level(f.q,false,part+' reset while disabled');
  }
  const before=await read();await load(before.xml);s=await read();
  for(const p of outputPins(d))assert(Math.abs(s.volts[p-1]-before.volts[p-1])<.1,part+' XML restores pin '+p);
  console.log('OK '+part+': full powered DIP, loaded outputs, logic and XML round trip');
 }
 assert.deepEqual(errors,[],'no browser errors from new IC packages');
 await page.screenshot({path:'/tmp/digital-ics.png'});
}finally{await browser.close();}
