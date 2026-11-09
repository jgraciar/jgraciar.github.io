// SPDX-License-Identifier: GPL-3.0-or-later
// Behavioural CD4026B; TI SCHS031B. Bit 0=a ... bit 6=g.
export const CD4026_SEGMENTS = [0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7d,0x07,0x7f,0x6f] as const;
export class CD4026State {
    count = 0;
    clock = false;
    gatedClock = false;
    initialized = false;
    reset(): void {
        this.count=0; this.clock=false; this.gatedClock=false; this.initialized=false;
    }
    step(clockVoltage:number,inhibit:boolean,reset:boolean,supply:number):void {
        if(supply<3 || supply>18 || !Number.isFinite(supply)) {
            this.initialized=false;
            return;
        }
        // Nominal behavioural Schmitt thresholds, not guaranteed device limits.
        if(clockVoltage>=0.7*supply)this.clock=true;
        else if(clockVoltage<=0.3*supply)this.clock=false;
        const gated=this.clock&&!inhibit;
        if(reset)this.count=0;
        else if(this.initialized&&gated&&!this.gatedClock)this.count=(this.count+1)%10;
        this.gatedClock=gated;
        this.initialized=true;
    }
    outputs(enabled:boolean):boolean[] {
        const mask=enabled?CD4026_SEGMENTS[this.count]:0;
        return [...Array.from({length:7},(_,i)=>!!(mask&(1<<i))),enabled,this.count<5,this.count!==2];
    }
}
