// SPDX-License-Identifier: GPL-3.0-or-later
// Run after npm ci: use the pinned engine TypeScript parser to preserve expressions.
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
if(!process.argv[2])throw Error('Usage: patch-live-menu-labels.mjs <ts directory>');
const dir=resolve(process.argv[2]);
const ts=createRequire(join(dir,'package.json'))('typescript');
for(const name of ['CircuitJGRLiveLabels.ts','CircuitJGRLiveSettings.ts','CircuitJGRTabsLabels.ts'])copyFileSync(new URL('./'+name,import.meta.url),join(dir,name));
function once(file,from,to){const path=join(dir,file),s=readFileSync(path,'utf8');if(s.split(from).length!==2)throw Error('Live labels anchor: '+file+' '+from.slice(0,70));writeFileSync(path,s.replace(from,to));}
let menu=readFileSync(join(dir,'Menus.ts'),'utf8');
menu='import {bindLiveHTML,bindLiveValue} from "./CircuitJGRLiveLabels";\nimport type {LiveLabel} from "./CircuitJGRLiveLabels";\n'+menu;
const original=`    makeClassCheckItems(menu: Menu, items: string[]): void {
        for (let i = 0; i < items.length; i += 2)
            menu.addCheckboxItem(this.getClassCheckItem(
                circuitJsDrawLabel(items[i], Locale.LS(items[i]), Locale.activeLanguage), items[i + 1]));
    }

    getClassCheckItem(s: string, t: string): any {
        return this.app.ui.getClassCheckItem(s, t);
    }`;
if(!menu.includes(original))throw Error('Missing component label builder');
menu=menu.replace(original,`    makeClassCheckItems(menu: Menu, items: LiveLabel[]): void {
        for (let i=0;i<items.length;i+=2) {
            const source=items[i];
            const resolve=()=>{const key=typeof source==='function'?source():source;return circuitJsDrawLabel(key,Locale.LS(key),Locale.activeLanguage);};
            menu.addCheckboxItem(this.getClassCheckItem(resolve,items[i+1] as string));
        }
    }
    getClassCheckItem(s: LiveLabel,t: string): any {
        const resolve=typeof s==='function'?s:()=>Locale.LS(s);
        const item=this.app.ui.getClassCheckItem(resolve(),t);
        bindLiveValue(resolve,value=>item.setLabel(value));
        return item;
    }`);
// Defer source expressions, including composed part names and group functions.
const ast=ts.createSourceFile('Menus.ts',menu,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),edits=[];
function wrap(arg){if(!arg||ts.isArrowFunction(arg))return;edits.push({start:arg.getStart(ast),end:arg.getEnd(),text:'() => ('+arg.getText(ast).replace(/\bck\b/g,'this.ctrlMetaKey')+')'});}
function visit(node){
 if(ts.isClassDeclaration(node)&&node.name?.text==='Menus')scan(node);
 else ts.forEachChild(node,visit);
}
function scan(node){
 if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)){
  const name=node.expression.name.text;
  if(name==='makeClassCheckItems'&&ts.isArrayLiteralExpression(node.arguments[1])){
   const array=node.arguments[1];for(let i=0;i<array.elements.length;i+=2)wrap(array.elements[i]);
  }else if(['addSubmenu','addCommand','addMenuItem','addTopItem','getClassCheckItem','setShortcut'].includes(name)){
   if(name==='getClassCheckItem'&&node.expression.expression.getText(ast)!=='this'){ts.forEachChild(node,scan);return;}
   const index=['addMenuItem','addTopItem'].includes(name)?1:0;
   const arg=node.arguments[index];
   // Example titles must be recomputed from their original setup-list source.
   if(name==='addCommand'&&arg?.getText(ast)==='title')edits.push({start:arg.getStart(ast),end:arg.getEnd(),text:'() => Locale.LS(line.substring(sp + 1))'});
   else if(arg?.getText(ast)!=='resolve')wrap(arg);
  }
 }
 ts.forEachChild(node,scan);
}
visit(ast);
for(const e of edits.sort((a,b)=>b.start-a.start))menu=menu.slice(0,e.start)+e.text+menu.slice(e.end);
menu=menu.replaceAll('addCommand(html: string,','addCommand(html: LiveLabel,').replaceAll('addMenuItem(item: MenuItem, html: string,','addMenuItem(item: MenuItem, html: LiveLabel,').replaceAll('addSubmenu(html: string,','addSubmenu(html: LiveLabel,');
menu=menu.replace('const li = this.makeLi(html + \'<span class="submenuArrow">&#9658;</span>\');',
 'const li = this.makeLi(typeof html === "function" ? () => html() + \'<span class="submenuArrow">&#9658;</span>\' : html + \'<span class="submenuArrow">&#9658;</span>\');');
