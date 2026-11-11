import assert from "node:assert/strict";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1280,height:800}});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto("http://127.0.0.1:8767/circuitjgr-core.html",{waitUntil:"domcontentloaded"});
 await page.locator("#lab-start-modal").waitFor({state:"visible",timeout:30000});
 await page.locator("#lab-start-accept").click();
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements&&
   window.CircuitJS1?.getTime?.()>0.02,null,{timeout:90000});
 const start=await page.evaluate(()=>{
   const sim=window.CircuitJS1;
   const elms=Array.from(sim.getElements());
   const meters=elms.filter(e=>e.getType()==="WattmeterTrueElm");
   return {types:elms.map(e=>e.getType()),meters:meters.length,
     readings:meters.map(e=>e.getInfo()),time:sim.getTime()};
 });
 assert.equal(start.meters,2,"El circuito didáctico de inicio debe conservar los dos vatímetros de Aron");
 assert(start.readings.every(x=>x.length>3),"Los vatímetros deben ofrecer lecturas");
 console.log("OK: dos vatímetros de Aron y simulación en marcha");

 const head='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="20" mts="5e-11">';
 const source='<v x="80 304 80 448" f="0" wf="1" fr="50" maxv="14.142135623730951"/>'+
   '<g x="80 448 80 480" f="0"/>';
 const tail='</cir>';
 const bridge=head+source+
  '<w x="80 304 256 304" f="0"/>'+
  '<FilteredBridge x="256 304 352 304" f="0" r="200" c="0.002"/>'+
  '<w x="352 304 352 448" f="0"/>'+
  '<w x="352 448 80 448" f="0"/>'+tail;
 const z=head+source+
  '<w x="80 304 256 304" f="0"/>'+
  '<Impedance x="256 304 352 304" f="0" mode="1" displayMode="1" f0="50" r="8" l="0.0159154943091895" c="0"/>'+
  '<w x="352 304 352 448" f="0"/>'+
  '<w x="352 448 80 448" f="0"/>'+tail;
 const pv=head+source+
  '<w x="80 304 288 304" f="0"/>'+
  '<r x="288 304 288 448" f="0" r="100"/>'+
  '<w x="288 448 80 448" f="0"/>'+
  '<PVInverter x="400 448 400 304" f="0" pvP="0.5" pvQ="0" pvV="10" pvF="50" pvPhase="0"/>'+
  '<w x="400 304 288 304" f="0"/>'+
  '<w x="400 448 288 448" f="0"/>'+tail;

 for(const [label,xml,kind,tagName,checks] of [
  ["Impedancia Z",z,"ImpedanceElm","Impedance",{r:"8",f0:"50",mode:"1"}],
  ["Inversor fotovoltaico",pv,"PVInverterElm","PVInverter",{pvP:"0.5",pvQ:"0"}],
  ["Rectificador filtrado",bridge,"FilteredBridgeElm","FilteredBridge",{r:"200",c:"0.002"}]
 ]){
  await page.evaluate(text=>{
    const sim=window.CircuitJS1;
    sim.importCircuit(text,false);
  },xml);
  await page.waitForFunction(expected=>{
    const sim=window.CircuitJS1;
    return sim?.getTime?.()>0.03&&
      Array.from(sim.getElements()).some(e=>e.getType()===expected);
  },kind,{timeout:60000});
  const data=await page.evaluate(({kind,tagName})=>{
    const sim=window.CircuitJS1;
    const elm=Array.from(sim.getElements()).find(e=>e.getType()===kind);
    const xml=sim.exportCircuit();
    const tag=new DOMParser().parseFromString(xml,"application/xml").querySelector(tagName);
    return {count:Array.from(sim.getElements()).filter(e=>e.getType()===kind).length,
      posts:elm?.getPostCount(),current:elm?.getCurrent(),voltage:elm?.getVoltageDiff(),
      info:elm?.getInfo(),attributes:tag?Object.fromEntries([...tag.attributes]
       .map(a=>[a.name,a.value])):null,simTime:sim.getTime(),xml};
  },{kind,tagName});
  assert.equal(data.count,1,label+": elemento no reconocido o duplicado");
  assert.equal(data.posts,2,label+": número de bornes incorrecto");
  assert(Number.isFinite(data.current)&&Number.isFinite(data.voltage),
    label+": tensión o corriente no finita");
  assert(data.info?.length>0,label+": información del elemento ausente");
  for(const [key,value] of Object.entries(checks))
    assert.equal(data.attributes?.[key],value,label+": atributo XML "+key+" no se conserva");
  const after=await page.evaluate(({xml,kind,tagName})=>{
    const sim=window.CircuitJS1;
    sim.importCircuit(xml,false);
    const elms=Array.from(sim.getElements()).filter(e=>e.getType()===kind);
    const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml").querySelector(tagName);
    return {count:elms.length,posts:elms[0]?.getPostCount(),
      attributes:tag?Object.fromEntries([...tag.attributes]
       .map(a=>[a.name,a.value])):null};
  },{xml:data.xml,kind,tagName});
  assert.equal(after.count,1,label+": importación/exportación pierde el elemento");
  assert.equal(after.posts,2,label+": importación altera los bornes");
  for(const [key,value] of Object.entries(checks))
    assert.equal(after.attributes?.[key],value,label+": atributo modificado tras reimportar: "+key);
  console.log("OK:",label,"modelo eléctrico, magnitudes finitas y persistencia XML");
 }
 assert.deepEqual(errors,[],"Errores JavaScript del simulador");
}finally{
 await browser.close();
}
