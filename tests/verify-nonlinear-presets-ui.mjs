import assert from "node:assert/strict";
import {chromium} from "playwright";

// Prueba funcional sobre la API pública de CircuitJS. Los componentes internos
// NO se exponen en getElements(): únicamente sus funciones de medida.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1280,height:850}});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto("http://127.0.0.1:8767/circuitjgr-core.html",{waitUntil:"domcontentloaded"});
 await page.locator("#lab-start-modal").waitFor({state:"visible",timeout:30000});
 await page.locator("#lab-start-accept").click();
 await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.03,null,{timeout:90000});
 const header='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="20" mts="5e-11">'+
  '<v x="80 304 80 448" f="0" wf="1" fr="50" maxv="325.2691193458119"/>'+
  '<g x="80 448 80 480" f="0"/>'+
  '<w x="80 304 256 304" f="0"/>';
 const footer='<w x="352 304 352 448" f="0"/>'+
  '<w x="352 448 80 448" f="0"/></cir>';
 const cases=[
  {name:"Puente antiguo",r:200,c:0.002,rs:0,profile:0},
  {name:"LED sin PFC",r:6800,c:0.000010,rs:10,profile:1},
  {name:"Fuente de ordenador sin PFC",r:470,c:0.000470,rs:2.2,profile:2},
  {name:"Puente personalizado",r:550,c:0.000470,rs:2.2,profile:0}
 ];
 for(const item of cases){
  const attributes='r="'+item.r+'" c="'+item.c+'"'+
   (item.rs>0?' rs="'+item.rs+'"':'')+
   (item.profile>0?' profile="'+item.profile+'"':'');
  const xml=header+'<FilteredBridge x="256 304 352 304" f="0" '+
   attributes+'/>'+footer;
  await page.evaluate(text=>window.CircuitJS1.importCircuit(text,false),xml);
  await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.10,null,{timeout:90000});
  const data=await page.evaluate(()=>{
   const sim=window.CircuitJS1;
   const proxy=sim.getElements().find(e=>e.getType()==="FilteredBridgeElm");
   const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
    .querySelector("FilteredBridge");
   return {count:sim.getElements().filter(e=>e.getType()==="FilteredBridgeElm").length,
    posts:proxy?.getPostCount(),current:proxy?.getCurrent(),info:proxy?.getInfo(),
    r:Number(tag?.getAttribute("r")),c:Number(tag?.getAttribute("c")),
    rs:tag?.getAttribute("rs"),profile:tag?.getAttribute("profile"),units:tag?.getAttribute("units")};
  });
  assert.equal(data.count,1,item.name+": falta elemento filtrado");
  assert.equal(data.posts,2,item.name+": número de bornes incorrecto");
  assert(Number.isFinite(data.current),item.name+": intensidad no finita");
  assert.equal(data.r,item.r);
  assert.equal(data.c,item.c);
  assert.equal(data.rs,item.rs>0?String(item.rs):null);
  assert.equal(data.profile,item.profile>0?String(item.profile):null);
  assert.equal(data.units,null,item.name+": los XML heredados deben equivaler a N=1");
  assert(data.info?.some(s=>String(s).startsWith("Rs = ")),
   item.name+": no se muestra la resistencia serie");
  const expectedText=item.profile===1?"Ejemplo LED sin PFC":
    item.profile===2?"Ejemplo fuente de ordenador sin PFC":
    "Puente rectificador configurable";
  assert(data.info.some(s=>String(s).includes(expectedText)),
   item.name+": el perfil no está identificado");

  // Tras importar de nuevo su propio XML no se pierden conexiones ni parámetros.
  const imported=await page.evaluate(()=>{
   const sim=window.CircuitJS1;
   const dump=sim.exportCircuit();
   sim.importCircuit(dump,false);
   const elm=sim.getElements().find(e=>e.getType()==="FilteredBridgeElm");
   const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
    .querySelector("FilteredBridge");
   return {ports:elm?.getPostCount(),r:Number(tag?.getAttribute("r")),
    c:Number(tag?.getAttribute("c")),rs:tag?.getAttribute("rs"),
    profile:tag?.getAttribute("profile")};
  });
  assert.deepEqual(imported,{ports:2,r:item.r,c:item.c,
   rs:item.rs>0?String(item.rs):null,
   profile:item.profile>0?String(item.profile):null},
   item.name+": pérdida de datos al reimportar XML");

  // Capturar la corriente real calculada por el solver, mediante la API pública
  // y un periodo de CA, no mediante las propiedades internas del componente.
  const wave=await page.evaluate(async()=>{
   const sim=window.CircuitJS1;
   let count=0,peak=0,powerSum=0,finite=true;
   // Guardar el proxy una sola vez. Reconstruirlo en cada paso del solver
   // degrada el rendimiento y retrasa la simulación innecesariamente.
   const elem=sim.getElements().find(e=>e.getType()==="FilteredBridgeElm");
   const t0=sim.getTime();
   const old=sim.ontimestep;
   sim.ontimestep=()=>{
    old?.();
    const i=elem?.getCurrent(),u=elem?.getVoltageDiff();
    if(!Number.isFinite(i)||!Number.isFinite(u)){finite=false;return;}
    count++;
    peak=Math.max(peak,Math.abs(i));
    powerSum+=u*i;
   };
   try{
    for(let tries=0;tries<150;tries++){
     await new Promise(resolve=>setTimeout(resolve,12));
     if(sim.getTime()-t0>0.05)break;
    }
   }finally{sim.ontimestep=old;}
   return {elapsed:sim.getTime()-t0,count,peak,powerSum,finite};
  });
  console.log("Diagnóstico del solver",item.name,wave);
  assert(wave.elapsed>0.02&&wave.count>30,
   item.name+": muestreo insuficiente: "+JSON.stringify(wave));
  assert(wave.finite&&Number.isFinite(wave.peak)&&wave.peak>1e-7,
   item.name+": no se observa corriente de CA finita en el solver");
  console.log("OK:",item.name,"corriente de entrada y XML",{peak:wave.peak,steps:wave.count});
 }
 assert.deepEqual(errors,[],"Errores JavaScript durante pruebas: "+errors.join("; "));
 console.log("OK: puente original, LED, PSU y configuración personalizada en Circuit JGR");
}finally{
 await browser.close();
}
