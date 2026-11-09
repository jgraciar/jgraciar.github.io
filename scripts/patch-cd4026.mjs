// SPDX-License-Identifier: GPL-3.0-or-later
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=process.argv[2];
if(!dir)throw Error('Usage: patch-cd4026.mjs <CircuitJS ts directory>');
const here=dirname(fileURLToPath(import.meta.url));
const replace=(name,from,to)=>{
 const path=join(dir,name),s=readFileSync(path,'utf8');
 if(s.split(from).length!==2)throw Error('Unexpected upstream structure: '+name+' '+from);
 writeFileSync(path,s.replace(from,to));
};
for(const name of ['CD4026Elm.ts','LabCD4026.ts','Counter7493Elm.ts','Counter74191Elm.ts'])copyFileSync(join(here,name),join(dir,name));
replace('registerElements.ts','import { CounterElm } from "./CounterElm";',
 'import { CounterElm } from "./CounterElm";\nimport { CD4026Elm } from "./CD4026Elm";\nimport { Counter7493Elm } from "./Counter7493Elm";\nimport { Counter74191Elm } from "./Counter74191Elm";');
replace('registerElements.ts','    ElementFactory.registerClass("CounterElm", CounterElm as any);',
 '    ElementFactory.registerClass("CounterElm", CounterElm as any);\n    ElementFactory.registerClass("CD4026Elm", CD4026Elm as any);\n    ElementFactory.registerClass("Counter7493Elm", Counter7493Elm as any);\n    ElementFactory.registerClass("Counter74191Elm", Counter74191Elm as any);');
replace('registerElements.ts','    CirSim.theApp.register("CounterElm", new CounterElm(0, 0));',
 '    CirSim.theApp.register("CounterElm", new CounterElm(0, 0));\n    CirSim.theApp.register("CD4026Elm", new CD4026Elm(0, 0));\n    CirSim.theApp.register("Counter7493Elm", new Counter7493Elm(0, 0));\n    CirSim.theApp.register("Counter74191Elm", new Counter74191Elm(0, 0));');
replace('Menus.ts','            "Add Counter",              "CounterElm",',
 '            "Add Counter",              "CounterElm",\n            "Add CD4026 decade counter", "CD4026Elm",\n            "Add 7493 binary counter", "Counter7493Elm",\n            "Add 74191 up/down counter", "Counter74191Elm",');
const list=join(dir,'public/setuplist.txt');
writeFileSync(list,readFileSync(list,'utf8')+'\n+Circuit JGR\ncd4026-practice.xml CD4026: push-button counter and common-cathode display\ncd4026-practice-textbook.xml CD4026: original textbook circuit (47 uF)\n-\n');
copyFileSync(join(here,'../tests/fixtures/cd4026-practice.xml'),join(dir,'public/circuits/cd4026-practice.xml'));
copyFileSync(join(here,'../tests/fixtures/cd4026-practice-textbook.xml'),join(dir,'public/circuits/cd4026-practice-textbook.xml'));
const es=join(dir,'public/locale/locale_es.txt');
writeFileSync(es,readFileSync(es,'utf8')+'\n"Add CD4026 decade counter"="Añadir contador decimal CD4026"\n"CD4026: push-button counter and common-cathode display"="CD4026: contador con pulsador y display de cátodo común"\n"CD4026: original textbook circuit (47 uF)"="CD4026: circuito original del libro (47 µF)"\n');
console.log('CD4026B registered with powered outputs and common-cathode practice');
