// SPDX-License-Identifier: GPL-3.0-or-later
import {ChipElm,Pin} from "./ChipElm";
import {Graphics} from "./Graphics";
import {Font} from "./Font";
import {CircuitXMLSerializer} from "./CircuitXMLSerializer";
import {CircuitXMLDeserializer} from "./CircuitXMLDeserializer";
export class Counter74191Elm extends ChipElm {
 count=0;prevClock=false;
 getChipName():string{return "74191";}
 getDumpType():number{return 1558;}
 getXmlDumpType():string{return "Counter74191";}
 getPostCount():number{return 14;}
 getVoltageSourceCount():number{return 6;}
 useSmallGrid():boolean{return true;}
 showPropertiesOnCreate():boolean{return false;}
    // Selection covers the entire package, including a zero-length insertion drag.
    getMouseDistance(gx:number,gy:number):number {
        const xs=this.rectPointsX,ys=this.rectPointsY;
        if(xs?.length && gx>=Math.min(...xs) && gx<=Math.max(...xs) && gy>=Math.min(...ys) && gy<=Math.max(...ys))return 0;
        const distance=super.getMouseDistance(gx,gy);
        return Number.isFinite(distance)?distance:(gx-this.x)**2+(gy-this.y)**2;
    }
    setPoints():void {
        const end=this.x2;
        if(this.isCreating()){this.setSize(1);this.x2=this.x+this.sizeX*16;}
        super.setPoints();this.x2=end;
    }
    drawLabel(g:Graphics,x:number,_y:number):void {
        const label=this.getChipName();g.setFont(new Font("normal",0,10*this.csize));
        g.drawString(label,x-g.context.measureText(label).width/2,this.rectPointsY[0]-5*this.csize);
    }
    setupPins():void {
 this.sizeX=5;this.sizeY=9;this.pins=new Array(14);
 const add=(i:number,pos:number,side:number,name:string)=>this.pins[i]=new Pin(this,pos,side,name);
 ["L1","L2","L3","L4","CK","U/D","LD","EN"].forEach((n,i)=>add(i,i,ChipElm.SIDE_W,n));
 this.pins[4].clock=true;this.pins[6].lineOver=true;this.pins[7].lineOver=true;
 ["QA","QB","QC","QD","C","R"].forEach((n,i)=>{add(8+i,i,ChipElm.SIDE_E,n);this.pins[8+i].output=true;});
 this.pins[12].bubble=true;this.pins[13].bubble=true;
 }
 execute():void {
 const clock=this.pins[4].value;
 if(!this.pins[6].value){this.count=0;for(let i=0;i<4;i++)if(this.pins[i].value)this.count|=1<<i;}
 else if(clock&&!this.prevClock&&!this.pins[7].value)this.count=(this.count+(this.pins[5].value?-1:1)+16)&15;
 this.prevClock=clock;
 for(let i=0;i<4;i++)this.pins[8+i].value=!!(this.count&(1<<i));
 const terminal=this.pins[5].value?this.count===0:this.count===15;
 this.pins[12].value=!terminal;
 this.pins[13].value=!(terminal&&!clock&&!this.pins[7].value);
 }
 reset():void {super.reset();this.count=0;this.prevClock=false;}
 dumpXmlState(doc:Document,elem:Element):void {
 CircuitXMLSerializer.dumpAttr(elem,"count",this.count);
 CircuitXMLSerializer.dumpAttr(elem,"prevClock",this.prevClock);
 }
 undumpXml(xml:CircuitXMLDeserializer):void {
 super.undumpXml(xml);
 this.count=xml.parseIntAttr("count",0) & 15;
 this.prevClock=xml.parseBooleanAttr("prevClock",false);
 for(let i=0;i<4;i++)this.pins[8+i].value=!!(this.count&(1<<i));
 }
 getInfo(a:string[]):void {a[0]="74191";a[1]="Count = "+this.count;}
}
