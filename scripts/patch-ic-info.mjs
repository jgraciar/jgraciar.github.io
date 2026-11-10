// SPDX-License-Identifier: GPL-3.0-or-later
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=process.argv[2],here=dirname(fileURLToPath(import.meta.url));
if(!dir)throw Error('Usage: patch-ic-info.mjs <ts directory>');
for(const name of ['ICInfoData.ts','ICInfoDiagram.ts','ICInfoLabels.ts','ICInfoDialog.ts','ICInfoController.ts'])copyFileSync(join(here,name),join(dir,name));
function once(file,anchor,replacement){const p=join(dir,file),s=readFileSync(p,'utf8');if(s.split(anchor).length!==2)throw Error('IC information anchor: '+file+' '+anchor.slice(0,45));writeFileSync(p,s.replace(anchor,replacement));}
const originalDoubleClick=readFileSync(join(dir,'MouseManager.ts'),'utf8').match(/    private onDoubleClick\(e: MouseEvent\): void \{[\s\S]*?(?=    private onMouseOut)/)?.[0];
if(!originalDoubleClick)throw Error('Missing native double-click handler');
// The controller has no runtime imports of CircuitElm/ChipElm: avoid core module cycles.
for(const [file,helper]of [['MouseManager.ts','canShowICInfo'],['CommandManager.ts','showICInfo']]){
 const p=join(dir,file);writeFileSync(p,`import {${helper}} from './ICInfoController';\n`+readFileSync(p,'utf8'));
}
once('MouseManager.ts','\t\tthis.sim.menus.elmEditMenuItem.setEnabled(this.mouseElm.hasProperties());',
 '\t\tconst canInfo = canShowICInfo(this.mouseElm);\n'+
 '\t\tthis.sim.menus.elmICInfoMenuItem.setEnabled(canInfo);\n'+
 '\t\tif(this.sim.menus.elmICInfoMenuItem._li)this.sim.menus.elmICInfoMenuItem._li.style.display=canInfo?"":"none";\n'+
 '\t\tthis.sim.menus.elmEditMenuItem.setEnabled(this.mouseElm.hasProperties());');
once('Menus.ts','    elmMenuBar: HTMLElement = document.createElement(\'ul\');',
 "    elmICInfoMenuItem = new MenuItem();\n    elmMenuBar: HTMLElement = document.createElement('ul');");
once('Menus.ts','        m.addMenuItem(this.elmEditMenuItem,       Locale.LS("Edit..."),                  "elm", "edit");',
 '        m.addMenuItem(this.elmICInfoMenuItem, icInfoLabel("info",Locale.activeLanguage), "elm", "icinfo");\n'+
 '        m.addMenuItem(this.elmEditMenuItem,       Locale.LS("Edit..."),                  "elm", "edit");');
const menus=join(dir,'Menus.ts');writeFileSync(menus,"import {icInfoLabel} from './ICInfoLabels';\n"+readFileSync(menus,'utf8'));
once('CommandManager.ts','        if (menu == "elm" && item == "edit")',
 '        if(menu === "elm" && item === "icinfo")showICInfo(this.app.mouse.menuElm);\n        if (menu == "elm" && item == "edit")');
console.log('OK: integrated-circuit information via context menu; native double-click editing preserved; live voltages and SVG internal blocks');

const register=join(dir,'registerElements.ts');writeFileSync(register,"import './ICInfoDialog';\n"+readFileSync(register,'utf8'));


const preservedDoubleClick=readFileSync(join(dir,'MouseManager.ts'),'utf8').match(/    private onDoubleClick\(e: MouseEvent\): void \{[\s\S]*?(?=    private onMouseOut)/)?.[0];
if(originalDoubleClick!==preservedDoubleClick)throw Error('IC information must not change native double-click handling');
