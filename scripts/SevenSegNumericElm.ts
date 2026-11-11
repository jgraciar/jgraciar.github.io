// SPDX-License-Identifier: GPL-3.0-or-later
import {ChipElm,Pin} from "./ChipElm";
import {CircuitElm} from "./CircuitElm";
import {Graphics} from "./Graphics";
import {Font} from "./Font";
export class SevenSegNumericElm extends ChipElm {
  static readonly masks=[0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7d,0x07,0x7f,0x6f];
  getChipName():string{return "7-segment numeric reader";}
  getDumpType():number{return 1782;}
  getXmlDumpType():string{return "SevenSegNumeric";}
  getPostCount():number{return 7;}
  getVoltageSourceCount():number{return 0;}
  showPropertiesOnCreate():boolean{return false;}
  setupPins():void{
    this.sizeX=4;this.sizeY=7;this.pins=new Array(7);
    for(let i=0;i<7;i++)this.pins[i]=new Pin(this,i,ChipElm.SIDE_W,String.fromCharCode(97+i));
  }
  digit():number|null{
    let pattern=0;for(let i=0;i<7;i++)if(this.pins[i].value)pattern|=1<<i;
    const result=SevenSegNumericElm.masks.indexOf(pattern);
    return result<0?null:result;
  }
  draw(g:Graphics):void{
    this.drawChip(g);
    const d=this.digit(),label=d===null?"–":String(d);
    const xx=this.x+this.cspc+this.flippedSizeX*this.cspc;
    const yy=this.y-this.cspc+this.flippedSizeY*this.cspc;
    g.save();g.setFont(new Font("SansSerif",0,16*this.csize));
    g.setColor(CircuitElm.whiteColor);
    const width=g.context.measureText(label).width;
    g.drawString(label,xx+3*this.csize-width/2,yy);
    g.restore();
  }
}