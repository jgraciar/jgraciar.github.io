// SPDX-License-Identifier: GPL-3.0-or-later
import {ChipElm,Pin} from './ChipElm';
import {CircuitElm} from './CircuitElm';
import {Graphics} from './Graphics';
import {Font} from './Font';
import {CircuitXMLSerializer} from './CircuitXMLSerializer';
import {CircuitXMLDeserializer} from './CircuitXMLDeserializer';
import {digitalICs,DigitalICState,inputPins,outputPins} from './LabDigitalIC';
// Powered functional package model; output stages are not transistor-level TTL/CMOS models.
export abstract class DigitalICElm extends ChipElm {
 logic=new DigitalICState();values:Record<number,boolean|null>={};
 abstract part():string;
 definition(){return digitalICs[this.part()];}
 getChipName():string{return this.part();}
 getXmlDumpType():string{return 'IC'+this.part();}
 getDumpType():number{return 1600+Object.keys(digitalICs).indexOf(this.part());}
 getPostCount():number{return this.definition().pins;}
 getVoltageSourceCount():number{return 0;}
 useSmallGrid():boolean{return true;}
 isDigitalChip():boolean{return false;}
 showPropertiesOnCreate():boolean{return false;}
 setupPins():void{
  const d=this.definition(),outs=outputPins(d);this.sizeX=9;this.sizeY=d.pins/2+2;
  this.pins=d.labels.map((label,i)=>{
   const left=i<d.pins/2,pos=left?i+1:d.pins-i;
   const pin=new Pin(this,pos,left?ChipElm.SIDE_W:ChipElm.SIDE_E,`${i+1} ${label}`);
   pin.output=outs.includes(i+1);
   if(d.msi){pin.bubble=label.startsWith('/');pin.clock=label==='CK'||label==='UP'||label==='DOWN';}
   const ff=d.jk?.find(f=>f.clock===i+1||f.set===i+1||f.reset===i+1||f.nq===i+1);
   if(ff){
    pin.clock=ff.clock===i+1;
    pin.bubble=(ff.clock===i+1&&d.mode==='falling')||
     (d.family==='TTL'&&(ff.set===i+1||ff.reset===i+1));
   }
   if(d.mode==='rs-nand'&&d.rs?.some(f=>f.set===i+1||f.reset===i+1))pin.bubble=true;
   return pin;
  });
 }
 setPoints():void{const end=this.x2;if(this.isCreating()){this.setSize(1);this.x2=this.x+this.sizeX*16;}super.setPoints();this.x2=end;}
 getMouseDistance(x:number,y:number):number{
  if(this.rectPointsX?.length&&x>=this.rectPointsX[0]&&x<=this.rectPointsX[2]&&y>=this.rectPointsY[0]&&y<=this.rectPointsY[2])return 0;
  const dist=super.getMouseDistance(x,y);return Number.isFinite(dist)?dist:(x-this.x)**2+(y-this.y)**2;
 }
 drawLabel(g:Graphics,x:number,_y:number):void{
  g.setFont(new Font('normal',0,11*this.csize));const text=this.part();
  g.drawString(text,x-g.context.measureText(text).width/2,this.rectPointsY[0]-5*this.csize);
 }
 nonLinear():boolean{return true;}
 stamp():void{
  const d=this.definition();for(const p of [d.vcc,d.gnd,...outputPins(d)])CircuitElm.sim.stampNonLinear(this.nodes[p-1]);
  CircuitElm.sim.stampResistor(this.nodes[d.vcc-1],this.nodes[d.gnd-1],1e10);
 }
 startIteration():void{
  this.values=this.logic.step(this.definition(),this.nodes.map(n=>n.v));
  for(const p of inputPins(this.definition()))this.pins[p-1].value=this.logic.levels[p-1];
  for(const p of outputPins(this.definition()))this.pins[p-1].value=this.values[p]===true;
 }
 doStep():void{
  const d=this.definition();for(const p of outputPins(d)){
   CircuitElm.sim.stampResistor(this.nodes[p-1],this.nodes[d.vcc-1],this.values[p]===true?200:1e12);
   CircuitElm.sim.stampResistor(this.nodes[p-1],this.nodes[d.gnd-1],this.values[p]===false?200:1e12);
  }
 }
 calculateCurrent():void{
  const d=this.definition();for(const pin of this.pins)pin.current=0;
  for(const p of outputPins(d)){
   const up=(this.nodes[d.vcc-1].v-this.nodes[p-1].v)/(this.values[p]===true?200:1e12);
   const down=(this.nodes[d.gnd-1].v-this.nodes[p-1].v)/(this.values[p]===false?200:1e12);
   this.pins[p-1].current=up+down;this.pins[d.vcc-1].current-=up;this.pins[d.gnd-1].current-=down;
  }
  const leakage=(this.nodes[d.vcc-1].v-this.nodes[d.gnd-1].v)/1e10;
  this.pins[d.vcc-1].current-=leakage;this.pins[d.gnd-1].current+=leakage;
 }
 getConnection(a:number,b:number):boolean{
  const d=this.definition(),pins=[d.vcc,d.gnd,...outputPins(d)];return a!==b&&pins.includes(a+1)&&pins.includes(b+1);
 }
 hasGroundConnection(_p:number):boolean{return false;}
 reset():void{super.reset();this.logic?.reset();this.values={};}
 dumpXmlState(_doc:Document,elem:Element):void{CircuitXMLSerializer.dumpAttr(elem,'logic',this.logic.save());}
 undumpXml(xml:CircuitXMLDeserializer):void{super.undumpXml(xml);this.logic.restore(xml.parseStringAttr('logic','')||'');}
 getInfo(a:string[]):void{
  const d=this.definition();a[0]=this.part();a[1]=d.family;
  a[2]=(d.family==='TTL'?'Vcc = ':'Vdd = ')+CircuitElm.getVoltageText(this.nodes[d.vcc-1].v-this.nodes[d.gnd-1].v);
  if(this.logic.invalid)a[3]='SET + RESET';
 }
}
