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
for(const c of [a,b]){
 const data={};c.dumpXmlState(null,data);const restored=new (c.constructor)();
 restored.undumpXml({parseIntAttr:(k,d)=>data[k]??d,parseBooleanAttr:(k,d)=>data[k]??d});assert.equal(restored.count,c.count);
}
console.log('7493/74191: wraparound, independent clocks, reset, direction, enable, all parallel loads, cascade and state restore passed');
