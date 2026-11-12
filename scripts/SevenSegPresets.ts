// SPDX-License-Identifier: GPL-3.0-or-later
import {SevenSegElm} from './SevenSegElm';

// Creation presets only. Saved circuits keep the original ssd/157 format and
// reload through SevenSegElm; editing can still change the diode configuration.
export class SevenSegCommonCathodeElm extends SevenSegElm {
    constructor(x:number,y:number) {
        super(x,y);
        this.diodeDirection=1;
        this.setPinCount();
    }
    getDumpClass():Function { return SevenSegElm; }
}
export class SevenSegCommonAnodeElm extends SevenSegElm {
    constructor(x:number,y:number) {
        super(x,y);
        this.diodeDirection=-1;
        this.setPinCount();
    }
    getDumpClass():Function { return SevenSegElm; }
}
