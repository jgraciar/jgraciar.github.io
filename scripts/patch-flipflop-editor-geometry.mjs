import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];assert(dir);
for(const name of ['DFlipFlopElm','TFlipFlopElm','JKFlipFlopElm','RSGenericElm']){
 const path=join(dir,name+'.ts');let s=readFileSync(path,'utf8');
 assert((s.match(/this\.sizeX\s*=\s*this\.jgrAsyncMode\(\)\?3:2;/g)||[]).length===1,name+': geometry anchor');
 s=s.replace(/this\.sizeX\s*=\s*this\.jgrAsyncMode\(\)\?3:2;/,`// Mark pre-fix asynchronous symbols without moving their connected posts.
    if(this.jgrAsyncMode()&&!(this.flags&(1<<17)))this.flags|=1<<18;
    if(this.jgrAsyncMode())this.flags|=1<<17;
    this.sizeX = 2;`);
 const setup=s.indexOf(name==='RSGenericElm'?'  setupPins():':'    setupPins():');
 assert(setup>0,name+': setup anchor');
 s=s.slice(0,setup)+`    setPoints(): void {
        super.setPoints();
        if(!(this.flags&(1<<18)))return;
        // Old files used a three-column body. Keep their electrical post positions,
        // while drawing the compact body, labels and pin stubs at two columns.
        this.sizeX=3;super.setPoints();
        const posts=this.pins.map(pin=>({x:pin.post.x,y:pin.post.y}));
        this.sizeX=2;super.setPoints();
        this.pins.forEach((pin,i)=>{pin.post.x=posts[i].x;pin.post.y=posts[i].y;});
    }
`+s.slice(setup);
 if(name!=='RSGenericElm'){
  const start=s.indexOf('    getChipEditInfo(n: number): EditInfo | null {'),end=s.lastIndexOf('}');
  assert(start>0&&end>start,name+': editor anchor');
  const clear=name==='DFlipFlopElm'?`${name}.FLAG_RESET|${name}.FLAG_SET|${name}.FLAG_INVERT_SET_RESET`:name==='TFlipFlopElm'?`${name}.FLAG_RESET|${name}.FLAG_SET`:`${name}.FLAG_RESET|${name}.FLAG_INVERT_RESET`;
  const timing=name==='JKFlipFlopElm'?`
            this.flags=(this.flags&~JKFlipFlopElm.FLAG_TIMING_MASK)|(mode<<8)|JKFlipFlopElm.FLAG_TIMING_EXPLICIT;
            if(mode===0)this.flags|=JKFlipFlopElm.FLAG_POSITIVE_EDGE;
            if(mode===1)this.flags&=~JKFlipFlopElm.FLAG_POSITIVE_EDGE;
            this.levelToggled=false;`:`
            this.flags=(this.flags&~${name}.FLAG_TIMING_MASK)|(mode<<8);`+(name==='TFlipFlopElm'?'\n            this.levelToggled=false;':'');
  s=s.slice(0,start)+`    getChipEditInfo(n: number): EditInfo | null {
        if(n===0){
            const ei=new EditInfo("Operating Mode",0,-1,-1);
            ei.choice=new Choice();
            ["Rising edge","Falling edge","High level","Low level"].forEach(label=>ei.choice!.add(label));
            ei.choice.select(this.timingMode());return ei;
        }
        if(n===1)return jgrAsyncEditInfo(this.jgrAsyncMode());
        return super.getChipEditInfo(n);
    }
    setChipEditValue(n: number, ei: EditInfo): void {
        if(n===0){
            const mode=ei.choice!.getSelectedIndex();${timing}
            this.setupPins();this.setPoints();return;
        }
        if(n===1){
            // Only the paired selector creates/removes asynchronous terminals.
            // Legacy flags remain readable until the user explicitly edits this selector.
            this.flags=(this.flags&~(JGR_ASYNC_MASK|${clear}))|(ei.choice!.getSelectedIndex()<<15)|(1<<17);
            this.setupPins();this.allocNodes();this.setPoints();ei.newDialog=true;return;
        }
        super.setChipEditValue(n,ei);
    }
`+s.slice(end);
 }
 if(name==='RSGenericElm')s=s.replace('(ei.choice!.getSelectedIndex()<<15);','(ei.choice!.getSelectedIndex()<<15)|(1<<17);');
 writeFileSync(path,s);
}
console.log('OK: fixed-size generic flip-flops, one timing selector and one asynchronous-input selector');
