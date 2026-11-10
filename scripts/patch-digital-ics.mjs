// SPDX-License-Identifier: GPL-3.0-or-later
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {digitalICs,digitalICParts} from './LabDigitalIC.ts';
const dir=process.argv[2],here=dirname(fileURLToPath(import.meta.url));
if(!dir)throw Error('Usage: patch-digital-ics.mjs <CircuitJS ts directory>');
const once=(file,anchor,replacement)=>{const p=join(dir,file),s=readFileSync(p,'utf8');if(s.split(anchor).length!==2)throw Error('Digital IC anchor: '+file);writeFileSync(p,s.replace(anchor,replacement));};
for(const name of ['LabDigitalIC.ts','DigitalICElm.ts'])copyFileSync(join(here,name),join(dir,name));
// Fixed text-dump identifiers; append new parts without renumbering existing ones.
const types=['4001','4011','4012','4023','4027','4043','4044','4069','4070','4071','4081','4082','7400','7402','7404','7408','7414','7420','7432','7476','7476N','7486','40106','74112'];
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
 if(d.gates.length){const g=d.gates[0],key=JSON.stringify(gateKeys[g.kind]);
  text=`${JSON.stringify(part+' '+d.gates.length+' × ')} + circuitJsDrawLabel(${key}, Locale.LS(${key}), Locale.activeLanguage) + ${JSON.stringify(' ('+g.inputs.length+'→1)')}`;
 }else if(d.jk)text=`${JSON.stringify(part+' 2 × ')} + circuitJsDrawLabel("Add JK Flip-Flop", Locale.LS("Add JK Flip-Flop"), Locale.activeLanguage)`;
 else text=JSON.stringify(part+' 4 × RS ('+(d.mode==='rs-nor'?'NOR':'NAND')+', Z)');
 return `            ${text}, "IC${part}Elm",`;
});
once('Menus.ts','            "Add D Flip-Flop",          "DFlipFlopElm",',entries.join('\n')+'\n            "Add D Flip-Flop",          "DFlipFlopElm",');
console.log('OK: 24 powered digital packages registered, numbered DIP pins and translated number-first menu');
