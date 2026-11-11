// SPDX-License-Identifier: GPL-3.0-or-later
import {readFileSync,writeFileSync,copyFileSync} from "node:fs";
import {join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
const dir=process.argv[2],here=dirname(fileURLToPath(import.meta.url));
if(!dir)throw Error("Usage: patch-generic-sequential.mjs <upstream-ts-directory>");
function once(name,from,to){
  const p=join(dir,name),s=readFileSync(p,"utf8"),parts=s.split(from);
  if(parts.length!==2)throw Error("Anchor missing or duplicated "+name+": "+from.slice(0,90));
  writeFileSync(p,parts.join(to));
}
function region(name,start,end,replacement){
  const p=join(dir,name),s=readFileSync(p,"utf8"),a=s.indexOf(start),b=s.indexOf(end,a+start.length);
  if(a<0||b<0||s.indexOf(start,a+1)>=0)throw Error("Region invalid "+name+" "+start);
  writeFileSync(p,s.slice(0,a)+replacement+s.slice(b));
}
for(const name of ["RSGenericElm.ts","BinaryToBCD4Elm.ts","SevenSegNumericElm.ts"])
  copyFileSync(join(here,name),join(dir,name));
const dropdown=[
  '    const ei=new EditInfo("Operating Mode",0,-1,-1);',
  '    ei.choice=new Choice();',
  '    ["Rising edge","Falling edge","High level","Low level"].forEach(s=>ei.choice!.add(s));',
  '    ei.choice.select(this.timingMode());return ei;'
].join("\n");
for(const name of ["DFlipFlopElm.ts","TFlipFlopElm.ts","JKFlipFlopElm.ts"])
  once(name,'import { Checkbox } from "./Checkbox";',
    'import { Checkbox } from "./Checkbox";\nimport { Choice } from "./Choice";');
once("DFlipFlopElm.ts","    static readonly FLAG_INVERT_SET_RESET = 8;",[
"    static readonly FLAG_INVERT_SET_RESET = 8;",
"    static readonly FLAG_TIMING_MASK = 3 << 8;",
"    timingMode(): number { return (this.flags & DFlipFlopElm.FLAG_TIMING_MASK) >> 8; }",
"    shouldLoad(clock: boolean): boolean {",
"      const mode=this.timingMode();",
"      return mode===0 ? clock&&!this.lastClock : mode===1 ? !clock&&this.lastClock :",
"        mode===2 ? clock : !clock;",
"    }"].join("\n"));
once("DFlipFlopElm.ts","        this.pins[3].clock = true;",
["        this.pins[3].clock = this.timingMode() < 2;",
 "        this.pins[3].bubble = this.timingMode()===1 || this.timingMode()===3;"].join("\n"));
once("DFlipFlopElm.ts","            if (this.pins[3].value && !this.lastClock)",
 "            if (this.shouldLoad(this.pins[3].value))");
once("DFlipFlopElm.ts","    getChipEditInfo(n: number): EditInfo | null {\n",
 "    getChipEditInfo(n: number): EditInfo | null {\n        if(n===3){\n"+dropdown+"\n        }\n");
once("DFlipFlopElm.ts","    setChipEditValue(n: number, ei: EditInfo): void {\n",
 ["    setChipEditValue(n: number, ei: EditInfo): void {",
  "        if(n===3){",
  "          this.flags=(this.flags&~DFlipFlopElm.FLAG_TIMING_MASK)|(ei.choice!.getSelectedIndex()<<8);",
  "          this.setupPins();this.setPoints();return;",
  "        }",""].join("\n"));
once("TFlipFlopElm.ts","    static readonly FLAG_SET = 4;",[
 "    static readonly FLAG_SET = 4;",
 "    static readonly FLAG_TIMING_MASK = 3 << 8;",
 "    levelToggled: boolean = false;",
 "    timingMode(): number { return (this.flags&TFlipFlopElm.FLAG_TIMING_MASK)>>8; }"].join("\n"));
once("TFlipFlopElm.ts","        this.pins[3].clock = true;",
 ["        this.pins[3].clock = this.timingMode() < 2;",
 "        this.pins[3].bubble = this.timingMode()===1 || this.timingMode()===3;"].join("\n"));
const tOldReset=[
"    reset(): void {",
"        super.reset();",
"        this.pins[2].value = true;",
"    }",""].join("\n");
once("TFlipFlopElm.ts",tOldReset,"");
region("TFlipFlopElm.ts","    execute(): void {","    getDumpType(): number",[
"    execute(): void {",
"        const clk=this.pins[3].value,mode=this.timingMode();",
"        const edge=mode===0?clk&&!this.lastClock:mode===1?!clk&&this.lastClock:false;",
"        if(edge && this.pins[0].value)this.pins[1].value=!this.pins[1].value;",
"        if(mode>=2){",
"          const enabled=mode===2?clk:!clk;",
"          if(!enabled)this.levelToggled=false;",
"          else if(this.pins[0].value&&!this.levelToggled){",
"            // Evita una oscilacion indeterminada por realimentacion en T=1.",
"            this.pins[1].value=!this.pins[1].value;this.levelToggled=true;",
"          }",
"        }else this.levelToggled=false;",
"        if(this.hasSet()&&this.pins[5].value)this.pins[1].value=true;",
"        if(this.hasReset()&&this.pins[4].value)this.pins[1].value=false;",
"        this.pins[2].value=!this.pins[1].value;",
"        this.lastClock=clk;",
"    }",
"    reset(): void { super.reset();this.pins[2].value=true;this.levelToggled=false; }",""].join("\n"));
once("TFlipFlopElm.ts","    getChipEditInfo(n: number): EditInfo | null {\n",
 "    getChipEditInfo(n: number): EditInfo | null {\n        if(n===2){\n"+dropdown+"\n        }\n");
once("TFlipFlopElm.ts","    setChipEditValue(n: number, ei: EditInfo): void {\n",[
  "    setChipEditValue(n: number, ei: EditInfo): void {",
  "        if(n===2){",
  "          this.flags=(this.flags&~TFlipFlopElm.FLAG_TIMING_MASK)|(ei.choice!.getSelectedIndex()<<8);",
  "          this.levelToggled=false;this.setupPins();this.setPoints();return;",
  "        }",""].join("\n"));
once("JKFlipFlopElm.ts","    static readonly FLAG_INVERT_RESET  = 8;",[
"    static readonly FLAG_INVERT_RESET  = 8;",
"    static readonly FLAG_TIMING_MASK = 3 << 8;",
"    static readonly FLAG_TIMING_EXPLICIT = 1 << 14;",
"    levelToggled: boolean = false;",
"    timingMode():number{",
"      return (this.flags&JKFlipFlopElm.FLAG_TIMING_EXPLICIT)",
"        ?(this.flags&JKFlipFlopElm.FLAG_TIMING_MASK)>>8",
"        :(this.positiveEdgeTriggered()?0:1);",
"    }"].join("\n"));
once("JKFlipFlopElm.ts","        this.pins[1].clock  = true;\n        this.pins[1].bubble = !this.positiveEdgeTriggered();",
 ["        this.pins[1].clock = this.timingMode()<2;",
 "        this.pins[1].bubble = this.timingMode()===1||this.timingMode()===3;"].join("\n"));
region("JKFlipFlopElm.ts","    execute(): void {","    getDumpType(): number",[
"    execute(): void {",
"        const clk=this.pins[1].value,mode=this.timingMode(),j=this.pins[0].value,k=this.pins[2].value;",
"        const edge=mode===0?clk&&!this.lastClock:mode===1?!clk&&this.lastClock:false;",
"        const enabled=mode===2?clk:mode===3?!clk:false;",
"        let next=this.pins[3].value;",
"        if(edge){",
"          if(j)next=k?!next:true;else if(k)next=false;",
"        }else if(mode>=2){",
"          if(!enabled)this.levelToggled=false;",
"          else if(j&&k){if(!this.levelToggled){next=!next;this.levelToggled=true;}}",
"          else {this.levelToggled=false;if(j)next=true;else if(k)next=false;}",
"        }else this.levelToggled=false;",
"        if(this.hasReset()&&this.pins[5].value!==this.invertReset())next=false;",
"        this.writeOutput(3,next);this.writeOutput(4,!next);",
"        this.lastClock=clk;",
"    }",
"    reset(): void {super.reset();this.levelToggled=false;this.pins[4].value=true;}",""].join("\n"));
once("JKFlipFlopElm.ts",'            return EditInfo.createCheckbox("Positive Edge Triggered", this.positiveEdgeTriggered());',
  "            {\n"+dropdown+"\n            }");
once("JKFlipFlopElm.ts",[
"        if (n === 1) {",
"            this.flags = ei.changeFlag(this.flags, JKFlipFlopElm.FLAG_POSITIVE_EDGE);",
"            this.pins[1].bubble = !this.positiveEdgeTriggered();",
"        }"].join("\n"),[
"        if (n === 1) {",
"            const mode=ei.choice!.getSelectedIndex();",
"            this.flags=(this.flags&~JKFlipFlopElm.FLAG_TIMING_MASK)|(mode<<8)|JKFlipFlopElm.FLAG_TIMING_EXPLICIT;",
"            if(mode===0)this.flags|=JKFlipFlopElm.FLAG_POSITIVE_EDGE;",
"            if(mode===1)this.flags&=~JKFlipFlopElm.FLAG_POSITIVE_EDGE;",
"            this.levelToggled=false;this.setupPins();this.setPoints();",
"        }"].join("\n"));
const imports=["RSGenericElm","BinaryToBCD4Elm","SevenSegNumericElm"];
once("registerElements.ts",'import { DFlipFlopElm } from "./DFlipFlopElm";',
 'import { DFlipFlopElm } from "./DFlipFlopElm";\n'+imports.map(n=>'import { '+n+' } from "./'+n+'";').join("\n"));
once("registerElements.ts",'    ElementFactory.registerClass("DFlipFlopElm", DFlipFlopElm as any);',
 '    ElementFactory.registerClass("DFlipFlopElm", DFlipFlopElm as any);\n'+
 imports.map(n=>'    ElementFactory.registerClass("'+n+'", '+n+' as any);').join("\n"));
once("registerElements.ts",'    CirSim.theApp.register("DFlipFlopElm", new DFlipFlopElm(0, 0));',
 '    CirSim.theApp.register("DFlipFlopElm", new DFlipFlopElm(0, 0));\n'+
 imports.map(n=>'    CirSim.theApp.register("'+n+'", new '+n+'(0, 0));').join("\n"));
once("Menus.ts",'"Add D Flip-Flop",          "DFlipFlopElm",',
 '"Add D Flip-Flop",          "DFlipFlopElm",\n            "Add RS Flip-Flop",         "RSGenericElm",');
once("Menus.ts",'"Add 7 Segment Decoder",    "SevenSegDecoderElm",',
 '"Add 7 Segment Decoder",    "SevenSegDecoderElm",\n            "Add 4-bit Binary to BCD", "BinaryToBCD4Elm",\n            "Add 7-Segment Numeric Reader", "SevenSegNumericElm",');
const es=join(dir,"public/locale/locale_es.txt");
const translations=[
 ['Add RS Flip-Flop','Añadir biestable RS genérico'],
 ['Add 4-bit Binary to BCD','Añadir convertidor binario de 4 bits a BCD'],
 ['Add 7-Segment Numeric Reader','Añadir lector numérico de siete segmentos'],
 ['Operating Mode','Modo de funcionamiento'],['Rising edge','Flanco ascendente'],
 ['Falling edge','Flanco descendente'],['High level','Nivel alto'],['Low level','Nivel bajo'],
 ['Asynchronous (active high)','Asíncrono (activo a nivel alto)'],
 ['Asynchronous (active low)','Asíncrono (activo a nivel bajo)']
];
writeFileSync(es,readFileSync(es,"utf8")+"\n"+translations.map(([a,b])=>'"'+a+'"="'+b+'"').join("\n")+"\n");
console.log("OK: RS, JK, D, T configurables; binario a BCD y lectura a-g");
