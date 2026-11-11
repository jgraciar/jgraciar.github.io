// SPDX-License-Identifier: GPL-3.0-or-later
// Configuración asíncrona independiente del flanco/nivel en RS, D, T y JK.
// Se ejecuta después de patch-generic-sequential.mjs.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=process.argv[2];
assert(dir,'Uso: patch-async-flipflops.mjs <ts directory>');
const here=dirname(fileURLToPath(import.meta.url));
copyFileSync(join(here,'JgrAsyncControls.ts'),join(dir,'JgrAsyncControls.ts'));
function once(file,from,to){
 const path=join(dir,file),source=readFileSync(path,'utf8');
 assert(source.split(from).length===2,'Se esperaba un anclaje en '+file+': '+from.slice(0,110));
 writeFileSync(path,source.replace(from,to));
}
const helper='import {jgrAsyncMode,jgrAsyncCount,jgrCreateAsyncPins,jgrAsyncState,jgrAsyncEditInfo,JGR_ASYNC_MASK} from "./JgrAsyncControls";';
for(const cls of ['DFlipFlopElm','TFlipFlopElm','JKFlipFlopElm']){
 once(cls+'.ts','import { Choice } from "./Choice";','import { Choice } from "./Choice";\n'+helper);
}
once('RSGenericElm.ts','import {Choice} from "./Choice";','import {Choice} from "./Choice";\n'+helper);

// ChipElm conoce una etiqueta exterior opcional, usada sólo en los dos
// contactos asíncronos. Se conserva el dibujo de reloj y demás patillas.
once('ChipElm.ts','    clock: boolean = false;','    clock: boolean = false;\n    jgrExternalLabel: string | null = null;');
once('ChipElm.ts','            if (p.lineOver) {\n                    const ya = p.textloc.y - asc + asc / 3;\n                    g.drawLine(tx, ya, tx + sw, ya);\n                }\n                break;',
'            if (p.lineOver) {\n                    const ya = p.textloc.y - asc + asc / 3;\n                    g.drawLine(tx, ya, tx + sw, ya);\n                }\n                break;');
// El dibujo se añade después del bucle de texto, siempre con el mismo
// contexto gráfico; queda por fuera del encapsulado y no tapa CLK ni Q.
once('ChipElm.ts','        }\n        this.drawLabel(g, this.labelX, this.labelY);',
'            if (p.jgrExternalLabel != null) {\n                g.setFont(new Font("normal", 0, 9 * this.csize));\n                const label = p.jgrExternalLabel;\n                const width = g.context.measureText(label).width;\n                const y = p.side === ChipElm.SIDE_N ? p.post.y - 4 * this.csize :\n                          p.side === ChipElm.SIDE_S ? p.post.y + 12 * this.csize :\n                          p.post.y + 4 * this.csize;\n                g.drawString(label, p.post.x - width / 2, y);\n            }\n        }\n        this.drawLabel(g, this.labelX, this.labelY);');

// La leyenda CLK se conserva incluso cuando el modo sea de nivel.
// No modificar la geometría ni el estado de los pines de reloj heredados.
once('DFlipFlopElm.ts','new Pin(this, 1, ChipElm.SIDE_W, "");','new Pin(this, 1, ChipElm.SIDE_W, "CLK");');
once('TFlipFlopElm.ts','new Pin(this, 1, ChipElm.SIDE_W, "");','new Pin(this, 1, ChipElm.SIDE_W, "CLK");');
once('JKFlipFlopElm.ts','new Pin(this, 1, ChipElm.SIDE_W, "");','new Pin(this, 1, ChipElm.SIDE_W, "CLK");');
once('RSGenericElm.ts','mode<4?"E":""','"CLK"');

