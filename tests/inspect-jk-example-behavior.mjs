import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1550,height:920}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('labStartConfigured','1'));
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html?lang=es');
 await page.waitForFunction(()=>window.CircuitJS1?.getElements);
 for(const [file,relative,delay] of [
  ['jk-nor-original','../examples/circuit-jgr/8.7.2.5-biestable-jk-sincrono-nor.txt',0],
  ['jk-nand-original','../examples/circuit-jgr/8.7.2.5-biestable-jk-maestro-esclavo.txt',0],
  ['jk-nor-master-slave','./fixtures/jk-nor-master-slave-candidate.xml',0],
  ['jk-nor-master-slave-delay','./fixtures/jk-nor-master-slave-candidate.xml',0.0001],
  ['jk-nand-master-slave-delay','../examples/circuit-jgr/8.7.2.5-biestable-jk-maestro-esclavo.txt',0.0001]
 ]){
  const original=readFileSync(new URL(relative,import.meta.url),'utf8');
  const fixture=original.replace('ts="0.000005"','ts="0.00005"')
      .replace('fr="15"','fr="120"')
      .replace(/<(And|Nor|Nand) ([^>]*?)\/>/g,(match,gate,attrs)=>
        delay ? '<'+gate+' '+attrs.replace(/\s+pd="[^"]*"/g,'')+' pd="'+delay+'"/>' : match);
  const data=await page.evaluate(async xml=>{
   const api=window.CircuitJS1;api.setSimRunning(false);api.importCircuit(xml,false);
   const elms=Array.from(api.getElements());
   const jk=elms.find(e=>e.getType()==='JKFlipFlopElm');
   const clock=elms.find(e=>e.getType()==='RailElm');
   const gate=elms.filter(e=>e.getType()==='NorGateElm'||e.getType()==='NandGateElm').at(-2);
   if(!jk||!clock||!gate)throw Error('Faltan JK, reloj o puerta de salida');
   const samples=[],counts={native:0,gates:0,clkEdges:0};
   let previous=null;window.jgrJKDiagDone=false;
   api.ontimestep=()=>{
    const t=api.getTime();
    const sample={t,qJK:jk.getVoltage(3)>2.5,qGate:gate.getVoltage(gate.getPostCount()-1)>2.5,clk:clock.getVoltage(0)>2.5};
    if(previous){
     if(sample.qJK!==previous.qJK)counts.native++;
     if(sample.qGate!==previous.qGate)counts.gates++;
     if(sample.clk!==previous.clk)counts.clkEdges++;
    }
    if(samples.length<20||sample.qJK!==previous?.qJK||sample.qGate!==previous?.qGate)
     if(samples.length<120)samples.push(sample);
    previous=sample;
    if(t>=.04){api.setSimRunning(false);api.ontimestep=null;
     window.jgrJKDiagResult={counts,samples,atEnd:sample,gateName:gate.getType()};
     window.jgrJKDiagDone=true;}
   };
   api.setSimRunning(true);
   return {elmTypes:elms.map(e=>e.getType()).reduce((a,k)=>(a[k]=(a[k]||0)+1,a),{})};
  },fixture);
  await page.waitForFunction(()=>window.jgrJKDiagDone,null,{timeout:30000});
  const result=await page.evaluate(()=>window.jgrJKDiagResult);
  console.log('JK-EXAMPLE '+file+' '+JSON.stringify({delay,counts:result.counts,atEnd:result.atEnd,
   gateName:result.gateName,first:result.samples.slice(0,6),last:result.samples.slice(-6),
   elementCounts:data.elmTypes}));
 }
 assert.deepEqual(errors,[]);
}finally{await browser.close();}
