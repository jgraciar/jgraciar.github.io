import assert from "node:assert/strict";
import {chromium} from "playwright";

// Esta prueba abre el motor real, no un modelo matemático independiente.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1280,height:850}});
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 await page.goto("http://127.0.0.1:8767/circuitjgr.html",{waitUntil:"domcontentloaded"});
 await page.locator("#lab-start-modal").waitFor({state:"visible",timeout:30000});
 await page.locator("#lab-start-accept").click();
 await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.03,null,{timeout:90000});
 const legacy='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="20" mts="5e-11">'+
  '<v x="80 304 80 448" f="0" wf="1" fr="50" maxv="325.2691193458119"/>'+
  '<g x="80 448 80 480" f="0"/>'+
  '<w x="80 304 256 304" f="0"/>'+
  '<FilteredBridge x="256 304 352 304" f="0" r="200" c="0.002"/>'+
  '<w x="352 304 352 448" f="0"/>'+
  '<w x="352 448 80 448" f="0"/></cir>';
 await page.evaluate(xml=>window.CircuitJS1.importCircuit(xml,false),legacy);
 await page.waitForFunction(()=>window.CircuitJS1.getTime()>0.03,null,{timeout:90000});
 let data=await page.evaluate(()=>{
  const sim=window.CircuitJS1;
  const el=Array.from(sim.getElements()).find(e=>e.getType()==="FilteredBridgeElm");
  const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
   .querySelector("FilteredBridge");
  return {components:el.compElmList.length,rs:el.seriesResistance,profile:el.profile,
   xmlRs:tag?.getAttribute("rs"),xmlProfile:tag?.getAttribute("profile")};
 });
 assert.deepEqual(data,{components:6,rs:0,profile:0,xmlRs:null,xmlProfile:null},
  "El XML antiguo debe mantener el puente físico original, sin Rs");
 console.log("OK: puente rectificador anterior compatible y sin cambios topológicos");

 for(const [profile,r,c,rs,label] of [
  [1,6800,0.000010,10,"LED sin PFC"],
  [2,470,0.000470,2.2,"Fuente de ordenador sin PFC"]
 ]){
  const chosen=await page.evaluate(profile=>{
   const sim=window.CircuitJS1;
   const element=Array.from(sim.getElements()).find(e=>e.getType()==="FilteredBridgeElm");
   const selector=element.getEditInfo(0);
   selector.choice.select(profile);
   element.setEditValue(0,selector);
   const refreshed=element.getEditInfo(0); // recrear diálogo y valores
   const values=[1,2,3].map(i=>element.getEditInfo(i).value);
   const xml=sim.exportCircuit();
   sim.importCircuit(xml,false);
   const tag=new DOMParser().parseFromString(xml,"application/xml")
    .querySelector("FilteredBridge");
   return {selector:refreshed.choice.getSelectedIndex(),
    profile:element.profile,values,tag:Object.fromEntries([...tag.attributes]
     .map(a=>[a.name,a.value])),xml};
  },profile);
  assert.equal(chosen.selector,profile,label+": no queda seleccionado el perfil");
  assert.equal(chosen.profile,profile,label+": perfil cambiado inadvertidamente");
  for(const [i,v] of [r,c,rs].entries())
   assert(Math.abs(chosen.values[i]-v)<1e-12,label+": parámetro erróneo "+i);
  assert.equal(Number(chosen.tag.profile),profile);
  assert.equal(Number(chosen.tag.rs),rs);
  await page.waitForFunction(()=>window.CircuitJS1.getTime()>0.12,null,{timeout:90000});
  const measure=await page.evaluate(async()=>{
   const sim=window.CircuitJS1;
   const element=Array.from(sim.getElements()).find(e=>e.getType()==="FilteredBridgeElm");
   let observed=0,peak=0,energy=0;
   const t0=sim.getTime();
   const old=sim.ontimestep;
   sim.ontimestep=()=>{
    old?.();
    const i=element.getCurrent();
    const v=element.getVoltageDiff();
    if(Number.isFinite(i)&&Number.isFinite(v)){
     observed++;
     peak=Math.max(peak,Math.abs(i));
     energy+=Math.max(0,v*i);
    }
   };
   try{
    for(let attempt=0;attempt<160;attempt++){
     await new Promise(resolve=>setTimeout(resolve,15));
     if(sim.getTime()-t0>=0.08)break;
    }
   }finally{sim.ontimestep=old;}
   const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
    .querySelector("FilteredBridge");
   return {elapsed:sim.getTime()-t0,observed,peak,energy,
    components:element.compElmList.length,profile:element.profile,
    rs:Number(tag?.getAttribute("rs")),r:Number(tag?.getAttribute("r")),
    c:Number(tag?.getAttribute("c"))};
  });
  assert(measure.elapsed>0.06&&measure.observed>50,label+": muestreo insuficiente");
  assert(Number.isFinite(measure.peak)&&measure.peak>1e-7,
   label+": entrada sin corriente real");
  assert.equal(measure.components,7,label+": no existe resistencia serie en el solver");
  assert.equal(measure.profile,profile);
  assert.equal(measure.rs,rs);
  assert.equal(measure.r,r);
  assert.equal(measure.c,c);
  console.log("OK:",label,"potencia de entrada modelada, corriente finita y perfil conservado",
   {peak:measure.peak,samples:measure.observed});

  const roundtrip=await page.evaluate(()=>{
   const sim=window.CircuitJS1;
   const xml=sim.exportCircuit();
   sim.importCircuit(xml,false);
   const element=Array.from(sim.getElements()).find(e=>e.getType()==="FilteredBridgeElm");
   return {profile:element?.profile,rs:element?.seriesResistance,
    components:element?.compElmList?.length};
  });
  assert.deepEqual(roundtrip,{profile,rs,components:7},label+": pérdida en XML");
 }
 // Editar manualmente la resistencia anula el nombre de perfil, sin perder Rs.
 const custom=await page.evaluate(()=>{
  const sim=window.CircuitJS1;
  const element=Array.from(sim.getElements()).find(e=>e.getType()==="FilteredBridgeElm");
  element.getEditInfo(0); // limpiar cambio de selector
  element.setEditValue(1,{value:550});
  const xml=sim.exportCircuit();
  const tag=new DOMParser().parseFromString(xml,"application/xml")
   .querySelector("FilteredBridge");
  return {profile:element.profile,seriesResistance:element.seriesResistance,
   r:Number(tag?.getAttribute("r")),xmlProfile:tag?.getAttribute("profile")};
 });
 assert.deepEqual(custom,{profile:0,seriesResistance:2.2,r:550,xmlProfile:null},
  "Una modificación manual no debe seguir identificándose como PSU de referencia");
 assert.deepEqual(errors,[],"Errores JavaScript de los perfiles: "+errors.join("; "));
 console.log("OK: edición manual, XML y tres modelos en el solver de Circuit JGR");
}finally{
 await browser.close();
}
