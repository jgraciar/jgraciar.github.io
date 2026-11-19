import assert from "node:assert/strict";
import {filteredBridgeStep} from "../scripts/LabFilteredBridge.ts";
import {currentHarmonics} from "../scripts/LabHarmonics.ts";

// Pruebas deterministas de límites y propiedades físicas del modelo de referencia.
const near=(a,b,t=1e-9)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`);
const base={capacitorVoltage:0};
for(const bad of [NaN,Infinity,-Infinity]){
 assert.throws(()=>filteredBridgeStep(bad,2,200,.002,.00002,base),/Parámetros/);
 assert.throws(()=>filteredBridgeStep(10,2,200,.002,.00002,{capacitorVoltage:bad}),/Parámetros/);
 assert.throws(()=>currentHarmonics([1,2,3,4,5,6,7,bad],2),/Muestras/);
}
for(const bad of [0,-1,NaN,Infinity]){
 for(let j=1;j<=4;j++){
  const p=[10,2,200,.002,.00002,base];
  p[j]=bad;
  assert.throws(()=>filteredBridgeStep(...p),/Parámetros/);
 }
}
for(const n of [0,1,2,7,8,9,16]){
 const a=Array.from({length:n},()=>0);
 assert.throws(()=>currentHarmonics(a,n<8?1:Math.ceil(n/2)),/Muestras/);
}
for(const order of [0,-1,1.5,NaN,Infinity]){
 assert.throws(()=>currentHarmonics(Array(32).fill(0),order),/Muestras/);
}
for(const voltage of [-325,-10,0,10,325]){
 const r=filteredBridgeStep(voltage,2,200,.002,.00002,base);
 assert(Number.isFinite(r.state.capacitorVoltage));
 assert(voltage*r.inputCurrent>=0);
}
const n=512;
const zero=currentHarmonics(Array(n).fill(0),20);
near(zero.totalRms,0);near(zero.dc,0);assert.equal(zero.thd,null);
const constant=currentHarmonics(Array(n).fill(5),20);
near(constant.dc,5);near(constant.totalRms,5);assert.equal(constant.thd,null);
for(const amplitude of [0.01,1,100]){
 const a=Array.from({length:n},(_,k)=>amplitude*Math.SQRT2*Math.sin(2*Math.PI*k/n));
 const spectrum=currentHarmonics(a,20);
 near(spectrum.totalRms,amplitude,1e-7);
 near(spectrum.fundamentalRms,amplitude,1e-7);
 assert(spectrum.thd<1e-6);
}
// Verificación de estabilidad temporal del rectificador ideal filtrado.
for(const dt of [1e-7,1e-5,1e-3,.1]){
 let state={capacitorVoltage:0};
 for(let k=0;k<200;k++){
  const voltage=325*Math.sin(2*Math.PI*50*k*dt);
  const result=filteredBridgeStep(voltage,2,200,.002,dt,state);
  assert(Number.isFinite(result.state.capacitorVoltage));
  assert(Number.isFinite(result.inputCurrent));
  assert(Number.isFinite(result.loadCurrent));
  assert(result.state.capacitorVoltage>=0);
  assert(result.state.capacitorVoltage<=325+1e-9);
  assert(result.loadCurrent>=0);
  assert(voltage*result.inputCurrent>=0);
  state=result.state;
 }
}
// Los armónicos puros deben identificarse sin confundir la THD con la continua.
const distorted=Array.from({length:n},(_,k)=>
 Math.SQRT2*(10*Math.sin(2*Math.PI*k/n)+3*Math.sin(6*Math.PI*k/n)));
const harmonicResult=currentHarmonics(distorted,20);
near(harmonicResult.fundamentalRms,10,1e-7);
near(harmonicResult.harmonics[2],3,1e-7);
near(harmonicResult.thd,.3,1e-7);
near(harmonicResult.totalRms,Math.sqrt(109),1e-7);
console.log("OK: robustez numérica, entradas inválidas, CC, corriente nula y THD.");
