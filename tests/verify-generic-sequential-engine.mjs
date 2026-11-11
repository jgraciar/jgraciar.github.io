import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {stripTypeScriptTypes} from "node:module";
import vm from "node:vm";
const base=process.argv[2];if(!base)throw Error("Usage: verify-generic-sequential-engine <patched-dir>");
class ChipElm {
 static SIDE_W=2;static SIDE_E=3;
 constructor(){this.flags=0;this.lastClock=false;this.setupPins();}
 writeOutput(i,value){this.pins[i].value=value;}
 allocNodes(){} setPoints(){}
 reset(){this.pins.forEach(p=>p.value=false);this.lastClock=false;}
}
class Pin {constructor(_chip,pos,side,text){this.pos=pos;this.side=side;this.text=text;this.value=false;this.clock=false;this.bubble=false;}}
class Choice {
 items=[];selected=0;add(s){this.items.push(s);}select(i){this.selected=i;}getSelectedIndex(){return this.selected;}
}
class EditInfo {constructor(name){this.name=name;this.choice=null;}}
function model(name){
 const source=readFileSync(join(base,name+".ts"),"utf8")
  .replace(/^import .*;\s*$/gm,"").replace("export class","class");
 return vm.runInNewContext(stripTypeScriptTypes(source)+";"+name,{ChipElm,Pin,Choice,EditInfo,CircuitElm:{whiteColor:"white"},Graphics:class{},Font:class{}});
}
const D=model("DFlipFlopElm"),T=model("TFlipFlopElm"),JK=model("JKFlipFlopElm"),RS=model("RSGenericElm");
const BCD=model("BinaryToBCD4Elm"),Reader=model("SevenSegNumericElm");
function make(C,mode,shift=8,explicit=0){const c=new C(0,0);c.flags=(mode<<shift)|explicit;c.setupPins();return c;}
for(const [name,C,clockIndex,optionIndex] of [["D",D,3,3],["T",T,3,2],["JK",JK,1,1]]){
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
console.log("OK: D/T/JK in 4 modes, RS in 6 modes, symbols, legacy defaults, 16 BCD codes, ten seven-segment patterns");
