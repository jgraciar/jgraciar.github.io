import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
import vm from 'node:vm';
// Execute the production state machines with a minimal pin harness.
class ChipElm {static SIDE_W=0;static SIDE_E=1;constructor(){this.setupPins();}reset(){}undumpXml(){} }
class Pin {constructor(_chip,_position,_side,text){this.text=text;this.value=false;}}
function model(name){
 const ts=readFileSync(new URL(`../scripts/${name}.ts`,import.meta.url),'utf8').replace(/^import .*;$/gm,'').replace('export class','class');
 return vm.runInNewContext(stripTypeScriptTypes(ts)+`;${name}`,{ChipElm,Pin,CircuitXMLSerializer:{dumpAttr:(e,k,v)=>e[k]=v}});
}
const A=model('Counter7493Elm'),a=new A();
function tick7493(){a.pins[0].value=true;a.execute();a.pins[0].value=false;a.execute();a.pins[1].value=a.pins[4].value;a.execute();}
for(let n=1;n<=32;n++){tick7493();assert.equal(a.count,n%16);}
a.pins[2].value=true;tick7493();assert.equal(a.count,1);a.pins[3].value=true;a.execute();assert.equal(a.count,0);
a.reset();a.pins.forEach(p=>p.value=false);a.pins[1].value=true;a.execute();a.pins[1].value=false;a.execute();assert.equal(a.count,2,'CK2 independently clocks the divide-by-eight section');
const B=model('Counter74191Elm'),b=new B();b.pins[6].value=true;
function tick(){b.pins[4].value=false;b.execute();b.pins[4].value=true;b.execute();}
for(let n=1;n<=32;n++){tick();assert.equal(b.count,n%16);}
b.pins[5].value=true;
for(let n=1;n<=32;n++){tick();assert.equal(b.count,(16-n%16)%16);}
b.pins[7].value=true;tick();assert.equal(b.count,0,'EN high inhibits counting');
for(let n=0;n<16;n++){
 for(let i=0;i<4;i++)b.pins[i].value=!!(n&(1<<i));
 b.pins[6].value=false;b.execute();assert.equal(b.count,n,'asynchronous parallel load');
 for(let i=0;i<4;i++)assert.equal(b.pins[8+i].value,!!(n&(1<<i)));
}
b.pins[6].value=true;b.pins[7].value=false;b.pins[5].value=false;b.pins[4].value=false;b.execute();
assert.equal(b.pins[12].value,false,'C is inverted MAX/MIN, per the supplied symbol');assert.equal(b.pins[13].value,false);
b.pins[4].value=true;b.execute();assert.equal(b.count,0);assert.equal(b.pins[12].value,true);assert.equal(b.pins[13].value,true);
b.pins[5].value=true;b.pins[4].value=false;b.execute();assert.equal(b.pins[12].value,false);assert.equal(b.pins[13].value,false);
// Exhaust every state, direction, enable and clock level without a clock edge.
// C is active low at MAX/MIN; R also requires low clock and enabled count.
for(const down of [false,true])for(const disabled of [false,true]){
 for(let count=0;count<16;count++)for(const clock of [false,true]){
  const chip=new B();chip.count=count;chip.prevClock=clock;
  chip.pins[4].value=clock;chip.pins[5].value=down;
  chip.pins[6].value=true;chip.pins[7].value=disabled;chip.execute();
  const terminal=down?count===0:count===15;
  assert.equal(chip.count,count,'control changes without rising edge preserve count');
  assert.equal(chip.pins[12].value,!terminal,'C terminal decode');
  assert.equal(chip.pins[13].value,!(terminal&&!clock&&!disabled),'R carry gating');
 }
}
// Restore both clock levels: importing must not create a fictitious rising edge.
for(const clock of [false,true])for(const down of [false,true]){
 const original=new B();original.count=down?0:15;original.prevClock=clock;
 const data={};original.dumpXmlState(null,data);
 const chip=new B();chip.undumpXml({parseIntAttr:(k,d)=>data[k]??d,parseBooleanAttr:(k,d)=>data[k]??d});
 chip.pins[4].value=clock;chip.pins[5].value=down;chip.pins[6].value=true;
 chip.execute();assert.equal(chip.count,original.count,'restored clock does not count');
 chip.pins[4].value=false;chip.execute();chip.pins[4].value=true;chip.execute();
 assert.equal(chip.count,down?15:0,'first real rising edge wraps after restore');
}
for(const c of [a,b]){
 const data={};c.dumpXmlState(null,data);const restored=new (c.constructor)();
 restored.undumpXml({parseIntAttr:(k,d)=>data[k]??d,parseBooleanAttr:(k,d)=>data[k]??d});assert.equal(restored.count,c.count);
}
console.log('7493/74191: wraparound, independent clocks, reset, direction, enable, all parallel loads, 128 carry combinations, clock-level restoration and state restore passed');
