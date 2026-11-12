// SPDX-License-Identifier: GPL-3.0-or-later
import {Locale} from './Locale';
import {CommandPaletteRegistry} from './CommandPaletteRegistry';
export type LiveLabel=string|(()=>string);
const values:Array<()=>void>=[];
const labels:Array<()=>void>=[];
export function bindLiveValue(resolve:()=>string,apply:(value:string)=>void):void {
    const refresh=()=>apply(resolve());values.push(refresh);refresh();
}
// Reconcile only the label prefix. Keep attached submenus, event handlers,
// checkbox state, shortcuts and DOM identities intact.
function copyLabel(source:Node,target:Node):void {
    if(source.nodeType===Node.TEXT_NODE){target.textContent=source.textContent;return;}
    if(!(source instanceof Element)||!(target instanceof Element))return;
    for(const attr of ['title','aria-label','placeholder'])if(source.hasAttribute(attr))target.setAttribute(attr,source.getAttribute(attr)!);
    const children=Array.from(source.childNodes);
    for(let i=0;i<children.length;i++){
        const child=children[i],existing=target.childNodes[i];
        if(!existing)target.appendChild(child.cloneNode(true));
        else if(child.nodeType!==existing.nodeType||child.nodeName!==existing.nodeName)target.replaceChild(child.cloneNode(true),existing);
        else copyLabel(child,existing);
    }
    while(target.childNodes.length>children.length)target.removeChild(target.lastChild!);
}
export function bindLiveHTML(element:HTMLElement,render:()=>string):void {
    let owned=Array.from(element.childNodes);
    labels.push(()=>{
        const template=document.createElement('template');template.innerHTML=render();
        const children=Array.from(template.content.childNodes);
        const anchor=owned[owned.length-1]?.nextSibling||null;
        const nextOwned:Node[]=[];
        for(let i=0;i<children.length;i++){
            const existing=owned[i],next=children[i];
            if(!existing||existing.parentNode!==element){const added=next.cloneNode(true);element.insertBefore(added,anchor?.parentNode===element?anchor:null);nextOwned.push(added);}
            else if(existing.nodeName!==next.nodeName||existing.nodeType!==next.nodeType){const added=next.cloneNode(true);element.replaceChild(added,existing);nextOwned.push(added);}
            else {copyLabel(next,existing);nextOwned.push(existing);}
        }
        for(const obsolete of owned.slice(children.length))if(obsolete.parentNode===element)element.removeChild(obsolete);
        owned=nextOwned;
    });
}
export function bindLiveAttribute(element:HTMLElement,name:string,resolve:()=>string):void {
    const refresh=()=>element.setAttribute(name,resolve());labels.push(refresh);refresh();
}
export function refreshLiveLabels(app:any):void {
    app.menus.ctrlMetaKey=app.menus.isMac?Locale.LS('Cmd-'):Locale.LS('Ctrl-');
    for(const refresh of values)refresh();
    for(let i=0;i<app.ui.mainMenuItems.length;i++)app.classToLabelMap.set(app.ui.mainMenuItemNames[i],app.ui.mainMenuItems[i].getLabel());
    for(const refresh of labels)refresh();
    app.ui.updateToolbar();
}
export function refreshExampleSearch(text:string):void {
    const path:string[]=[];
    for(const line of text.split(/\r?\n/)){
        if(!line||line[0]==='#')continue;
        if(line[0]==='+')path.push(line.slice(1));
        else if(line[0]==='-')path.pop();
        else {
            const space=line.indexOf(' ');if(space<0)continue;
            const file=line.slice(line[0]==='>'?1:0,space);
            CommandPaletteRegistry.registerCircuit(file,Locale.LS(line.slice(space+1)),path.map(p=>Locale.LS(p)).join(' → '));
        }
    }
}
