import assert from 'node:assert/strict';
import {digitalICs,DigitalICState,inputPins,outputPins} from '../scripts/LabDigitalIC.ts';
function chip(part){const d=digitalICs[part],s=new DigitalICState(),v=Array(d.pins).fill(0);v[d.vcc-1]=5;
 const set=(p,x)=>{v[p-1]=x?5:0;},word=(pins,n)=>pins.forEach((p,i)=>set(p,n&(1<<i))),step=()=>s.step(d,v);
 const get=(pins,out=step())=>pins.reduce((n,p,i)=>n+(out[p]===true?1<<i:0),0);
 const clock=(p)=>{set(p,0);step();set(p,1);return step();};return {d,s,v,set,word,step,get,clock};}
let cases=0;
// Check every input pattern and address; inactive strobes must override selected data.
for(const part of ['74151','54151','74152','74150']){
 const c=chip(part),wide=part==='74150',inv=part==='74152',data=wide?[8,7,6,5,4,3,2,1,23,22,21,20,19,18,17,16]:inv?[5,4,3,2,1,13,12,11]:[4,3,2,1,15,14,13,12],sel=wide?[15,14,13,11]:inv?[10,9,8]:[11,10,9];
 for(let i=0;i<data.length;i++)for(let j=0;j<data.length;j++){
  c.word(data,1<<i);c.word(sel,j);let o=c.step();assert.equal(o[wide?10:inv?6:5],wide||inv?i!==j:i===j);if(!wide&&!inv)assert.equal(o[6],i!==j);cases++;
 }
 if(!inv){c.set(wide?9:7,1);const o=c.step();assert.equal(o[wide?10:6],true);if(!wide)assert.equal(o[5],false);}
}
// All priority combinations, including no asserted input; 9 overrides lower values.
{
 const c=chip('74147'),pins=[11,12,13,1,2,3,4,5,10];
 for(let bits=0;bits<512;bits++){let expected=0;pins.forEach((p,i)=>{c.set(p,!(bits&(1<<i)));if(bits&(1<<i))expected=i+1;});assert.equal(c.get([9,7,6,14]),(~expected)&15);cases++;}
}
{
 const c=chip('74138'),outs=[15,14,13,12,11,10,9,7];
 for(let enables=0;enables<8;enables++)for(let a=0;a<8;a++){
  c.word([4,5,6],enables);c.word([1,2,3],a);const out=c.step();outs.forEach((p,i)=>assert.equal(out[p],!(enables===4&&a===i)));cases++;
 }
}
// Transparent latches retain data when closed; output enable does not stop capture.
for(const part of ['74373','7475']){
 const c=chip(part),oct=part==='74373',data=oct?[3,4,7,8,13,14,17,18]:[2,3,6,7],outs=oct?[2,5,6,9,12,15,16,19]:[16,15,10,9],mask=oct?255:15;
 for(let n=0;n<=mask;n++){
  for(const p of oct?[11]:[13,4])c.set(p,1);c.word(data,n);assert.equal(c.get(outs),n);
  for(const p of oct?[11]:[13,4])c.set(p,0);c.word(data,n^mask);assert.equal(c.get(outs),n);cases++;
 }
 if(oct){c.set(1,1);c.set(11,1);c.word(data,165);assert(Object.values(c.step()).every(x=>x===null));c.set(1,0);assert.equal(c.get(outs),165);}
 else{c.set(13,1);c.set(4,0);c.word(data,15);assert.equal(c.get(outs)&3,3);assert.equal(c.get([1,14,11,8]),(~c.get(outs))&15);}
 const saved=c.s.save(),restored=new DigitalICState();restored.restore(saved);assert.deepEqual(restored.step(c.d,c.v),c.step());
}
{
 const c=chip('74194'),out=[15,14,13,12];c.set(1,1);
 for(let n=0;n<16;n++){
  c.word([9,10],3);c.word([3,4,5,6],n);c.clock(11);assert.equal(c.get(out),n);
  c.word([9,10],0);c.clock(11);assert.equal(c.get(out),n);
  c.word([9,10],1);c.set(2,1);c.clock(11);assert.equal(c.get(out),((n<<1)|1)&15);
  c.word([9,10],2);c.set(7,0);c.clock(11);assert.equal(c.get(out),(((n<<1)|1)&15)>>1);cases++;
 }
 c.set(1,0);assert.equal(c.get(out),0);
}
{
 const c=chip('74164'),out=[3,4,5,6,10,11,12,13];c.set(9,1);c.set(1,1);c.set(2,1);
 for(let i=1;i<=8;i++){c.clock(8);assert.equal(c.get(out),(1<<i)-1);}
 c.set(1,0);c.clock(8);assert.equal(c.get(out),254);c.set(9,0);assert.equal(c.get(out),0);
}
{
 const c=chip('74165');c.word([11,12,13,14,3,4,5,6],0xa5);c.step();c.set(1,1);c.set(10,0);
 for(const bit of [1,0,1,0,0,1,0,1]){assert.equal(c.step()[9],!!bit);assert.equal(c.step()[7],!bit);c.clock(2);}
 c.set(15,1);const before=c.s.msi.word;c.clock(2);assert.equal(c.s.msi.word,before);
}
for(const part of ['74190','74192','74168']){
 const c=chip(part),sync=part==='74168',dual=part==='74192',data=sync?[3,4,5,6]:[15,1,10,9],out=sync?[14,13,12,11]:[3,2,6,7],load=sync?9:11,ck=sync?2:dual?5:14;
 if(dual)c.set(4,1);if(sync)c.set(1,1);
 c.set(load,0);c.word(data,8);c.step();if(sync){assert.equal(c.get(out),0);c.clock(ck);}assert.equal(c.get(out),8);
 c.set(load,1);c.clock(ck);assert.equal(c.get(out),9);c.clock(ck);assert.equal(c.get(out),0);
 if(sync)c.set(1,0);else if(!dual)c.set(5,1);
 if(dual){c.set(5,1);c.clock(4);}else c.clock(ck);assert.equal(c.get(out),9);
 if(dual){c.set(14,1);c.set(load,0);assert.equal(c.get(out),0,'clear overrides load');}
 else{c.set(sync?7:4,1);const before=c.get(out);c.clock(ck);assert.equal(c.get(out),before);}
 cases++;
}
// All 16 addresses and 16 data words; writing and deselection release the bus.
{
 const c=chip('74189');for(let a=0;a<16;a++){
  c.word([1,15,14,13],a);c.word([4,6,10,12],a);assert(Object.values(c.step()).every(x=>x===null));
 }
 c.set(3,1);for(let a=0;a<16;a++){c.word([1,15,14,13],a);assert.equal(c.get([5,7,9,11]),a^15);cases++;}
 c.set(2,1);assert(Object.values(c.step()).every(x=>x===null));c.word([4,6,10,12],0);c.set(3,0);c.step();c.set(3,1);c.set(2,0);assert.equal(c.get([5,7,9,11]),0);
 const saved=c.s.save(),r=new DigitalICState();r.restore(saved);assert.deepEqual(r.step(c.d,c.v),c.step());
}
// Independent reference: TI SDLS136 Table 2, all operand/function/mode/carry combinations.
{
 const c=chip('74181'),fp=[9,10,11,13];
 for(let a=0;a<16;a++)for(let b=0;b<16;b++)for(let s=0;s<16;s++)for(let m=0;m<2;m++)for(let carry=0;carry<2;carry++){
  c.word([2,23,21,19],a);c.word([1,22,20,18],b);c.word([6,5,4,3],s);c.set(8,m);c.set(7,!carry);
  const logic=[~a,~(a|b),~a&b,0,~(a&b),~b,a^b,a&~b,~a|b,~(a^b),b,a&b,15,a|~b,a|b,a];
  const arithmetic=[a,a|b,a|(~b&15),15,a+(a&~b),(a|b)+(a&~b),a+(~b&15),(a&~b)+15,a+(a&b),a+b,(a|(~b&15))+(a&b),(a&b)+15,a+a,(a|b)+a,(a|(~b&15))+a,a+15];
  const expected=(m?logic[s]:arithmetic[s]+carry)&15,o=c.step();assert.equal(c.get(fp,o),expected,`ALU ${a},${b},S${s},M${m},C${carry}`);
  assert.equal(o[14],expected===15?null:false);if(!m)assert.equal(o[16],arithmetic[s]+carry<16);cases++;
 }
}
{
 const c=chip('7447'),segments=[13,12,11,10,9,15,14],patterns=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','cdefg','abc','abcdefg','abcfg','deg','cdg','bfg','adfg','defg',''];
 c.set(3,1);c.set(4,1);c.set(5,1);
 for(let digit=0;digit<16;digit++){c.word([7,1,2,6],digit);const o=c.step();segments.forEach((p,i)=>assert.equal(o[p],patterns[digit].includes('abcdefg'[i])?false:null));cases++;}
 c.set(3,0);assert(segments.every(p=>c.step()[p]===false));c.set(4,0);assert(segments.every(p=>c.step()[p]===null));c.set(4,1);c.set(3,1);c.set(5,0);c.word([7,1,2,6],0);assert.equal(c.step()[4],false);c.word([7,1,2,6],1);assert.equal(c.step()[4],null);
}
for(const d of Object.values(digitalICs).filter(d=>d.msi)){
 const c=chip(d.part),before=c.s.save();c.v[d.vcc-1]=0;assert(Object.values(c.step()).every(x=>x===null));assert.equal(c.s.save(),before,'unpowered device holds state');
 const state=new DigitalICState();state.restore('{"msi":{}}');assert.equal(state.msi.word,0);
 assert(outputPins(d).every(p=>p>0&&p<=d.pins));assert(inputPins(d).every(p=>p>0&&p<=d.pins));
}
console.log(`OK MSI: ${cases} truth-table cases, mux/decoder priority, latches, registers, BCD counting, SRAM, exhaustive ALU, open collectors, XML state`);
