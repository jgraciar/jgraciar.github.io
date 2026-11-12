/*
    Copyright (C) Paul Falstad and Iain Sharp

    This file is part of CircuitJS1.

    CircuitJS1 is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 2 of the License, or
    (at your option) any later version.

    CircuitJS1 is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with CircuitJS1.  If not, see <http://www.gnu.org/licenses/>.
*/

import { CirSim } from "./CirSim";
import { CommandPaletteRegistry, PaletteCommand } from "./CommandPaletteRegistry";
import { CommandPaletteHistory } from "./CommandPaletteHistory";
import { Locale } from "./Locale";

import {searchKinds,searchText,searchKind,normalizeSearch} from "./CircuitJGRSearch";
import type {SearchKind} from "./CircuitJGRSearch";
// Shared by Draw, Edit, toolbar and keyboard shortcuts.
export class CommandPalette {
    static readonly WIDTH=620;
    static readonly MAX_RESULTS=50;
    private sim:CirSim;
    private overlay:HTMLDivElement;
    private panel:HTMLDivElement;
    private filterBox:HTMLInputElement;
    private typeFilter:HTMLSelectElement;
    private listPanel:HTMLDivElement;
    private status:HTMLDivElement;
    private visibleCommands:PaletteCommand[]=[];
    private selectedIndex=0;
    private lastQuery="";
    private closed=false;
    private composing=false;
    private previousFocus:HTMLElement|null=null;
    private resize=()=>this.centerPopup();
    constructor(sim:CirSim,private kind:SearchKind='all') {
        this.sim=sim;
        const t=(i:number)=>searchText(i,Locale.activeLanguage);
        this.overlay=document.createElement('div');
        this.overlay.className='command-palette-overlay';
        this.overlay.addEventListener('pointerdown',e=>{if(e.target===this.overlay)this.close();});
        this.panel=document.createElement('div');
        this.panel.className='command-palette';
        this.panel.setAttribute('role','dialog');
        this.panel.setAttribute('aria-modal','true');
        this.panel.setAttribute('aria-label',t(1));
        const title=document.createElement('div');title.className='command-palette-title';title.textContent=t(1);
        this.panel.appendChild(title);
        const controls=document.createElement('label');controls.className='command-palette-controls';
        const filterLabel=document.createElement('span');filterLabel.textContent=t(3);controls.appendChild(filterLabel);
        this.typeFilter=document.createElement('select');this.typeFilter.className='command-palette-filter';
        this.typeFilter.setAttribute('aria-label',t(3));
        searchKinds.forEach((kind,i)=>{const option=document.createElement('option');option.value=kind;option.textContent=t(4+i);this.typeFilter.appendChild(option);});
        this.typeFilter.value=kind;
        // Native select keyboard interaction must not execute a result underneath it.
        this.typeFilter.addEventListener('keydown',e=>{if(e.key!=='Escape'&&e.key!=='Tab')e.stopPropagation();});
        this.typeFilter.addEventListener('change',()=>{this.kind=this.typeFilter.value as SearchKind;this.refreshList();});
        controls.appendChild(this.typeFilter);this.panel.appendChild(controls);
        this.filterBox=document.createElement('input');this.filterBox.type='search';
        this.filterBox.className='command-palette-input';this.filterBox.placeholder=t(2);
        this.filterBox.setAttribute('aria-label',t(2));this.filterBox.autocomplete='off';
        this.panel.appendChild(this.filterBox);
        this.status=document.createElement('div');this.status.className='command-palette-status';
        this.status.setAttribute('role','status');this.status.setAttribute('aria-live','polite');this.panel.appendChild(this.status);
        this.listPanel=document.createElement('div');this.listPanel.className='command-palette-list';
        this.panel.appendChild(this.listPanel);
        this.filterBox.addEventListener('compositionstart',()=>this.composing=true);
        this.filterBox.addEventListener('compositionend',()=>{this.composing=false;this.onFilterTextChanged();});
        this.filterBox.addEventListener('keydown',e=>{if(e.isComposing||this.composing)e.stopPropagation();});
        this.filterBox.addEventListener('input',()=>{if(!this.composing)this.onFilterTextChanged();});
        this.panel.addEventListener('keydown',e=>{
            if(e.key!=='Tab')return;
            if(e.shiftKey&&document.activeElement===this.typeFilter){e.preventDefault();this.filterBox.focus();}
            else if(!e.shiftKey&&document.activeElement===this.filterBox){e.preventDefault();this.typeFilter.focus();}
        });
    }
    show():void {
        this.previousFocus=document.activeElement as HTMLElement;
        this.lastQuery='';this.filterBox.value='';this.refreshList();
        document.body.append(this.overlay,this.panel);
        window.addEventListener('resize',this.resize);
        window.visualViewport?.addEventListener('resize',this.resize);
        window.visualViewport?.addEventListener('scroll',this.resize);
        this.centerPopup();this.filterBox.focus();this.updateSelectionHighlight();
    }
    isShowing():boolean {return !this.closed;}
    private centerPopup():void {
        const viewport=window.visualViewport;
        const width=viewport?.width??innerWidth,height=viewport?.height??innerHeight;
        const left=viewport?.offsetLeft??0,top=viewport?.offsetTop??0;
        const panelWidth=Math.max(0,Math.min(CommandPalette.WIDTH,width-16));
        this.panel.style.width=panelWidth+'px';
        this.panel.style.left=(left+(width-panelWidth)/2)+'px';
        this.panel.style.top=(top+Math.min(64,height*.08))+'px';
        this.panel.style.maxHeight=Math.max(0,height-Math.min(64,height*.08)-8)+'px';
    }
    private onFilterTextChanged():void {
        if(this.filterBox.value===this.lastQuery)return;
        this.lastQuery=this.filterBox.value;this.refreshList();
    }
    private refreshList():void {
        const query=this.filterBox.value,q=normalizeSearch(query),t=(i:number)=>searchText(i,Locale.activeLanguage);
        this.listPanel.replaceChildren();this.visibleCommands=[];this.selectedIndex=0;
        const recent=q.length===0?CommandPaletteRegistry.recentCommands().filter(cmd=>this.kind==='all'||searchKind(cmd)===this.kind):[];
        const examplesTooShort=this.kind==='examples'&&q.length<CommandPaletteRegistry.MIN_CIRCUIT_QUERY_LEN;
        const results=examplesTooShort?[]:recent.length?recent:CommandPaletteRegistry.search(query,Number.MAX_SAFE_INTEGER,this.kind);
        if(recent.length)this.addSectionLabel(Locale.LS('Recent'));
        for(const cmd of results.slice(0,CommandPalette.MAX_RESULTS))this.addCommandRow(cmd,query);
        this.status.textContent=examplesTooShort?t(10):t(8).replace('{shown}',String(this.visibleCommands.length)).replace('{total}',String(results.length));
        if(!results.length&&!examplesTooShort){const empty=document.createElement('div');empty.className='command-palette-empty';empty.textContent=t(9);this.listPanel.appendChild(empty);}
        this.updateSelectionHighlight();
    }
    private addSectionLabel(text:string):void {
        const section=document.createElement('div');section.className='command-palette-section-label';section.textContent=text;this.listPanel.appendChild(section);
    }
    private addCommandRow(cmd:PaletteCommand,query:string):void {
        const index=this.visibleCommands.length;this.visibleCommands.push(cmd);
        const row=document.createElement('div');row.className='command-palette-item';row.dataset.index=String(index);
        const label=document.createElement('div');label.className='command-palette-item-label';
        label.innerHTML=CommandPaletteRegistry.highlightMatch(Locale.LS(cmd.label),query);row.appendChild(label);
        if(cmd.hint){const hint=document.createElement('div');hint.className='command-palette-item-hint';hint.textContent=Locale.LS(cmd.hint);row.appendChild(hint);}
        row.addEventListener('click',()=>{this.selectedIndex=index;this.executeSelected();});
        this.listPanel.appendChild(row);
    }
    moveSelection(delta: number): void {
        if (this.visibleCommands.length === 0)
            return;
        this.selectedIndex += delta;
        if (this.selectedIndex < 0)
            this.selectedIndex = this.visibleCommands.length - 1;
        if (this.selectedIndex >= this.visibleCommands.length)
            this.selectedIndex = 0;
        this.updateSelectionHighlight();
        this.scrollSelectedIntoView();
    }