// D: las banderas heredadas de Set/Reset siguen siendo importables; la nueva
// pareja superior/inferior es independiente y opcional.
once('DFlipFlopElm.ts','    getChipName(): string { return "D flip-flop"; }',
'    jgrAsyncMode(): number { return jgrAsyncMode(this.flags); }\n    jgrAsyncStart(): number { return 4+(this.hasReset()?1:0)+(this.hasSet()?1:0); }\n    getChipName(): string { return "D flip-flop"; }');
once('DFlipFlopElm.ts','        this.sizeX = 2;','        this.sizeX = this.jgrAsyncMode()?3:2;');
once('DFlipFlopElm.ts','        }\n    }\n\n    getPostCount(): number {',
'        }\n        jgrCreateAsyncPins(this,this.pins,this.jgrAsyncStart(),this.jgrAsyncMode());\n    }\n\n    getPostCount(): number {');
once('DFlipFlopElm.ts','return 4 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0);',
'return 4 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0) + jgrAsyncCount(this.flags);');
once('DFlipFlopElm.ts','    execute(): void {\n        let isSet',
'    execute(): void {\n        const state=jgrAsyncState(this.pins,this.jgrAsyncStart(),this.jgrAsyncMode());\n        if(state>=0){\n            this.writeOutput(1,state===1);\n            this.writeOutput(2,state===0);\n            this.lastClock=this.pins[3].value;\n            return;\n        }\n        let isSet');
once('DFlipFlopElm.ts','    getChipEditInfo(n: number): EditInfo | null {\n',
'    getChipEditInfo(n: number): EditInfo | null {\n        if(n===4)return jgrAsyncEditInfo(this.jgrAsyncMode());\n');
once('DFlipFlopElm.ts','    setChipEditValue(n: number, ei: EditInfo): void {\n',
'    setChipEditValue(n: number, ei: EditInfo): void {\n        if(n===4){\n            this.flags=(this.flags&~JGR_ASYNC_MASK)|(ei.choice!.getSelectedIndex()<<15);\n            if(this.jgrAsyncMode())this.flags&=~(DFlipFlopElm.FLAG_SET|DFlipFlopElm.FLAG_RESET);\n            this.setupPins();this.allocNodes();this.setPoints();ei.newDialog=true;return;\n        }\n');

// T
once('TFlipFlopElm.ts','    getChipName(): string { return "T flip-flop"; }',
'    jgrAsyncMode(): number { return jgrAsyncMode(this.flags); }\n    jgrAsyncStart(): number { return 4+(this.hasReset()?1:0)+(this.hasSet()?1:0); }\n    getChipName(): string { return "T flip-flop"; }');
once('TFlipFlopElm.ts','        this.sizeX = 2;','        this.sizeX = this.jgrAsyncMode()?3:2;');
once('TFlipFlopElm.ts','        }\n    }\n    getPostCount(): number {',
'        }\n        jgrCreateAsyncPins(this,this.pins,this.jgrAsyncStart(),this.jgrAsyncMode());\n    }\n    getPostCount(): number {');
once('TFlipFlopElm.ts','return 4 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0);',
'return 4 + (this.hasReset() ? 1 : 0) + (this.hasSet() ? 1 : 0) + jgrAsyncCount(this.flags);');
once('TFlipFlopElm.ts','    execute(): void {\n        const clk=',
'    execute(): void {\n        const state=jgrAsyncState(this.pins,this.jgrAsyncStart(),this.jgrAsyncMode());\n        if(state>=0){\n            this.pins[1].value=state===1;\n            this.pins[2].value=state===0;\n            this.lastClock=this.pins[3].value;\n            this.levelToggled=false;return;\n        }\n        const clk=');
once('TFlipFlopElm.ts','    getChipEditInfo(n: number): EditInfo | null {\n',
'    getChipEditInfo(n: number): EditInfo | null {\n        if(n===3)return jgrAsyncEditInfo(this.jgrAsyncMode());\n');
once('TFlipFlopElm.ts','    setChipEditValue(n: number, ei: EditInfo): void {\n',
'    setChipEditValue(n: number, ei: EditInfo): void {\n        if(n===3){\n            this.flags=(this.flags&~JGR_ASYNC_MASK)|(ei.choice!.getSelectedIndex()<<15);\n            if(this.jgrAsyncMode())this.flags&=~(TFlipFlopElm.FLAG_SET|TFlipFlopElm.FLAG_RESET);\n            this.setupPins();this.allocNodes();this.setPoints();ei.newDialog=true;return;\n        }\n');

