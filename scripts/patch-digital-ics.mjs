// SPDX-License-Identifier: GPL-3.0-or-later
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digitalICs,digitalICParts} from './LabDigitalIC.ts';
const dir=process.argv[2],here=dirname(fileURLToPath(import.meta.url));
if(!dir)throw Error('Usage: patch-digital-ics.mjs <CircuitJS ts directory>');
const once=(file,anchor,replacement)=>{const p=join(dir,file),s=readFileSync(p,'utf8');if(s.split(anchor).length!==2)throw Error('Digital IC anchor: '+file);writeFileSync(p,s.replace(anchor,replacement));};
for(const name of ['LabDigitalIC.ts','LabDigitalMSI.ts','DigitalICElm.ts','DigitalICMenuLabels.ts','SevenSegPresets.ts','SevenSegMenuLabels.ts'])copyFileSync(join(here,name),join(dir,name));
once('registerElements.ts','import { SevenSegElm } from "./SevenSegElm";',
 'import { SevenSegElm } from "./SevenSegElm";\nimport {SevenSegCommonCathodeElm,SevenSegCommonAnodeElm} from "./SevenSegPresets";');
once('registerElements.ts','    ElementFactory.registerClass("SevenSegElm", SevenSegElm as any);',
 '    ElementFactory.registerClass("SevenSegElm", SevenSegElm as any);\n    ElementFactory.registerClass("SevenSegCommonCathodeElm", SevenSegCommonCathodeElm as any);\n    ElementFactory.registerClass("SevenSegCommonAnodeElm", SevenSegCommonAnodeElm as any);');
// Fixed text-dump identifiers; append new parts without renumbering existing ones.
const types=['4001','4011','4012','4023','4027','4043','4044','4069','4070','4071','4081','4082','7400','7402','7404','7408','7414','7420','7432','7476','7476N','7486','40106','74112','74373','74194','74190','7447','74192','7430','74147','74151','54151','74152','74150','74138','7475','74181','74164','74165','74168','74189'];
const classes=types.map((part,i)=>`export class IC${part}Elm extends DigitalICElm {part():string{return '${part}';} getDumpType():number{return ${1600+i};}}`).join('\n');
writeFileSync(join(dir,'DigitalICPackages.ts'),`// SPDX-License-Identifier: GPL-3.0-or-later\nimport {DigitalICElm} from './DigitalICElm';\n${classes}\n`);
once('registerElements.ts','import { CounterElm } from "./CounterElm";',`import { CounterElm } from "./CounterElm";\nimport {${types.map(p=>'IC'+p+'Elm').join(',')}} from './DigitalICPackages';`);
once('registerElements.ts','    ElementFactory.registerClass("CounterElm", CounterElm as any);',
 '    ElementFactory.registerClass("CounterElm", CounterElm as any);\n'+types.map(p=>`    ElementFactory.registerClass('IC${p}Elm', IC${p}Elm as any);`).join('\n'));
once('registerElements.ts','    CirSim.theApp.register("CounterElm", new CounterElm(0, 0));',
 '    CirSim.theApp.register("CounterElm", new CounterElm(0, 0));\n'+types.map(p=>`    CirSim.theApp.register('IC${p}Elm', new IC${p}Elm(0,0));`).join('\n'));
const gateKeys={AND:'Add AND Gate',NAND:'Add NAND Gate',OR:'Add OR Gate',NOR:'Add NOR Gate',XOR:'Add XOR Gate',NOT:'Add Inverter',SCHMITT:'Add Schmitt Trigger (Inverting)'};
const entries=digitalICParts.map(part=>{
 const d=digitalICs[part];let text;
 if(d.msi)text=`digitalICName('${part}', ${JSON.stringify(d.msi.name)}, Locale.activeLanguage)`;
 else if(d.gates.length){const g=d.gates[0],key=JSON.stringify(gateKeys[g.kind]);
  text=`${JSON.stringify(part+' '+d.gates.length+' × ')} + circuitJsDrawLabel(${key}, Locale.LS(${key}), Locale.activeLanguage) + ${JSON.stringify(' ('+g.inputs.length+'→1)')}`;
 }else if(d.jk)text=`${JSON.stringify(part+' 2 × ')} + circuitJsDrawLabel("Add JK Flip-Flop", Locale.LS("Add JK Flip-Flop"), Locale.activeLanguage)`;
 else text=JSON.stringify(part+' 4 × RS ('+(d.mode==='rs-nor'?'NOR':'NAND')+', Z)');
 return {part,group:d.msi?.group||(d.gates.length?(d.gates[0].kind==='SCHMITT'?'schmitt':'gate'):'latch'),entry:`            ${text}, "IC${part}Elm",`};
});
// Regroup existing commands without changing their saved shortcut identifiers.
const menuPath=join(dir,'Menus.ts');let menu=readFileSync(menuPath,'utf8');
const start=menu.indexOf('        const chipMenu = new Menu(this.app);'),end=menu.indexOf('        const achipMenu = new Menu(this.app);',start);
if(start<0||end<0)throw Error('Digital chip menu anchors');
const original=menu.slice(start,end),generic={latch:['DFlipFlopElm','JKFlipFlopElm','TFlipFlopElm','LatchElm'],register:['SipoShiftElm','PisoShiftElm'],counter:['CounterElm','CD4026Elm','Counter7493Elm','Counter74191Elm','Counter2Elm','DecadeElm'],codec:['SevenSegDecoderElm'],mux:['MultiplexerElm','DeMultiplexerElm'],memory:['FullAdderElm','HalfAdderElm','SRAMElm','ROMElm'],other:['SevenSegElm','SeqGenElm','UserDefinedLogicElm','BusTransceiverElm','BusSplitterElm']};
const lines=[...original.matchAll(/^.*"Add [^"\n]+",\s*"([^"\n]+Elm)".*$/gm)].map(m=>({line:m[0],name:m[1]}));
if(lines.length!==Object.values(generic).flat().length)throw Error('Unexpected generic digital commands: '+lines.length);
const groups=['gate','schmitt','latch','register','counter','codec','mux','memory','other'];
let grouped='        const chipMenu = new Menu(this.app);\n';
for(const group of groups){
 grouped+=`        const digital_${group} = new Menu(this.app);\n        this.makeClassCheckItems(digital_${group}, [\n`;
 grouped+=entries.filter(e=>e.group===group).map(e=>e.entry).join('\n')+'\n';
 grouped+=lines.filter(e=>(generic[group]||[]).includes(e.name)).map(e=>e.line+(e.name==='SevenSegElm'?
  '\n            "Add 7 Segment LED (common cathode)", "SevenSegCommonCathodeElm",\n            "Add 7 Segment LED (common anode)", "SevenSegCommonAnodeElm",':'')).join('\n')+'\n';
 grouped+=`        ]);\n        chipMenu.addSubmenu(digitalICGroup('${group}', Locale.activeLanguage), digital_${group});\n`;
}
grouped+='        menu.addSubmenu(subheadHtml + Locale.LS("Digital Chips"), chipMenu);\n\n';
menu=menu.slice(0,start)+grouped+menu.slice(end);
menu="import {digitalICGroup,digitalICName} from './DigitalICMenuLabels';\n"+menu;
writeFileSync(menuPath,menu);
console.log('OK: '+types.length+' powered digital packages, nine grouped submenus, Schmitt ICs separated from generic trigger, stable dump IDs');
