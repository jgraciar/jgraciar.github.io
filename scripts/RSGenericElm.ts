// SPDX-License-Identifier: GPL-3.0-or-later
import {ChipElm,Pin} from "./ChipElm";
import {StringTokenizer} from "./StringTokenizer";
import {EditInfo} from "./EditInfo";
import {Choice} from "./Choice";
export class RSGenericElm extends ChipElm {
  static readonly MODE_MASK=7<<7;
  mode():number{return (this.flags&RSGenericElm.MODE_MASK)>>7;}
  constructor(x:number,y:number);
  constructor(x:number,y:number,x2:number,y2:number,f:number,st:StringTokenizer);
  constructor(x:number,y:number,x2?:number,y2?:number,f?:number,st?:StringTokenizer){
    if(x2===undefined)super(x,y);else super(x,y,x2,y2!,f!,st!);
    this.pins[2].value=!this.pins[1].value;
  }
  getChipName():string{return "RS flip-flop";}
  getDumpType():number{return 1780;}
  getXmlDumpType():string{return "RSGeneric";}
  getPostCount():number{return this.mode()<2?4:5;}
  getVoltageSourceCount():number{return 2;}
  showPropertiesOnCreate():boolean{return false;}
  setupPins():void {
    const mode=this.mode();
    this.sizeX=2;this.sizeY=3;this.pins=new Array(mode<2?4:5);
    this.pins[0]=new Pin(this,0,ChipElm.SIDE_W,"S");
    this.pins[1]=new Pin(this,0,ChipElm.SIDE_E,"Q");this.pins[1].output=this.pins[1].state=true;
    this.pins[2]=new Pin(this,2,ChipElm.SIDE_E,"Q");this.pins[2].lineOver=true;this.pins[2].output=true;
    this.pins[3]=new Pin(this,2,ChipElm.SIDE_W,"R");
    if(mode===1){this.pins[0].bubble=true;this.pins[3].bubble=true;}
    if(mode>=2){
      this.pins[4]=new Pin(this,1,ChipElm.SIDE_W,mode<4?"E":"");
      this.pins[4].clock=mode>=4;
      this.pins[4].bubble=mode===3||mode===5;
    }
  }
  reset():void {super.reset();this.pins[2].value=true;}
  execute():void {
    const mode=this.mode(),ck=mode<2?false:this.pins[4].value;
    const active=mode<2||mode===2&&ck||mode===3&&!ck||
      mode===4&&ck&&!this.lastClock||mode===5&&!ck&&this.lastClock;
    if(active){
      const set=mode===1?!this.pins[0].value:this.pins[0].value;
      const clear=mode===1?!this.pins[3].value:this.pins[3].value;
      if(set&&clear){
        // Condición prohibida: en el latch NOR ambos bajos; en NAND ambos altos.
        this.pins[1].value=mode===1;this.pins[2].value=mode===1;
      }else if(set||clear){
        this.pins[1].value=set;this.pins[2].value=!set;
      }else if(this.pins[1].value===this.pins[2].value){
        // La liberación simultánea es indeterminada físicamente; el simulador vuelve al cero.
        this.pins[1].value=false;this.pins[2].value=true;
      }
    }
    this.lastClock=ck;
  }
  getChipEditInfo(n:number):EditInfo|null{
    if(n!==0)return null;
    const ei=new EditInfo("Operating Mode",0,-1,-1);ei.choice=new Choice();
    ["Asynchronous (active high)","Asynchronous (active low)",
      "High level","Low level","Rising edge","Falling edge"].forEach(s=>ei.choice!.add(s));
    ei.choice.select(this.mode());return ei;
  }
  setChipEditValue(n:number,ei:EditInfo):void {
    if(n!==0)return;
    this.flags=(this.flags&~RSGenericElm.MODE_MASK)|(ei.choice!.getSelectedIndex()<<7);
    this.setupPins();this.allocNodes();this.setPoints();ei.newDialog=true;
  }
}