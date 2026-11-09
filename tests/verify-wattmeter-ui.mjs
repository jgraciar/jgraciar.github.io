import assert from "node:assert/strict";
import {chromium} from "playwright";

const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({locale:"en-GB"});
 const errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>{
  localStorage.setItem("labStartConfigured","1");
  localStorage.setItem("labLanguageMode","manual");
  localStorage.setItem("language","en");
  localStorage.setItem("labDecimalSeparator",".");
  localStorage.setItem("labGroupingSeparator","");
 });
 await page.goto("http://127.0.0.1:8767/circuitjgr.html");
 await page.waitForFunction(()=>window.CircuitJS1?.getTime?.()>0.02,null,{timeout:90000});
 const read=(info,label)=>{
  const row=info.find(s=>s.startsWith(label));
  assert(row,"Falta lectura "+label+": "+JSON.stringify(info));
  const m=row.slice(label.length).trim().match(/^([-+\d.]+)\s*([mkµu]?)/);
  assert(m,"Lectura no numérica: "+row);
  return Number(m[1])*({m:1e-3,k:1e3,µ:1e-6,u:1e-6}[m[2]]??1);
 };
 for(const reversed of [false,true]){
  // 10 V RMS sobre R=8 Ω y X_L=6 Ω: P=8 W, Q1=6 var, S=10 VA.
  const c=reversed?272:160,v=reversed?160:272;
  const xml='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="20" mts="5e-11">'+
   '<v x="80 160 80 320" f="0" wf="1" fr="50" maxv="14.142135623730951"/>'+
   '<g x="80 320 80 352" f="0"/>'+
   '<w x="80 160 160 160" f="0"/>'+
   '<WattmeterTrue x="160 160 272 160" f="0" w="32" meter="1" labPowerMask="7" labShowCosPhi="1" labShowPowerFactor="1"/>'+
   '<w x="272 160 352 160" f="0"/>'+
   '<r x="352 160 352 240" f="0" r="8"/>'+
   '<l x="352 240 352 320" f="0" l="0.01909859317102744"/>'+
   '<w x="352 320 80 320" f="0"/>'+
   '<w x="'+c+' 192 80 192" f="0"/>'+
   '<w x="80 192 80 160" f="0"/>'+
   '<w x="'+v+' 192 '+v+' 320" f="0"/>'+
   '<w x="'+v+' 320 80 320" f="0"/></cir>';
  const pending=await page.evaluate(xml=>{
   const sim=window.CircuitJS1;
   sim.setSimRunning(false);
   sim.importCircuit(xml,false);
   return sim.getElements().find(e=>e.getType()==="WattmeterTrueElm").getInfo();
  },xml);
  assert(pending.includes("Q (fundamental) = ...")&&pending.includes("S = ..."),
   "Antes de medir no se deben presentar ceros como si fueran lecturas CC");
  await page.evaluate(()=>window.CircuitJS1.setSimRunning(true));
  await page.waitForFunction(()=>window.CircuitJS1.getTime()>.5,null,{timeout:90000});
  const info=await page.evaluate(()=>window.CircuitJS1.getElements()
   .find(e=>e.getType()==="WattmeterTrueElm").getInfo());
  const sign=reversed?-1:1;
  for(const [label,expected] of [["P = ",8*sign],["Q (fundamental) = ",6*sign],
   ["S = ",10],["cos φ (fundamental) = ",.8*sign],["f.d.p. real (P/S) = ",.8*sign]]){
   const actual=read(info,label);
   assert(Math.abs(actual-expected)<.02*Math.abs(expected),JSON.stringify({label,actual,expected,info}));
  }
  console.log("OK: vatímetro real R-L, P/Q1/S, cosφ y P/S; polaridad invertida:",reversed);
  await page.evaluate(()=>window.CircuitJS1.setSimRunning(false));
  await page.getByRole("button",{name:"Reset",exact:true}).click();
  const cleared=await page.evaluate(()=>window.CircuitJS1.getElements()
   .find(e=>e.getType()==="WattmeterTrueElm").getInfo());
  assert(cleared.includes("Q (fundamental) = ...")&&cleared.includes("S = ..."),
   "Reiniciar en pausa debe borrar el historial del vatímetro");
 }
 assert.deepEqual(errors,[]);
} finally {await browser.close();}
