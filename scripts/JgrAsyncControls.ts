// SPDX-License-Identifier: GPL-3.0-or-later
// Entradas asíncronas activas a nivel bajo, independientes de CLK.
import {ChipElm,Pin} from './ChipElm';
import {Choice} from './Choice';
import {EditInfo} from './EditInfo';

export const JGR_ASYNC_MASK=3<<15; // No coincide con flags de ChipElm (hasta bit 14).
export function jgrAsyncMode(flags:number):number {
    return (flags & JGR_ASYNC_MASK) >>> 15;
}
export function jgrAsyncCount(flags:number):number {
    return jgrAsyncMode(flags) > 0 ? 2 : 0;
}
export function jgrCreateAsyncPins(chip:ChipElm,pins:Pin[],start:number,mode:number):void {
    if(mode===0)return;
    const pre=new Pin(chip,1,ChipElm.SIDE_N,'');
    const clear=new Pin(chip,1,ChipElm.SIDE_S,'');
    pre.bubble=clear.bubble=true;
    pre.jgrExternalLabel=mode===1?'SET':'PR';
    clear.jgrExternalLabel=mode===1?'RESET':'CLR';
    pins[start]=pre;
    pins[start+1]=clear;
}
export function jgrAsyncState(pins:Pin[],start:number,mode:number):number {
    if(mode===0)return -1;  // no habilitado
    const preset=!pins[start].value;
    const clear=!pins[start+1].value;
    if(!preset&&!clear)return -1;
    if(preset&&clear)return 2; // combinación prohibida: Q=Q̅=0
    return preset?1:0;
}
export function jgrAsyncEditInfo(mode:number):EditInfo {
    const ei=new EditInfo('Asynchronous SET/RESET',0,-1,-1);
    ei.choice=new Choice();
    ['None','SET / RESET (active low)','PR / CLR (active low)']
        .forEach(label=>ei.choice!.add(label));
    ei.choice.select(mode);
    return ei;
}
