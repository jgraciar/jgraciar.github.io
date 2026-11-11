import {Locale} from './Locale';
import {CircuitElm} from './CircuitElm';
import {NumberFormat} from './NumberFormat';
import {CommandPaletteRegistry} from './CommandPaletteRegistry';

export async function applyCircuitJGRSettings(app:any, settings:{language:string;whiteBackground:boolean;digits:number;decimal:'.'|',';grouping:'.'|','|''}):Promise<void>{
    if (settings.language !== Locale.activeLanguage) {
        // Keep the existing controls and their commands; translate their labels in place.
        const sources = new Map<string,string>();
        for (const [source,translated] of Locale.liveTranslations)
            if (translated) {
                const previous=sources.get(translated);
                // Prefer canonical plain labels to legacy HTML or duplicate aliases.
                if(previous===undefined || source===translated || (/[<>]/.test(previous) && !/[<>]/.test(source)))sources.set(translated,source);
            }
        const nodes:Array<{node:Text;source:string;prefix:string;suffix:string}>=[];
        const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
        let node:Node|null;
        while((node=walker.nextNode())){
            const parent=node.parentElement;
            if(!parent || parent.closest('#lab-start-modal,script,style,textarea,input,[contenteditable]'))continue;
            const text=node.textContent||'';
            const source=sources.get(text.trim());
            if(source!==undefined)nodes.push({node:node as Text,source,prefix:text.match(/^\s*/)?.[0]||'',suffix:text.match(/\s*$/)?.[0]||''});
        }
        const attrs:Array<{el:Element;name:string;source:string}>=[];
        for(const el of Array.from(document.querySelectorAll('[title],[aria-label]'))){
            if(el.closest('#lab-start-modal'))continue;
            for(const name of ['title','aria-label']){
                const source=sources.get(el.getAttribute(name)||'');
                if(source!==undefined)attrs.push({el,name,source});
            }
        }
        await Locale.load(settings.language);
        for(const item of nodes)if(item.node.isConnected)item.node.textContent=item.prefix+Locale.LS(item.source)+item.suffix;
        for(const item of attrs)item.el.setAttribute(item.name,Locale.LS(item.source));
        for(const [key,label]of app.classToLabelMap){
            const source=sources.get(label);
            if(source!==undefined)app.classToLabelMap.set(key,Locale.LS(source));
        }
        CommandPaletteRegistry.buildStatic(app);
        document.documentElement.lang=settings.language==='csx'?'cs':settings.language==='kr'?'ko':settings.language;
    }
    NumberFormat.setSeparators(settings.decimal,settings.grouping);
    CircuitElm.setDecimalDigits(settings.digits,false,true);
    CircuitElm.setDecimalDigits(settings.digits,true,true);
    app.menus.printableCheckItem.setState(settings.whiteBackground);
    app.ui.setOptionInStorage('whiteBackground',settings.whiteBackground);
    app.repaint();
}
