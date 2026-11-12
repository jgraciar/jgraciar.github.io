// SPDX-License-Identifier: GPL-3.0-or-later
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];if(!dir)throw Error('Usage: patch-component-search.mjs <ts directory>');
function once(file,from,to){const p=join(dir,file),s=readFileSync(p,'utf8');if(s.split(from).length!==2)throw Error('Search patch anchor: '+file+' '+from.slice(0,60));writeFileSync(p,s.replace(from,to));}
copyFileSync(new URL('./CircuitJGRSearch.ts',import.meta.url),join(dir,'CircuitJGRSearch.ts'));
copyFileSync(new URL('./CircuitJGRCommandPalette.ts',import.meta.url),join(dir,'CommandPalette.ts'));
once('Menus.ts','import { Locale } from "./Locale";',
 'import { Locale } from "./Locale";\nimport {searchText} from "./CircuitJGRSearch";');
once('Menus.ts','        const drawMenu = new Menu(this.app);',
 '        const drawMenu = new Menu(this.app);\n        drawMenu.addCommand(searchText(0, Locale.activeLanguage), "edit", "searchelements");\n        drawMenu.addSeparator();');
once('Menus.ts','CommandPaletteRegistry.registerCircuit(file, title, submenuStack[submenuStack.length - 1]);',
 'CommandPaletteRegistry.registerCircuit(file, title, submenuStack.slice(1).map(part => Locale.LS(part)).join(" → "));');
once('CommandManager.ts','if (item == "search" || item == "commandpalette") {\n            CirSim.commandPalette = new CommandPalette(this.app);',
 'if (item == "search" || item == "commandpalette" || item == "searchelements") {\n            CirSim.commandPalette?.close();\n            CirSim.commandPalette = new CommandPalette(this.app, item == "searchelements" ? "elements" : "all");');
const registry=join(dir,'CommandPaletteRegistry.ts');let s=readFileSync(registry,'utf8');
const replace=(from,to)=>{if(s.split(from).length!==2)throw Error('Search registry anchor: '+from.slice(0,60));s=s.replace(from,to);};
s='import {normalizeSearch,searchKind,componentAliases,componentPath,isElementClass,searchScore,highlightSearch,searchText} from "./CircuitJGRSearch";\nimport type {SearchKind} from "./CircuitJGRSearch";\n'+s;
replace('        CommandPaletteRegistry.add("edit:search", "Find Component/Command...", "Edit", "find component search command palette /", "edit", "search");',
 '        CommandPaletteRegistry.add("edit:search", "Find Component/Command...", "Edit", "find component search command palette /", "edit", "search");\n        CommandPaletteRegistry.add("edit:searchelements", searchText(0, Locale.activeLanguage), "Edit", "buscar elemento find element component search", "edit", "searchelements");');
replace('return (this.label + " " + this.category + " " + this.keywords).toLowerCase();',
 'return normalizeSearch(Locale.LS(this.label) + " " + Locale.LS(this.category) + " " + this.keywords + " " + (this.hint || ""));');
replace('const label = Locale.LS("Mode: ") + name;\n            let kw = cls + " " + name;',
 'const element = isElementClass(cls);\n            const label = element ? name : Locale.LS("Mode: ") + name;\n            const path = element ? componentPath(item._li, Locale.LS("Draw")) : "";\n            let kw = cls + " " + name + " " + componentAliases(cls) + " " + path;');
replace('CommandPaletteRegistry.add("main:" + cls, label, "Mode", kw, "main", cls);',
 'CommandPaletteRegistry.add("main:" + cls, label, element ? "Mode" : "Command", kw, "main", cls);\n            const cmd = CommandPaletteRegistry.get("main:" + cls);\n            if (cmd && path) cmd.hint = path;');
const start=s.indexOf('    static fuzzyScore('),end=s.indexOf('    // Resolves ids from CommandPaletteHistory;',start);
if(start<0||end<0)throw Error('Missing search methods');
s=s.slice(0,start)+`    static fuzzyScore(query:string,cmd:PaletteCommand):number {
        return searchScore(query,Locale.LS(cmd.label),cmd.searchText());
    }
    static search(query:string,maxResults:number,kind:SearchKind='all'):PaletteCommand[] {
        const q=normalizeSearch(query),scored:ScoredCommand[]=[];
        const candidates=[...CommandPaletteRegistry.commands,...(q.length>=CommandPaletteRegistry.MIN_CIRCUIT_QUERY_LEN?CommandPaletteRegistry.circuitCommands:[])];
        for(const cmd of candidates){
            if(kind!=='all'&&searchKind(cmd)!==kind)continue;
            const score=CommandPaletteRegistry.fuzzyScore(q,cmd);
            if(score>0)scored.push(new ScoredCommand(cmd,score));
        }
        scored.sort((a,b)=>b.score-a.score||(searchKind(a.cmd)==='elements'?-1:0)-(searchKind(b.cmd)==='elements'?-1:0));
        return scored.slice(0,maxResults).map(s=>s.cmd);
    }

`+s.slice(end);
const h=s.indexOf('    static highlightMatch('),e=s.indexOf('    private static escapeHtml(',h);
if(h<0||e<0)throw Error('Missing highlight method');
s=s.slice(0,h)+'    static highlightMatch(label:string,query:string):string { return highlightSearch(label,query); }\n\n'+s.slice(e);
writeFileSync(registry,s);
const css=`
/* Circuit JGR: shared search, including narrow screens and on-screen keyboards. */
.command-palette { box-sizing:border-box; display:flex; flex-direction:column; overflow:hidden; }
.command-palette-title { font-weight:600; font-size:15px; padding:12px 14px 6px; color:#222; }
.command-palette-controls { display:flex; align-items:center; gap:10px; padding:6px 14px; color:#333; font-size:13px; }
.command-palette-filter { min-width:0; max-width:100%; font-size:16px; padding:5px; background:#fff; color:#222; }
.command-palette-input { flex-shrink:0; font-size:16px; }
.command-palette-status { flex-shrink:0; padding:7px 14px; font-size:12px; color:#555; }
.command-palette-empty { padding:20px 14px; color:#555; }
.command-palette-list { min-height:0; flex:1 1 auto; overscroll-behavior:contain; }
.command-palette-item { flex-direction:column; align-items:stretch; gap:3px; min-height:44px; box-sizing:border-box; }
.command-palette-item-label { white-space:normal; overflow-wrap:anywhere; }
.command-palette-item-hint { margin-left:0; white-space:normal; overflow-wrap:anywhere; color:#666; }
`;
const cssPath=join(dir,'style.css');writeFileSync(cssPath,readFileSync(cssPath,'utf8')+css);
console.log('OK: shared element search, category paths, aliases, accent normalization, input/IME, 22 locales and mobile layout');
