// SPDX-License-Identifier: GPL-3.0-or-later
// Keep the core mouse/command modules independent of ChipElm/Dialog initialization.
import type {CircuitElm} from './CircuitElm';
let openHandler:((elm:CircuitElm)=>void)|null=null;
export function registerICInfoHandler(handler:(elm:CircuitElm)=>void):void{openHandler=handler;}
export function canShowICInfo(elm:CircuitElm|null):boolean{
 if(!elm)return false;
 const chip=elm as CircuitElm&{getChipName?:()=>string;pins?:unknown[]};
 return (typeof chip.getChipName==='function'&&Array.isArray(chip.pins))||elm.isSubcircuitElm()||['OpAmpElm','OpAmpSwapElm','OpAmpRealElm'].includes(elm.constructor.name);
}
export function showICInfo(elm:CircuitElm|null):boolean{
 if(!elm||!canShowICInfo(elm)||!openHandler)return false;
 openHandler(elm);return true;
}
