// SPDX-License-Identifier: GPL-3.0-or-later
import {ChipElm,Pin} from "./ChipElm";
export class BinaryToBCD4Elm extends ChipElm {
  getChipName():string{return "Binary 4-bit to BCD";}
  getDumpType():number{return 1781;}
  getXmlDumpType():string{return "BinaryToBCD4";}
  getPostCount():number{return 12;}
  getVoltageSourceCount():number{return 8;}
  showPropertiesOnCreate():boolean{return false;}
  setupPins():void {
    this.sizeX=5;this.sizeY=8;this.pins=new Array(12);
    for(let i=0;i<4;i++)this.pins[i]=new Pin(this,i+2,ChipElm.SIDE_W,"I"+i);
    for(let i=0;i<8;i++){
      this.pins[i+4]=new Pin(this,i,ChipElm.SIDE_E,(i<4?"U":"D")+(i%4));
      this.pins[i+4].output=true;
    }
  }
  execute():void {
    let n=0;for(let i=0;i<4;i++)if(this.pins[i].value)n|=1<<i;
    const units=n%10,tens=Math.floor(n/10);
    for(let i=0;i<4;i++){
      this.writeOutput(i+4,!!(units&(1<<i)));
      this.writeOutput(i+8,!!(tens&(1<<i)));
    }
  }
}