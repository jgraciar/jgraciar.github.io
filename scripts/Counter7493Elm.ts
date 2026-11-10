// SPDX-License-Identifier: GPL-3.0-or-later
import {ChipElm,Pin} from "./ChipElm";
import {Graphics} from "./Graphics";
import {Font} from "./Font";
import {CircuitXMLSerializer} from "./CircuitXMLSerializer";
import {CircuitXMLDeserializer} from "./CircuitXMLDeserializer";
export class Counter7493Elm extends ChipElm {
 count=0; prevA=false;prevB=false;
 getChipName():string{return "7493";}
 getDumpType():number{return 1557;}
 getXmlDumpType():string{return "Counter7493";}
 getPostCount():number{return 8;}
 getVoltageSourceCount():number{return 4;}
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
 this.sizeX=4;this.sizeY=6;this.pins=new Array(8);
 const add=(i:number,pos:number,side:number,name:string)=>this.pins[i]=new Pin(this,pos,side,name);
 add(0,0,ChipElm.SIDE_W,"CK1");add(1,2,ChipElm.SIDE_W,"CK2");
 add(2,4,ChipElm.SIDE_W,"R1");add(3,5,ChipElm.SIDE_W,"R2");
 this.pins[0].clock=true;this.pins[0].bubble=true;
 this.pins[1].clock=true;this.pins[1].bubble=true;
 ["QA","QB","QC","QD"].forEach((n,i)=>{add(i+4,i,ChipElm.SIDE_E,n);this.pins[i+4].output=true;});
 }
 execute():void {
 const a=this.pins[0].value,b=this.pins[1].value;
 if(this.pins[2].value&&this.pins[3].value)this.count=0;
 else {if(this.prevA&&!a)this.count^=1;
 // CK2 controla la cadena de tres biestables; QA puede realimentarlo externamente.
 if(this.prevB&&!b)this.count=(this.count&1)|(((((this.count>>1)+1)&7)<<1));}
 this.prevA=a;this.prevB=b;
 for(let i=0;i<4;i++)this.pins[i+4].value=!!(this.count&(1<<i));
 }
 reset():void {super.reset();this.count=0;this.prevA=false;this.prevB=false;}
 dumpXmlState(doc:Document,elem:Element):void {
 CircuitXMLSerializer.dumpAttr(elem,"count",this.count);
 CircuitXMLSerializer.dumpAttr(elem,"prevA",this.prevA);
 CircuitXMLSerializer.dumpAttr(elem,"prevB",this.prevB);
 }
 undumpXml(xml:CircuitXMLDeserializer):void {
 super.undumpXml(xml);
 this.count=xml.parseIntAttr("count",0) & 15;
 this.prevA=xml.parseBooleanAttr("prevA",false);
 this.prevB=xml.parseBooleanAttr("prevB",false);
 for(let i=0;i<4;i++)this.pins[4+i].value=!!(this.count&(1<<i));
 }
 getInfo(a:string[]):void {a[0]="7493";a[1]="Count = "+this.count;}
}