    private updateSelectionHighlight(): void {
        for (const row of Array.from(this.listPanel.children)) {
            const idxStr = row.getAttribute("data-index");
            if (idxStr == null || idxStr.length === 0)
                continue;
            const idx = parseInt(idxStr, 10);
            row.classList.toggle("command-palette-item-selected", idx === this.selectedIndex);
        }
    }

    private scrollSelectedIntoView(): void {
        for (const row of Array.from(this.listPanel.children)) {
            const idxStr = row.getAttribute("data-index");
            if (idxStr != null && idxStr.length > 0 && parseInt(idxStr, 10) === this.selectedIndex) {
                (row as HTMLElement).scrollIntoView({ block: "nearest" });
                break;
            }
        }
    }

    executeSelected(): void {
        if (this.visibleCommands.length === 0 || this.selectedIndex < 0 || this.selectedIndex >= this.visibleCommands.length)
            return;
        const cmd = this.visibleCommands[this.selectedIndex];
        // Close before running the command so the modal overlay doesn't block native
        // file/print dialogs (Open File, Save As, etc.).
        this.close();
        CommandPalette.execute(cmd);
    }

    static execute(cmd: PaletteCommand): void {
        const app = CirSim.theApp;
        if (cmd.custom != null)
            cmd.custom.execute();
        else
            app.commands.menuPerformed(cmd.menu!, cmd.item!);
        CommandPaletteHistory.record(cmd.id);
    }

    close(): void {
        if (this.closed)
            return;
        this.closed = true;
        window.removeEventListener('resize',this.resize);
        window.visualViewport?.removeEventListener('resize',this.resize);
        window.visualViewport?.removeEventListener('scroll',this.resize);
        this.overlay.remove();
        this.panel.remove();
        if(this.previousFocus?.isConnected)this.previousFocus.focus();
        if (CirSim.commandPalette === this)
            CirSim.commandPalette = null;
    }
}
