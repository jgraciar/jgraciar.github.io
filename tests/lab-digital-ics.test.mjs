import assert from 'node:assert/strict';
import {digitalICs as defs,digitalICParts,DigitalICState,outputPins,inputPins} from '../scripts/LabDigitalIC.ts';
const requested='4081 7408 4011 7400 4071 7432 4069 4070 4001 7486 7402 4082 7420 4012 4023 4043 4044 7476N 74112 7476 4027 40106 7414 7404'.split(' ').sort();
assert.deepEqual([...digitalICParts].sort(),requested);
const power=(d,supply=5,offset=0)=>{const v=Array(d.pins).fill(offset);v[d.vcc-1]=offset+supply;return v;};
let cases=0;
for(const d of Object.values(defs)){
 assert.equal(d.labels.length,d.pins);assert.equal(new Set(outputPins(d)).size,outputPins(d).length);
 assert(!inputPins(d).some(p=>outputPins(d).includes(p)||p===d.vcc||p===d.gnd));
 assert(d.labels[d.vcc-1].startsWith('V'));assert.equal(d.labels[d.gnd-1],'GND');
 for(const gate of d.gates){
  for(let bits=0;bits<2**gate.inputs.length;bits++){
   const v=power(d),state=new DigitalICState();gate.inputs.forEach((p,i)=>v[p-1]=bits&(1<<i)?5:0);
   const n=gate.inputs.length,ones=bits.toString(2).replaceAll('0','').length;
   const expected={AND:ones===n,NAND:ones!==n,OR:ones>0,NOR:ones===0,XOR:ones%2===1,NOT:ones===0,SCHMITT:ones===0}[gate.kind];
   assert.equal(state.step(d,v)[gate.output],expected,`${d.part} pin ${gate.output}, inputs ${bits}`);cases++;
  }
 }
 // Translation of both supply rails must not change any logic decision.
 if(d.gates.length){const s=new DigitalICState();assert.deepEqual(s.step(d,power(d,5,10)),new DigitalICState().step(d,power(d)));}
 for(const supply of [0,2,20])assert(Object.values(new DigitalICState().step(d,power(d,supply))).every(v=>v===null));
 for(const g of d.gates.filter(g=>g.kind==='SCHMITT')){
  const s=new DigitalICState(),v=power(d),p=g.inputs[0]-1;
  v[p]=0;assert.equal(s.step(d,v)[g.output],true);
  v[p]=d.family==='TTL'?1.3:2.5;assert.equal(s.step(d,v)[g.output],true,'hysteresis rising');
  v[p]=5;assert.equal(s.step(d,v)[g.output],false);
  v[p]=d.family==='TTL'?1.3:2.5;assert.equal(s.step(d,v)[g.output],false,'hysteresis falling');
  const saved=s.save(),r=new DigitalICState();r.restore(saved);assert.equal(r.step(d,v)[g.output],false,'Schmitt memory survives restore');
  v[p]=0;assert.equal(s.step(d,v)[g.output],true);
 }
 d.rs?.forEach((f,i)=>{
  const s=new DigitalICState(),v=power(d),active=d.mode==='rs-nand'?0:5,inactive=5-active;
  for(const l of d.rs){v[l.set-1]=inactive;v[l.reset-1]=inactive;}v[d.enable-1]=5;
  v[f.set-1]=active;assert.equal(s.step(d,v)[f.q],true,'RS set');v[f.set-1]=inactive;assert.equal(s.step(d,v)[f.q],true,'RS hold');
  v[d.enable-1]=0;assert.equal(s.step(d,v)[f.q],null,'RS high impedance');
  v[f.reset-1]=active;s.step(d,v);v[f.reset-1]=inactive;v[d.enable-1]=5;assert.equal(s.step(d,v)[f.q],false,'RS updates while disabled');
  v[f.set-1]=active;v[f.reset-1]=active;assert.equal(s.step(d,v)[f.q],d.mode==='rs-nor','manufacturer set/reset dominance');
 });
 d.jk?.forEach((f,i)=>{
  for(const initial of [false,true])for(const j of [false,true])for(const k of [false,true]){
   const s=new DigitalICState(),v=power(d);s.q[i]=initial;
   for(const ff of d.jk){v[ff.set-1]=d.family==='TTL'?5:0;v[ff.reset-1]=d.family==='TTL'?5:0;}
   v[f.j-1]=j?5:0;v[f.k-1]=k?5:0;s.step(d,v);
   const expected=j?(k?!initial:true):(k?false:initial);
   v[f.clock-1]=5;let out=s.step(d,v);
   assert.equal(out[f.q],d.mode==='rising'?expected:initial,'correct rising-edge behavior');
   v[f.clock-1]=0;out=s.step(d,v);assert.equal(out[f.q],expected,'JK truth table after full clock');assert.equal(out[f.nq],!expected);
   // Restoring at either clock level must preserve state without an extra edge.
   for(const ck of [0,5]){v[f.clock-1]=ck;s.step(d,v);const r=new DigitalICState();r.restore(s.save());assert.deepEqual(r.step(d,v),s.step(d,v),'JK save/restore clock phase');}
  }
  const s=new DigitalICState(),v=power(d),active=d.family==='TTL'?0:5,inactive=5-active;
  for(const ff of d.jk){v[ff.set-1]=inactive;v[ff.reset-1]=inactive;}
  v[f.set-1]=active;assert.equal(s.step(d,v)[f.q],true,'asynchronous preset');
  v[f.set-1]=inactive;v[f.reset-1]=active;assert.equal(s.step(d,v)[f.q],false,'asynchronous reset');
  v[f.set-1]=active;const both=s.step(d,v);assert.equal(both[f.q],true);assert.equal(both[f.nq],true);assert(s.invalid);
 });
}
// Independent pinout checks for the non-interchangeable 74xx/4000 families.
assert.deepEqual(defs['7408'].gates.map(g=>g.output),[3,6,8,11]);
assert.deepEqual(defs['4081'].gates.map(g=>g.output),[3,4,10,11]);
assert.deepEqual(defs['7402'].gates.map(g=>g.output),[1,4,10,13]);
assert.deepEqual(defs['7420'].gates.map(g=>g.inputs),[[1,2,4,5],[9,10,12,13]]);
assert.deepEqual(defs['4043'].rs.map(f=>f.q),[2,9,10,1]);assert.deepEqual(defs['4044'].rs.map(f=>f.q),[13,9,10,1]);
assert.deepEqual([defs['7476'].vcc,defs['7476'].gnd,defs['7476'].jk[0].k],[5,13,16]);
assert.deepEqual(defs['7476N'].jk,defs['7476'].jk);
console.log(`OK 24 digital ICs: ${cases} gate truth-table cases, 6-channel hysteresis, both JK channels/edges, async controls, RS dominance/high-Z, supply and state restoration`);