menu=menu.replace('private makeLi(html: string): HTMLLIElement {','private makeLi(html: LiveLabel): HTMLLIElement {');
menu=menu.replace('        li.innerHTML = html;',
 '        li.innerHTML = typeof html === "function" ? html() : html;\n        if(typeof html === "function")bindLiveHTML(li,html);');
menu=menu.replace('private addTopItem(row: HTMLTableRowElement, label: string,','private addTopItem(row: HTMLTableRowElement, label: LiveLabel,');
menu=menu.replace('        td.textContent = label;',
 '        td.textContent = typeof label === "function" ? label() : label;\n        if(typeof label === "function")bindLiveHTML(td,label);');
menu=menu.replace('    processSetupList(text: string, openDefault: boolean): void {',
 '    jgrSetupListText="";\n    processSetupList(text: string, openDefault: boolean): void {\n        this.jgrSetupListText=text;');
const check='        li.innerHTML = `<span class="checkMark">&#10003;</span> ${Locale.LS(label)}`;';
if(!menu.includes(check))throw Error('Missing option checkbox labels');
menu=menu.replace(check,check+'\n        bindLiveHTML(li,()=>`<span class="checkMark">&#10003;</span> ${Locale.LS(label)}`);');
// Keep the example command title synchronized as well as its visible caption.
menu=menu.replace('this.app.commands.menuPerformed(menuName, cmdName);',
 'this.app.commands.menuPerformed(menuName,menuName === "circuits" && typeof html === "function" ? cmdName.split(" ").slice(0,2).join(" ")+" "+html() : cmdName);');
writeFileSync(join(dir,'Menus.ts'),menu);
once('UIManager.ts','    getLabel(): string { return this._label; }',
 '    getLabel(): string { return this._label; }\n    setLabel(s:string):void {this._label=s;const label=this._li?.querySelector(".itemLabel");if(label)label.textContent=Locale.LS(s);}');
once('UIManager.ts','    setShortcut(s: string): void { this._shortcut = s; }',
 '    setShortcut(s:string|(()=>string)):void {if(typeof s === "function"){bindLiveValue(s,value=>this.setShortcut(value));return;}this._shortcut=s;const hint=this._li?.querySelector(".shortcutHint");if(hint)hint.textContent=s;}');
const ui=join(dir,'UIManager.ts');writeFileSync(ui,'import {bindLiveValue} from "./CircuitJGRLiveLabels";\n'+readFileSync(ui,'utf8'));
const toolbar=join(dir,'Toolbar.ts');writeFileSync(toolbar,'import {bindLiveAttribute} from "./CircuitJGRLiveLabels";\n'+readFileSync(toolbar,'utf8'));
once('Toolbar.ts','        iconLabel.title = Locale.LS(tooltip);',
 '        bindLiveAttribute(iconLabel,"title",()=>Locale.LS(command.getMenuName()==="main"?(CirSim.theApp.getLabelTextForClass(command.getItemName())??tooltip):tooltip));');
once('Toolbar.ts','            variantButton.title = app.getLabelTextForClass(info[i + 1]) ?? info[i + 1];',
 '            bindLiveAttribute(variantButton,"title",()=>app.getLabelTextForClass(info[i+1])??info[i+1]);');
// Dutch and Swedish have built-in dictionaries rather than native catalog files.
once('Locale.ts','        const originalLang = ["gl","eu"].includes(lang)?"es":lang;',
 '        if(["nl","sv"].includes(lang)){Locale.localizationMap=new Map<string,string>();return;}\n        const originalLang = ["gl","eu"].includes(lang)?"es":lang;');
const js=join(dir,'JSInterface.ts');writeFileSync(js,'import {Locale} from "./Locale";\nimport {workspaceLabel} from "./CircuitJGRTabsLabels";\n'+readFileSync(js,'utf8'));
once('JSInterface.ts','            getWhiteBackground: () => that.app.menus.printableCheckItem.getState(),',
 '            getLanguage: () => Locale.activeLanguage,\n            workspaceLabel: (key:string) => workspaceLabel(key,Locale.activeLanguage),\n            getWhiteBackground: () => that.app.menus.printableCheckItem.getState(),');
console.log('OK: source-bound live menu labels, stable component names, toolbar, example search and built-in nl/sv catalogs; '+edits.length+' deferred menu expressions');
