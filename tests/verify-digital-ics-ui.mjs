import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {digitalICs,digitalICParts,DigitalICState,inputPins,outputPins} from '../scripts/LabDigitalIC.ts';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950},locale:'es-ES'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/circuitjgr.html');await page.locator('#lab-start-accept').click({timeout:30000});
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 await page.evaluate(()=>{window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit('<cir f="0" ts="0.00001"></cir>',false);});
 const canvas=page.locator('canvas').first(),box=await canvas.boundingBox();
 await canvas.click({button:'right',position:{x:box.width-40,y:box.height-40}});
 const groups=['Puertas lógicas','Biestables y latch','Registros de desplazamiento','Contadores','Codificadores y decodificadores','Multiplexores','Memoria y aritmética','Otros componentes digitales'];
 const menus=await page.evaluate(heads=>heads.map(head=>Array.from(document.querySelectorAll('li.hasSubmenu')).filter(li=>Array.from(li.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()===head).map(li=>Array.from(li.querySelector(':scope > ul').children).map(item=>item.textContent.trim()))),groups);
 for(let i=0;i<groups.length;i++)assert.equal(menus[i].length,2,'Draw and context submenu '+groups[i]);
 const numbered=menus.flatMap(copies=>copies[0]).map(x=>x.match(/^(\d+N?)\b/)?.[1]).filter(Boolean);
 assert.equal(new Set(numbered).size,45,'45 distinct numbered references including three legacy counters');assert.equal(numbered.length,45,'no duplicate numbered references');
 for(const part of digitalICParts)assert(numbered.includes(part),'menu contains '+part);
 assert(menus[3][0].some(x=>/^4026\s/.test(x)),'4026 number-first label');
 console.log('OK digital menus: eight submenus in Draw and context menu, 45 distinct references');
 await page.keyboard.press('Escape');
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
  if(d.msi){for(const p of inputPins(d))levels[p]=1;}
  const pos=p=>p<=d.pins/2?[480,160+16*p,-1]:[640,160+16*(d.pins-p+1),1];
  const nodes=[`<IC${d.part} x="480 160 624 160" f="1"/>`];
  const [vx,vy,vs]=pos(d.vcc),[gx,gy,gs]=pos(d.gnd);
  nodes.push(`<R x="${vx} ${vy} ${vx+32*vs} ${vy}" f="0" wf="0" maxv="5"/>`,`<g x="${gx} ${gy} ${gx+32*gs} ${gy}" f="0"/>`);
  for(const p of inputPins(d)){const [x,y,s]=pos(p);if(d.msi?.bidir?.includes(p)){nodes.push(`<r x="${x} ${y} ${x+48*s} ${y}" f="0" r="10000"/>`,`<L x="${x+48*s} ${y} ${x+80*s} ${y}" f="2" p="${levels[p]}" key="${String.fromCharCode(96+p)}"/>`);continue;}nodes.push(`<L x="${x} ${y} ${x+32*s} ${y}" f="2" p="${levels[p]}" key="${String.fromCharCode(96+p)}"/>`);}
  for(const p of outputPins(d)){if(d.msi?.bidir?.includes(p))continue;const [x,y,s]=pos(p),end=x+80*s;
   if(d.msi?.openCollector?.includes(p)){nodes.push(`<r x="${x} ${y} ${end} ${y}" f="0" r="10000"/>`,`<R x="${end} ${y} ${end+16*s} ${y}" f="0" wf="0" maxv="5"/>`);continue;}
   nodes.push(`<r x="${x} ${y} ${end} ${y}" f="0" r="10000"/>`,`<g x="${end} ${y} ${end+16*s} ${y}" f="0"/>`);
  }
  return '<cir f="0" ts="0.00001" ic="125" cb="50" pb="50" vr="5" mts="5e-11">'+nodes.join('')+'</cir>';
 };
 const level=async(p,expected,label)=>{const s=await read();assert(Number.isFinite(s.volts[p-1]),label+' finite');assert(expected?s.volts[p-1]>4.5:Math.abs(s.volts[p-1])<.1,label+' actual pin voltage '+s.volts[p-1]);};
 for(const part of digitalICParts){
  const d=digitalICs[part];await load(circuit(d));let s=await read();
  assert.equal(s.type,'IC'+part+'Elm');assert.equal(s.volts.length,d.pins);await level(d.vcc,true,part+' supply');
  if(d.msi){
   const inputs=inputPins(d),levels=Object.fromEntries(inputs.map(p=>[p,1])),model=new DigitalICState();
   const check=async(label)=>{
    const volts=Array(d.pins).fill(0);volts[d.vcc-1]=5;for(const p of inputs)volts[p-1]=levels[p]?5:0;
    const expected=model.step(d,volts),actual=await read();
    for(const p of outputPins(d)){
     const want=expected[p]===null?(d.msi.bidir?.includes(p)?!!levels[p]:d.msi.openCollector?.includes(p)||false):expected[p];
     assert(want?actual.volts[p-1]>4.5:Math.abs(actual.volts[p-1])<.12,part+' '+label+' pin '+p+' = '+actual.volts[p-1]);
    }
   };
   const set=async(p,value)=>{if(levels[p]!==value){levels[p]=value;await key(p);}await check('input '+p+' = '+value);};
   const pulse=async(p)=>{await set(p,0);await set(p,1);};
   await check('initial');
   // Exercise each physical input, then controls in valid operating sequences.
   // Avoid zero suppression feedback during generic decoder sweeps; test it separately.
   for(const p of inputs.filter(p=>part!=='7447'||p!==5)){await set(p,0);await set(p,1);}
   if(part==='74373'){await set(1,0);await set(11,1);await set(3,0);await set(11,0);await set(3,1);await set(1,1);await set(1,0);}
   if(part==='7475'){await set(13,0);await set(2,0);await set(13,1);await set(4,0);await set(6,0);}
   if(part==='74164'){await set(9,0);await set(9,1);for(let i=0;i<8;i++)await pulse(8);}
   if(part==='74165'){await set(1,0);await set(1,1);await set(15,0);for(let i=0;i<8;i++)await pulse(2);}
   if(part==='74194'){await set(1,0);await set(1,1);await pulse(11);await set(10,0);await pulse(11);await set(9,0);await set(10,1);await pulse(11);}
   if(part==='74190'||part==='74192'||part==='74168'){
    const sync=part==='74168',dual=part==='74192',load=sync?9:11,clock=sync?2:dual?5:14;
    if(dual)await set(14,0);await set(load,0);if(sync)await pulse(clock);await set(load,1);
    if(sync){await set(7,0);await set(10,0);}else if(!dual)await set(4,0);
    for(let i=0;i<12;i++)await pulse(clock);
   }
   if(part==='74189'){
    await set(2,0);await set(3,0);await set(4,0);await set(10,0);await set(3,1);await set(1,0);await set(3,0);await set(6,0);await set(3,1);await set(1,1);
   }
  }else if(d.gates.length){
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
 assert.deepEqual(errors,[],'no browser errors from digital IC packages');
 await page.screenshot({path:'/tmp/digital-ics.png'});
}finally{await browser.close();}
