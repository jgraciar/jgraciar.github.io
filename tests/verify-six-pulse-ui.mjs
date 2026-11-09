import assert from "node:assert/strict";
import {chromium} from "playwright";

// Integración eléctrica del rectificador trifásico de seis pulsos en el
// motor CircuitJS1 con tres tensiones sinusoidales desfasadas 120 grados.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1400,height:950}});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.goto("http://127.0.0.1:8767/circuitjgr.html",{waitUntil:"domcontentloaded"});
 await page.locator("#lab-start-modal").waitFor({state:"visible",timeout:30000});
 await page.locator("#lab-start-accept").click();
 await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.02,null,{timeout:90000});

 const head='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="650" mts="5e-11">';
 const amp="325.2691193458119";
 const sources=[
  '<v x="80 192 80 352" f="0" wf="1" fr="50" maxv="'+amp+'"/>',
  '<v x="160 224 160 352" f="0" wf="1" fr="50" maxv="'+amp+'" phaseShift="-2.0943951023931953"/>',
  '<v x="240 256 240 352" f="0" wf="1" fr="50" maxv="'+amp+'" phaseShift="2.0943951023931953"/>'
 ].join("");
 const wiring='<w x="80 192 352 192" f="0"/>'+
  '<w x="160 224 352 224" f="0"/>'+
  '<w x="240 256 352 256" f="0"/>'+
  '<w x="80 352 160 352" f="0"/>'+
  '<w x="160 352 240 352" f="0"/>'+
  '<g x="80 352 80 384" f="0"/>';

 async function runCase({units,rs}){
  const params='r="470" c="0.001" rs="'+rs+'"'+
   (units>1?' units="'+units+'"':'');
  const xml=head+sources+wiring+
   '<SixPulseBridge x="352 224 480 224" f="0" '+params+'/></cir>';
  await page.evaluate(text=>window.CircuitJS1.importCircuit(text,false),xml);
  await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.16,null,
   {timeout:120000});
  const res=await page.evaluate(async()=>{
   const sim=window.CircuitJS1;
   const all=sim.getElements();
   const bridge=all.find(e=>e.getType()==="SixPulseBridgeElm");
   const voltage=all.filter(e=>e.getType()==="VoltageElm");
   if(!bridge||voltage.length!==3)return {
      missingBridge:!bridge,voltageCount:voltage.length,
      types:all.map(e=>e.getType())
   };
   const begin=sim.getTime();
   const start=Math.ceil((begin+1e-5)*50)/50;
   const end=start+0.06; // tres periodos completos
   const data={count:0,duration:0,i2:[0,0,0],v2:[0,0,0],
     cross:[[0,0,0],[0,0,0],[0,0,0]],p:0,udc:0,udc2:0,
     udcFirst:null,udcLast:0,absI:0,
     maxKcl:0,maxI:0,finite:true,onePhase:[]};
   let prev=begin;
   const original=sim.ontimestep;
   sim.ontimestep=()=>{
    original?.();
    const t=sim.getTime(),dt=t-prev;prev=t;
    if(!(dt>0&&dt<0.002&&t>=start&&t<=end))return;
    const i=bridge.getPhaseCurrents();
    // Tensiones de los bornes de la carga respecto a tierra. La API de la
    // fuente usa la polaridad contraria a la del borne superior de este XML.
    const v=i.map((_,k)=>bridge.getVoltage(k));
    const udc=bridge.getDcVoltage();
    if(![...i,...v,udc].every(Number.isFinite)){data.finite=false;return;}
    data.count++;data.duration+=dt;
    for(let k=0;k<3;k++){
      data.i2[k]+=dt*i[k]*i[k];
      data.v2[k]+=dt*v[k]*v[k];
      for(let m=0;m<3;m++)data.cross[k][m]+=dt*v[k]*i[m];
    }
    data.p+=dt*i.reduce((sum,x,k)=>sum+x*v[k],0);
    data.udc+=dt*udc;
    data.udc2+=dt*udc*udc;
    data.absI+=dt*i.reduce((sum,x)=>sum+Math.abs(x),0);
    if(data.udcFirst===null)data.udcFirst=udc;
    data.udcLast=udc;
    const sum=i.reduce((a,b)=>a+b,0);
    data.maxKcl=Math.max(data.maxKcl,Math.abs(sum));
    data.maxI=Math.max(data.maxI,...i.map(Math.abs));
    data.onePhase.push({t,dt,i:i[0],udc});
   };
   try{
    for(let j=0;j<750;j++){
      await new Promise(resolve=>setTimeout(resolve,12));
      if(sim.getTime()>end+0.005)break;
    }
   }finally{sim.ontimestep=original;}
   const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
     .querySelector("SixPulseBridge");
   const attrs=tag?Object.fromEntries([...tag.attributes].map(a=>[a.name,a.value])):null;
   const info=bridge.getInfo();
   const result={
    phases:bridge.getPostCount(),count:data.count,valid:data.finite,
    duration:data.duration,iRms:data.i2.map(x=>Math.sqrt(x/data.duration)),
    vRms:data.v2.map(x=>Math.sqrt(x/data.duration)),
    cross:data.cross.map(row=>row.map(x=>x/data.duration)),
    power:data.p/data.duration,udc:data.udc/data.duration,
    udc2:data.udc2/data.duration,absI:data.absI/data.duration,
    capacitorRate:(data.udcLast**2-data.udcFirst**2)/(2*data.duration),
    kcl:data.maxKcl,imax:data.maxI,attrs,info,
    postExport:sim.exportCircuit(),
    voltageSourceCount:voltage.length
   };
   // Armónicos de entrada, no lazos internos del convertidor.
   // Integración ponderada por dt sobre tres períodos enteros.
   const coeff=(n,field="i")=>{
     let cos=0,sin=0;
     for(const z of data.onePhase){
      const angle=2*Math.PI*50*n*z.t;
      cos+=z.dt*z[field]*Math.cos(angle);
      sin+=z.dt*z[field]*Math.sin(angle);
     }
     return 2*Math.hypot(cos,sin)/data.duration;
   };
   return {...result,h1:coeff(1),h3:coeff(3),h5:coeff(5),h7:coeff(7),
    dc2:coeff(2,"udc"),dc6:coeff(6,"udc")};
  });
  assert(!res.missingBridge,JSON.stringify(res));
  assert.equal(res.voltageSourceCount,3);
  assert.equal(res.phases,3,"El rectificador debe presentar tres bornes de fase");
  assert(res.valid&&res.count>1000&&res.duration>0.055,
   "La integración trifásica no ha completado tres ciclos: "+JSON.stringify(res));
  assert(res.iRms.every(x=>Number.isFinite(x)&&x>0.01),
   "No hay corrientes eléctricas válidas en las tres fases: "+JSON.stringify(res));
  assert(res.iRms.every(x=>Math.abs(x-res.iRms[0])/res.iRms[0]<0.08),
   "Las corrientes de fases equilibradas no son aproximadamente iguales: "+JSON.stringify(res));
  assert(res.kcl/Math.max(0.1,res.imax)<0.03,
   "La suma instantánea de corrientes trifásicas no es cero: "+JSON.stringify(res));
  assert(Number.isFinite(res.udc)&&res.udc>350&&res.udc<610,
   "Tensión del bus CC fuera del intervalo físico: "+JSON.stringify(res));
  console.log("Diagnóstico potencia trifásica",JSON.stringify({
   units,rs,p:res.power,vrms:res.vRms,
   correlations:res.cross,udc:res.udc,iRms:res.iRms,
   pDcEstimated:res.udc*res.udc/(470/units)}));
  assert(Number.isFinite(res.power)&&res.power>100,
   "Potencia trifásica demasiado pequeña: "+JSON.stringify(res));
  const loadPower=res.udc2*units/470;
  const seriesLoss=res.iRms.reduce((sum,i)=>sum+i*i,0)*rs/units;
  const storedPower=.001*units*res.capacitorRate;
  const diodeLoss=res.power-loadPower-seriesLoss-storedPower;
  assert(diodeLoss>=-res.power*.005 && diodeLoss<res.absI*2+res.power*.005,
   "Balance energético: "+JSON.stringify({input:res.power,loadPower,seriesLoss,storedPower,diodeLoss}));
  assert(res.h3/res.h1<.03,"No debe haber tercer armónico apreciable en la red equilibrada sin neutro");
  assert(res.h5/res.h1>.02&&res.h7/res.h1>.01,"Faltan armónicos característicos 5 y 7");
  assert(res.dc6>.1&&res.dc6>10*res.dc2,"El bus CC debe presentar rizado de seis pulsos (300 Hz)");
  assert(res.h1>res.h3&&res.h1>res.h5&&res.h1>res.h7,
   "La corriente trifásica no presenta componente fundamental principal");
  assert.equal(res.attrs.r,"470");
  assert.equal(res.attrs.c,"0.001");
  assert.equal(res.attrs.rs,String(rs));
  assert.equal(res.attrs.units,units===1?undefined:String(units));
  assert(res.info.some(x=>String(x).includes("Unidades = "+units)));
  assert(res.info.some(x=>String(x).includes("modelo")||String(x).includes("Modelo")));
  const roundtrip=await page.evaluate(()=>{
    const sim=window.CircuitJS1,xml=sim.exportCircuit();
    sim.importCircuit(xml,false);
    const e=sim.getElements().find(x=>x.getType()==="SixPulseBridgeElm");
    const tag=new DOMParser().parseFromString(sim.exportCircuit(),"application/xml")
     .querySelector("SixPulseBridge");
    return {count:sim.getElements().filter(x=>x.getType()==="SixPulseBridgeElm").length,
      posts:e?.getPostCount(),units:tag?.getAttribute("units"),
      r:tag?.getAttribute("r"),c:tag?.getAttribute("c"),rs:tag?.getAttribute("rs")};
  });
  assert.deepEqual(roundtrip,{count:1,posts:3,
    units:units===1?null:String(units),r:"470",c:"0.001",rs:String(rs)});
  console.log("OK seis pulsos",JSON.stringify({units,rs,irms:res.iRms,p:res.power,
    udc:res.udc,h1:res.h1,h3:res.h3,h5:res.h5,h7:res.h7,kcl:res.kcl}));
  return res;
 }

 const one=await runCase({units:1,rs:1});
 const four=await runCase({units:4,rs:1});
 const currentRatio=four.iRms[0]/one.iRms[0];
 const powerRatio=four.power/one.power;
 assert(Math.abs(currentRatio/4-1)<.01,
  "La corriente trifásica no escala con N: "+currentRatio);
 assert(Math.abs(powerRatio/4-1)<.01,
  "La potencia trifásica no escala con N: "+powerRatio);
 console.log("OK N=4: relación de corriente",currentRatio,
  "relación de potencia",powerRatio);
 // Comprobar la estabilidad de la topología con resistencia de fase pequeña.
 // Rs=0 se rechaza por producir una red ideal numéricamente singular.
 await runCase({units:1,rs:0.1});
 assert.deepEqual(errors,[],"Errores JavaScript: "+errors.join("; "));
}finally{await browser.close();}
