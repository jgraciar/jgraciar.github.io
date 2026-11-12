import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const circuit=readFileSync(new URL('../examples/circuit-jgr/8.7.2.5-biestable-jk-maestro-esclavo.txt',import.meta.url),'utf8');
const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1440,height:900}});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.addInitScript(()=>localStorage.setItem('labStartConfigured','1'));
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html?lang=es');
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 for (const j of [0,1]) for (const k of [0,1]) {
  let xml=circuit.replace('ts="0.000005"','ts="0.00005"').replace('fr="15"','fr="120"');
  xml=xml.replace('<L x="96 176 64 176" f="2" p="1"/>',
    '<L x="96 176 64 176" f="2" p="'+j+'"/>');
  xml=xml.replace('<L x="224 368 64 368" f="2" p="1"/>',
    '<L x="224 368 64 368" f="2" p="'+k+'"/>');
  assert.equal((xml.match(/<Nand /g)||[]).length,8);
  assert.equal((xml.match(/<Nand [^>]*pd="0.0001"/g)||[]).length,8,
   'Las ocho NAND deben tener retardo de propagación de 100 µs');
  await page.evaluate(xml=>{
   const api=window.CircuitJS1;
   api.setSimRunning(false);
   api.importCircuit(xml,false);
   const els=Array.from(api.getElements());
   const jk=els.find(e=>e.getType()==='JKFlipFlopElm');
   const clk=els.find(e=>e.getType()==='RailElm');
   const nand=els.filter(e=>e.getType()==='NandGateElm');
   if(!jk||!clk||nand.length!==8)throw Error('El circuito carece del JK de referencia o de las ocho NAND');
   let lastClock=null,fall=null,recorded=false;
   const checks=[];
   window.jgrJKComparisonDone=false;
   window.jgrJKComparison=null;
   api.ontimestep=()=>{
    const t=api.getTime();
    const signal=clk.getVoltage(0)>2.5;
    if(lastClock===true&&!signal){fall=t;recorded=false;}
    lastClock=signal;
    if(fall!=null&&!recorded&&t>=fall+0.001){
     const top=nand[6],bottom=nand[7];
     const measurement={t,qJK:jk.getVoltage(3)>2.5,qbarJK:jk.getVoltage(4)>2.5,
      qGate:top.getVoltage(top.getPostCount()-1)>2.5,
      qbarGate:bottom.getVoltage(bottom.getPostCount()-1)>2.5};
     checks.push(measurement);
     recorded=true;
    }
    if(t>=0.035){
     api.setSimRunning(false);api.ontimestep=null;
     window.jgrJKComparison=checks;window.jgrJKComparisonDone=true;
    }
   };
   api.setSimRunning(true);
  },xml);
  await page.waitForFunction(()=>window.jgrJKComparisonDone,null,{timeout:30000});
  const results=await page.evaluate(()=>window.jgrJKComparison);
  assert(results.length>=3,'J='+j+' K='+k+': faltan flancos verificados');
  for(const data of results){
   assert.equal(data.qGate,data.qJK,'J='+j+' K='+k+' t='+data.t+': salida Q del montaje invertida');
   assert.equal(data.qbarGate,data.qbarJK,'J='+j+' K='+k+' t='+data.t+': salida Qbar del montaje invertida');
   assert.equal(data.qGate,!data.qbarGate,'J='+j+' K='+k+' t='+data.t+': salidas no complementarias');
  }
  console.log('PASS JK master-slave J='+j+' K='+k+' '+results.length+' flancos coinciden con JK integrado');
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
