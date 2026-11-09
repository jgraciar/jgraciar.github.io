import assert from 'node:assert/strict';
import {CD4026State} from '../scripts/LabCD4026.ts';
const s=new CD4026State();
const step=(clock=0,inh=false,reset=false)=>s.step(clock,inh,reset,12);
step();
const lit=['abcdef','bc','abdeg','abcdg','bcfg','acdfg','acdefg','abc','abcdefg','abcdfg'];
for(let digit=0;digit<30;digit++){
 assert.equal(s.count,digit%10);
 const out=s.outputs(true);
 assert.equal(out.slice(0,7).map((v,i)=>v?'abcdefg'[i]:'').join(''),lit[digit%10]);
 assert.equal(out[8],digit%10<5);assert.equal(out[9],digit%10!==2);
 step(12);step(12);assert.equal(s.count,(digit+1)%10);step(0);
}
step(12,true);assert.equal(s.count,0);step(12,false);assert.equal(s.count,1);
step(12,false,true);assert.equal(s.count,0);step(12);assert.equal(s.count,0);
step(0);step(12);assert.equal(s.count,1);
step(0);step(5);step(7);assert.equal(s.count,1);step(9);assert.equal(s.count,2);
step(6);step(8);assert.equal(s.count,2);step(3);step(9);assert.equal(s.count,3);
assert.deepEqual(s.outputs(false),[false,false,false,false,false,false,false,false,true,true]);
s.step(12,false,false,0);assert.equal(s.count,3);step(12);assert.equal(s.count,3);
const tens=new CD4026State();tens.step(12,false,true,12);
s.reset();step();
for(let i=1;i<=100;i++){
 step(12);tens.step(s.outputs(true)[8]?12:0,false,false,12);
 step(0);tens.step(s.outputs(true)[8]?12:0,false,false,12);
 assert.equal(s.count,i%10);assert.equal(tens.count,Math.floor(i/10)%10);
}
console.log('OK CD4026: digits, edges, inhibit clock, asynchronous reset, blanking, hysteresis, supply and 100-count cascade');
