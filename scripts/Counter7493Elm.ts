import {ChipElm,Pin} from "./ChipElm";
export class Counter7493Elm extends ChipElm {
 count=0; prevA=false;prevB=false;
 getChipName():string{return "7493";}
 getDumpType():number{return 1557;}
 getXmlDumpType():string{return "Counter7493";}
 getPostCount():number{return 8;}
 getVoltageSourceCount():number{return 4;}
 useSmallGrid():boolean{return true;}
 showPropertiesOnCreate():boolean{return false;}
 setupPins():void {
 this.sizeX=4;this.sizeY=6;this.pins=new Array(8);
 const add=(i:number,pos:number,side:number,name:string)=>this.pins[i]=new Pin(this,pos,side,name);
 add(0,0,ChipElm.SIDE_W,"CK1");add(1,2,ChipElm.SIDE_W,"CK2");
 add(2,4,ChipElm.SIDE_W,"R1");add(3,5,ChipElm.SIDE_W,"R2");
 ["QA","QB","QC","QD"].forEach((n,i)=>{add(i+4,i,ChipElm.SIDE_E,n);this.pins[i+4].output=true;});
 }
 execute():void {
 const a=this.pins[0].value,b=this.pins[1].value;
 if(this.pins[2].value&&this.pins[3].value)this.count=0;
 else {if(this.prevA&&!a)this.count^=1;if(this.prevB&&!b)this.count=(this.count&1)|(((((this.count>>1)+1)&7)<<1));}
 this.prevA=a;this.prevB=b;
 for(let i=0;i<4;i++)this.pins[i+4].value=!!(this.count&(1<<i));
 }
 reset():void {super.reset();this.count=0;this.prevA=false;this.prevB=false;}
 getInfo(a:string[]):void {a[0]="7493";a[1]="Count = "+this.count;}
}
