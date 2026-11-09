import {ChipElm,Pin} from "./ChipElm";
export class Counter74191Elm extends ChipElm {
 count=0;prevClock=false;
 getChipName():string{return "74191";}
 getDumpType():number{return 1558;}
 getXmlDumpType():string{return "Counter74191";}
 getPostCount():number{return 15;}
 getVoltageSourceCount():number{return 6;}
 useSmallGrid():boolean{return true;}
 showPropertiesOnCreate():boolean{return false;}
 setupPins():void {
 this.sizeX=5;this.sizeY=9;this.pins=new Array(15);
 const add=(i:number,pos:number,side:number,name:string)=>this.pins[i]=new Pin(this,pos,side,name);
 ["L1","L2","L3","L4","CK","U/D","LD","EN"].forEach((n,i)=>add(i,i,ChipElm.SIDE_W,n));
 ["QA","QB","QC","QD","C","R"].forEach((n,i)=>{add(8+i,i,ChipElm.SIDE_E,n);this.pins[8+i].output=true;});
 add(14,8,ChipElm.SIDE_E,"NC");
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
 getInfo(a:string[]):void {a[0]="74191";a[1]="Count = "+this.count;}
}
