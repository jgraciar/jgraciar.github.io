import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";
const base=process.argv[2];if(!base)throw Error("Usage: verify-generic-sequential-engine <patched-dir>");
class ChipElm {
 static SIDE_N=0;static SIDE_S=1;static SIDE_W=2;static SIDE_E=3;
 constructor(){this.flags=0;this.lastClock=false;this.setupPins();}
 writeOutput(i,value){this.pins[i].value=value;}
 getChipEditInfo(){return null;} setChipEditValue(){}
 allocNodes(){} setPoints(){}
 reset(){this.pins.forEach(p=>p.value=false);this.lastClock=false;}
}
class Pin {constructor(_chip,pos,side,text){this.pos=pos;this.side=side;this.text=text;this.value=false;this.clock=false;this.bubble=false;}}
class Choice {
 items=[];selected=0;add(s){this.items.push(s);}select(i){this.selected=i;}getSelectedIndex(){return this.selected;}
}
class EditInfo {constructor(name){this.name=name;this.choice=null;}}
const jgrAsyncSource=readFileSync(join(base,"JgrAsyncControls.ts"),"utf8")
 .replace(/^import .*;\s*$/gm,"").replace(/\bexport\s+/g,"");
const asyncHelpers=vm.runInNewContext(stripTypeScriptTypes(jgrAsyncSource)
 +";({jgrAsyncMode,jgrAsyncCount,jgrCreateAsyncPins,jgrAsyncState,jgrAsyncEditInfo,JGR_ASYNC_MASK})",
 {ChipElm,Pin,Choice,EditInfo});
function model(name){
 const source=readFileSync(join(base,name+".ts"),"utf8")
  .replace(/^import .*;\s*$/gm,"").replace("export class","class");
 return vm.runInNewContext(stripTypeScriptTypes(source)+";"+name,{ChipElm,Pin,Choice,EditInfo,...asyncHelpers,CircuitElm:{whiteColor:"white"},Graphics:class{},Font:class{}});
}
const D=model("DFlipFlopElm"),T=model("TFlipFlopElm"),JK=model("JKFlipFlopElm"),RS=model("RSGenericElm");
const BCD=model("BinaryToBCD4Elm"),Reader=model("SevenSegNumericElm");
function make(C,mode,shift=8,explicit=0){const c=new C(0,0);c.flags=(mode<<shift)|explicit;c.setupPins();return c;}
for(const [name,C,clockIndex,optionIndex] of [["D",D,3,0],["T",T,3,0],["JK",JK,1,0]]){
 for(let mode=0;mode<4;mode++){
  const c=make(C,mode,8,name==="JK"?1<<14:0);
  assert.equal(c.timingMode(),mode);
  assert.equal(c.pins[clockIndex].clock,mode<=1,name+" triangle "+mode);
  assert.equal(c.pins[clockIndex].bubble,mode===1||mode===3,name+" bubble "+mode);
  assert.equal(c.getChipEditInfo(optionIndex).choice.items.length,4,name+" dropdown");
 }
}
assert.equal(new D(0,0).timingMode(),0,"legacy D rising");
assert.equal(new T(0,0).timingMode(),0,"legacy T rising");
assert.equal(new JK(0,0).timingMode(),1,"legacy JK falling");
const legacyUp=new JK(0,0);legacyUp.flags|=JK.FLAG_POSITIVE_EDGE;legacyUp.setupPins();
assert.equal(legacyUp.timingMode(),0,"legacy JK positive-edge flag");
for(let mode=0;mode<4;mode++){
 const c=make(D,mode),active=mode===0||mode===2;
 c.pins[0].value=true;
 c.pins[3].value=!active;c.execute();
 if(mode<2)assert.equal(c.pins[1].value,false,"D no early edge "+mode);
 c.pins[3].value=active;c.execute();
 assert.equal(c.pins[1].value,true,"D active "+mode);
 if(mode>=2){
  c.pins[0].value=false;c.execute();assert.equal(c.pins[1].value,false,"transparent D "+mode);
 }else{
  c.pins[0].value=false;c.execute();assert.equal(c.pins[1].value,true,"edge holds D "+mode);
 }
}
for(let mode=0;mode<4;mode++){
 const c=make(T,mode),active=mode===0||mode===2;
 c.pins[0].value=true;c.pins[3].value=!active;c.execute();
 c.pins[3].value=active;c.execute();
 assert.equal(c.pins[1].value,true,"T first toggle "+mode);
 c.execute();assert.equal(c.pins[1].value,true,"T no race around "+mode);
 c.pins[3].value=!active;c.execute();
 c.pins[3].value=active;c.execute();
 assert.equal(c.pins[1].value,false,"T second activation "+mode);
}
for(let mode=0;mode<4;mode++){
 const c=make(JK,mode,8,1<<14),active=mode===0||mode===2;
 c.pins[0].value=true;c.pins[2].value=false;c.pins[1].value=!active;c.execute();
 c.pins[1].value=active;c.execute();
 assert.equal(c.pins[3].value,true,"JK set "+mode);
 if(mode>=2){
  c.pins[0].value=false;c.pins[2].value=true;c.execute();
  assert.equal(c.pins[3].value,false,"JK transparent reset "+mode);
  c.pins[0].value=true;c.pins[2].value=true;c.execute();
  assert.equal(c.pins[3].value,true,"JK toggle once "+mode);
  c.execute();assert.equal(c.pins[3].value,true,"JK no race around "+mode);
 }else{
  c.pins[0].value=false;c.pins[2].value=true;c.execute();
  assert.equal(c.pins[3].value,true,"JK edge holds "+mode);
 }
}
for(let mode=0;mode<6;mode++){
 const c=make(RS,mode,7),p=c.pins;
 assert.equal(c.mode(),mode);assert.equal(p.length,mode<2?4:5);
 assert.equal(c.getChipEditInfo(0).choice.items.length,6);
 if(mode>=2){assert.equal(p[4].clock,mode>=4);assert.equal(p[4].bubble,mode===3||mode===5);}
 const activeLevel=mode===3||mode===5?false:true;
 // Las entradas de modos síncronos son activas a nivel alto.
 p[0].value=mode===1?false:true;p[3].value=mode===1?true:false;
 if(mode>=2){p[4].value=!activeLevel;c.execute();p[4].value=activeLevel;}
 c.execute();assert.equal(p[1].value,true,"RS set "+mode);
 p[0].value=mode===1?true:false;p[3].value=mode===1?false:true;
 if(mode>=4){p[4].value=!activeLevel;c.execute();p[4].value=activeLevel;}
 c.execute();assert.equal(p[1].value,false,"RS reset "+mode);
}

