import assert from "node:assert/strict";
import {chromium} from "playwright";

// Verifica N cargas no lineales idénticas en paralelo usando el SOLVER real.
// El multiplicador es un equivalente compacto: la característica de los
// diodos se representa por un único puente, por lo que N·I es aproximado.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1280,height:850}});
 const errors=[];
 page.on("pageerror",err=>errors.push(err.message));
 await page.goto("http://127.0.0.1:8767/circuitjgr.html",{waitUntil:"domcontentloaded"});
 await page.locator("#lab-start-modal").waitFor({state:"visible",timeout:30000});
 await page.locator("#lab-start-accept").click();
 await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.03,null,{timeout:90000});

 const header='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="20" mts="5e-11">'+
  '<v x="80 304 80 448" f="0" wf="1" fr="50" maxv="325.2691193458119"/>'+
  '<g x="80 448 80 480" f="0"/>'+
  '<w x="80 304 256 304" f="0"/>';
 const footer='<w x="352 304 352 448" f="0"/>'+
  '<w x="352 448 80 448" f="0"/></cir>';

 async function measure(load,units){
  const attrs='r="'+load.r+'" c="'+load.c+'" rs="'+load.rs+'" profile="'+load.profile+'"'+
   (units===1?'':' units="'+units+'"');
  const xml=header+'<FilteredBridge x="256 304 352 304" f="0" '+attrs+'/>'+footer;
  await page.evaluate(text=>window.CircuitJS1.importCircuit(text,false),xml);
  await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.17,
   null,{timeout:90000});
  const current=await page.evaluate(async()=>{
   const sim=window.CircuitJS1;
   const proxy=sim.getElements().find(e=>e.getType()==="FilteredBridgeElm");
   const samples={n:0,dt:0,i2:0,p:0,finite:true};
   const t0=sim.getTime();
   let prev=t0;
   const old=sim.ontimestep;
   sim.ontimestep=()=>{
    old?.();
    const t=sim.getTime();
    const dt=t-prev;
    prev=t;
    if(!(dt>0&&dt<0.002))return;
    const i=proxy.getCurrent(),u=proxy.getVoltageDiff();
    if(!Number.isFinite(i)||!Number.isFinite(u)){samples.finite=false;return;}
    samples.n++;
    samples.dt+=dt;
    samples.i2+=dt*i*i;
    samples.p+=dt*u*i;
   };
   try{
    for(let k=0;k<230;k++){
     await new Promise(resolve=>setTimeout(resolve,12));
     if(sim.getTime()-t0>0.10)break;
    }
   }finally{sim.ontimestep=old;}
   const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
    .querySelector("FilteredBridge");
   return {count:sim.getElements().filter(e=>e.getType()==="FilteredBridgeElm").length,
    time:sim.getTime()-t0,steps:samples.n,valid:samples.finite,
    duration:samples.dt,irms:Math.sqrt(samples.i2/samples.dt),
    p:samples.p/samples.dt,info:proxy.getInfo(),
    attrs:tag?Object.fromEntries([...tag.attributes].map(x=>[x.name,x.value])):null};
  });
  assert.equal(current.count,1,"No debe crear un elemento visible por unidad");
  assert(current.valid&&current.steps>150&&current.duration>0.06,
   "Adquisición insuficiente con N="+units+": "+JSON.stringify(current));
  assert(Number.isFinite(current.irms)&&current.irms>0,
   "Intensidad RMS inválida con N="+units);
  assert(Number.isFinite(current.p)&&Math.abs(current.p)>0,
   "Potencia activa inválida con N="+units);
  assert.equal(current.attrs.r,String(load.r));
  assert.equal(current.attrs.c,String(load.c));
  assert.equal(current.attrs.rs,String(load.rs));
  assert.equal(current.attrs.profile,String(load.profile));
  assert.equal(current.attrs.units,units===1?undefined:String(units),
   "El XML debe omitir el factor N=1 y guardar N>1");
  assert(current.info.some(x=>String(x).includes("Unidades = "+units)),
   "Las unidades no aparecen en la información del elemento");
  assert(current.info.some(x=>String(x).includes("R, C y Rs son valores por unidad")),
   "La información debe aclarar el significado de los valores R, C y Rs");
  const roundtrip=await page.evaluate(()=>{
   const sim=window.CircuitJS1,xml=sim.exportCircuit();
   sim.importCircuit(xml,false);
   const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
    .querySelector("FilteredBridge");
   return {xml:tag?.outerHTML,units:tag?.getAttribute("units"),
    info:sim.getElements().find(e=>e.getType()==="FilteredBridgeElm")?.getInfo()};
  });
  assert.equal(roundtrip.units,units===1?null:String(units),
   "N no se conserva tras reimportar el circuito");
  assert(roundtrip.info?.some(x=>String(x).includes("Unidades = "+units)));
  return {irms:current.irms,p:current.p,steps:current.steps,duration:current.duration};
 }

 const profiles=[
  {name:"LED sin PFC",r:6800,c:0.000010,rs:10,profile:1,quantity:5},
  {name:"Fuente de ordenador sin PFC",r:470,c:0.000470,rs:2.2,profile:2,quantity:4}
 ];
 for(const load of profiles){
  const one=await measure(load,1);
  const many=await measure(load,load.quantity);
  const ratioI=many.irms/one.irms;
  const ratioP=Math.abs(many.p/one.p);
  // Un único juego de diodos es una aproximación compacta a N puentes.
  assert(ratioI>load.quantity*0.78&&ratioI<load.quantity*1.22,
    load.name+": el multiplicador de corriente no se aproxima a N: "+
    JSON.stringify({one,many,ratioI}));
  assert(ratioP>load.quantity*0.75&&ratioP<load.quantity*1.25,
    load.name+": el multiplicador de potencia no se aproxima a N: "+
    JSON.stringify({one,many,ratioP}));
  console.log("OK:",load.name,"N="+load.quantity,
   "relación de corriente",ratioI,"relación de potencia",ratioP);
 }
 assert.deepEqual(errors,[],"Errores JavaScript: "+errors.join("; "));
 console.log("OK: valores por unidad, escala de cargas, potencia y XML con N=1 y N>1");
}finally{
 await browser.close();
}