// JK
once('JKFlipFlopElm.ts','    getChipName(): string { return "JK flip-flop"; }',
'    jgrAsyncMode(): number { return jgrAsyncMode(this.flags); }\n    jgrAsyncStart(): number { return 5+(this.hasReset()?1:0); }\n    getChipName(): string { return "JK flip-flop"; }');
once('JKFlipFlopElm.ts','        this.sizeX = 2;','        this.sizeX = this.jgrAsyncMode()?3:2;');
once('JKFlipFlopElm.ts','        }\n    }\n\n    getPostCount():',
'        }\n        jgrCreateAsyncPins(this,this.pins,this.jgrAsyncStart(),this.jgrAsyncMode());\n    }\n\n    getPostCount():');
once('JKFlipFlopElm.ts','return 5 + (this.hasReset() ? 1 : 0);',
'return 5 + (this.hasReset() ? 1 : 0) + jgrAsyncCount(this.flags);');
once('JKFlipFlopElm.ts','    execute(): void {\n        const clk=',
'    execute(): void {\n        const state=jgrAsyncState(this.pins,this.jgrAsyncStart(),this.jgrAsyncMode());\n        if(state>=0){\n            this.writeOutput(3,state===1);\n            this.writeOutput(4,state===0);\n            this.lastClock=this.pins[1].value;\n            this.levelToggled=false;return;\n        }\n        const clk=');
once('JKFlipFlopElm.ts','    getChipEditInfo(n: number): EditInfo | null {\n',
'    getChipEditInfo(n: number): EditInfo | null {\n        if(n===3)return jgrAsyncEditInfo(this.jgrAsyncMode());\n');
once('JKFlipFlopElm.ts','    setChipEditValue(n: number, ei: EditInfo): void {\n',
'    setChipEditValue(n: number, ei: EditInfo): void {\n        if(n===3){\n            this.flags=(this.flags&~JGR_ASYNC_MASK)|(ei.choice!.getSelectedIndex()<<15);\n            if(this.jgrAsyncMode())this.flags&=~JKFlipFlopElm.FLAG_RESET;\n            this.setupPins();this.allocNodes();this.setPoints();ei.newDialog=true;return;\n        }\n');

// RS: las variantes totalmente asíncronas (modes 0 y 1) no incorporan CLK
// ni una segunda pareja de entradas. Las demás aceptan PRE/CLR externos.
once('RSGenericElm.ts','  getChipName():string{return "RS flip-flop";}',
'  jgrAsyncMode():number{return this.mode()>=2?jgrAsyncMode(this.flags):0;}\n  jgrAsyncStart():number{return 5;}\n  getChipName():string{return "RS flip-flop";}');
once('RSGenericElm.ts','  getPostCount():number{return this.mode()<2?4:5;}',
'  getPostCount():number{return this.mode()<2?4:5+jgrAsyncCount(this.flags);}');
once('RSGenericElm.ts','    this.sizeX=2;this.sizeY=3;',
'    this.sizeX=this.jgrAsyncMode()?3:2;this.sizeY=3;');
once('RSGenericElm.ts','    }\n  }\n  reset():void',
'    }\n    if(mode>=2)jgrCreateAsyncPins(this,this.pins,5,this.jgrAsyncMode());\n  }\n  reset():void');
once('RSGenericElm.ts','  execute():void {\n    const mode=',
'  execute():void {\n    const state=jgrAsyncState(this.pins,5,this.jgrAsyncMode());\n    if(state>=0){\n      this.pins[1].value=state===1;\n      this.pins[2].value=state===0;\n      this.lastClock=this.pins[4].value;return;\n    }\n    const mode=');
once('RSGenericElm.ts','  getChipEditInfo(n:number):EditInfo|null{\n',
'  getChipEditInfo(n:number):EditInfo|null{\n    if(n===1&&this.mode()>=2)return jgrAsyncEditInfo(this.jgrAsyncMode());\n');
once('RSGenericElm.ts','  setChipEditValue(n:number,ei:EditInfo):void {\n',
'  setChipEditValue(n:number,ei:EditInfo):void {\n    if(n===1&&this.mode()>=2){\n      this.flags=(this.flags&~JGR_ASYNC_MASK)|(ei.choice!.getSelectedIndex()<<15);\n      this.setupPins();this.allocNodes();this.setPoints();ei.newDialog=true;return;\n    }\n');

// Traducción de los nuevos controles.
const es=join(dir,'public/locale/locale_es.txt');
writeFileSync(es,readFileSync(es,'utf8')+'\n'+[
 '"Asynchronous SET/RESET"="Entradas asíncronas de SET/RESET"',
 '"None"="Ninguna"',
 '"SET / RESET (active low)"="SET / RESET (activas a nivel bajo)"',
 '"PR / CLR (active low)"="PR / CLR (activas a nivel bajo)"'
].join('\n')+'\n');
console.log('OK: CLK en los biestables y pares SET/RESET o PR/CLR asíncronos, activos bajos, superior e inferior.');