for(const [name,C,clockIndex,qIndex,qbarIndex,flags,asyncIndex] of [
 ["D",D,3,1,2,0,1],
 ["T",T,3,1,2,0,1],
 ["JK",JK,1,3,4,0,1],
 ["RS",RS,4,1,2,4<<7,1]
]){
 for(const mode of [1,2]){
  const c=new C(0,0);c.flags=flags|(mode<<15);c.setupPins();
  const index=c.jgrAsyncStart(),p=c.pins;
  assert.equal(c.jgrAsyncMode(),mode,name+" mode "+mode);
  assert.equal(p[clockIndex].text,"CLK",name+" clock label");
  assert.equal(p[index].side,ChipElm.SIDE_N,name+" preset above");
  assert.equal(p[index+1].side,ChipElm.SIDE_S,name+" clear below");
  assert.equal(p[index].bubble,true);assert.equal(p[index+1].bubble,true);
  assert.equal(p[index].jgrExternalLabel,mode===1?"SET":"PR");
  assert.equal(p[index+1].jgrExternalLabel,mode===1?"RESET":"CLR");
  assert.equal(c.getChipEditInfo(asyncIndex).choice.items.length,3);
  assert.equal(p[index].value,true);assert.equal(p[index+1].value,true);
  const textBefore=JSON.stringify(p.map(x=>x.jgrExternalLabel||x.text));
  const tick=c.pins[clockIndex];tick.value=false;
  p[index].value=false;c.execute();
  assert.equal(p[qIndex].value,true,name+" async preset");
  assert.equal(p[qbarIndex].value,false,name+" async Qbar reset");
  assert.equal(tick.value,false,name+" no clock needed");
  p[index].value=true;p[index+1].value=false;c.execute();
  assert.equal(p[qIndex].value,false,name+" async clear");
  assert.equal(p[qbarIndex].value,true,name+" async Qbar clear");
  p[index].value=false;c.execute();
  assert.equal(p[qIndex].value,false,name+" simultaneous prohibited");
  assert.equal(p[qbarIndex].value,false,name+" simultaneous Qbar prohibited");
  assert.equal(JSON.stringify(p.map(x=>x.jgrExternalLabel||x.text)),textBefore,"pin names stable");
 }
}

const bcd=new BCD(0,0);for(let n=0;n<16;n++){
 for(let i=0;i<4;i++)bcd.pins[i].value=!!(n&(1<<i));
 bcd.execute();
 const val=offset=>[0,1,2,3].reduce((a,i)=>a+(bcd.pins[offset+i].value?1<<i:0),0);
 assert.equal(val(4),n%10);assert.equal(val(8),Math.floor(n/10));
}
const reader=new Reader(0,0);for(let n=0;n<10;n++){
 const bits=Reader.masks[n];
 for(let i=0;i<7;i++)reader.pins[i].value=!!(bits&(1<<i));
 assert.equal(reader.digit(),n);
}
for(let i=0;i<7;i++)reader.pins[i].value=false;
assert.equal(reader.digit(),null);
console.log("OK: D/T/JK/RS, CLK, preset y clear asíncronos a nivel bajo en caras superior/inferior, BCD y displays");

for(const C of [D,T,JK]){
 const c=new C(0,0);
 assert(c.getChipEditInfo(0).choice);assert(c.getChipEditInfo(1).choice);
 assert.equal(c.getChipEditInfo(2),null,'No legacy terminal/inversion checkboxes');
 for(const mode of [0,1,2,0]){
  const ei=c.getChipEditInfo(1);ei.choice.select(mode);c.setChipEditValue(1,ei);
  assert.equal(c.sizeX,2);assert.equal(c.sizeY,3);assert.equal(c.jgrAsyncMode(),mode);
 }
}
for(const C of [D,T,JK]){
 const c=new C(0,0);c.flags|=2;c.setupPins();
 const flags=c.flags,count=c.getPostCount();c.getChipEditInfo(0);c.getChipEditInfo(1);
 assert.equal(c.flags,flags,'Reading the editor preserves legacy flags');
 assert.equal(c.getPostCount(),count,'Legacy terminal topology is retained on load');
 const ei=c.getChipEditInfo(1);ei.choice.select(0);c.setChipEditValue(1,ei);
 assert.equal(c.hasReset(),false,'None explicitly removes the old reset option');
}
console.log('OK: stable body dimensions, compact editors and preserved legacy terminal flags');
