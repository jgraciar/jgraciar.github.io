import {Locale} from './Locale';
import {CircuitElm} from './CircuitElm';
import {NumberFormat} from './NumberFormat';
import {CommandPaletteRegistry} from './CommandPaletteRegistry';
import {refreshLiveLabels,refreshExampleSearch} from './CircuitJGRLiveLabels';

const textBindings=new WeakMap<Node,{source:string;last:string}>();
const attributeBindings=new WeakMap<Element,Map<string,{source:string;last:string}>>();

export async function applyCircuitJGRSettings(app:any, settings:{language:string;whiteBackground:boolean;digits:number;decimal:'.'|',';grouping:'.'|','|'';notify?:boolean}):Promise<void>{
    const languageChanged=settings.language!==Locale.activeLanguage;
    if (languageChanged) {
        (app.constructor as any).commandPalette?.close();
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
            if(!parent || parent===app.ui.titleLabel || parent.closest('#lab-start-modal,#jgr-tab-strip,#jgr-scope-info,script,style,textarea,input,[contenteditable]'))continue;
            const text=node.textContent||'';
            const bound=textBindings.get(node);
            const source=bound?.last===text?bound.source:sources.get(text.trim());
            if(source!==undefined)nodes.push({node:node as Text,source,prefix:text.match(/^\s*/)?.[0]||'',suffix:text.match(/\s*$/)?.[0]||''});
        }
        const attrs:Array<{el:Element;name:string;source:string}>=[];
        for(const el of Array.from(document.querySelectorAll('[title],[aria-label]'))){
            if(el===app.ui.titleLabel||el.closest('#lab-start-modal,#jgr-tab-strip,#jgr-scope-info'))continue;
            for(const name of ['title','aria-label']){
                const text=el.getAttribute(name)||'',bound=attributeBindings.get(el)?.get(name);
                const source=bound?.last===text?bound.source:sources.get(text);
                if(source!==undefined)attrs.push({el,name,source});
            }
        }
        Locale.liveTranslations.clear();
        await Locale.load(settings.language);
        Locale.liveTranslations.clear();
        for(const item of nodes)if(item.node.isConnected){
            const text=item.prefix+Locale.LS(item.source)+item.suffix;item.node.textContent=text;
            textBindings.set(item.node,{source:item.source,last:text});
        }
        for(const item of attrs){
            const text=Locale.LS(item.source);item.el.setAttribute(item.name,text);
            if(!attributeBindings.has(item.el))attributeBindings.set(item.el,new Map());
            attributeBindings.get(item.el)!.set(item.name,{source:item.source,last:text});
        }
        refreshLiveLabels(app);
        CommandPaletteRegistry.buildStatic(app);
        refreshExampleSearch(app.menus.jgrSetupListText||'');
        document.documentElement.lang=Locale.activeLanguage==='csx'?'cs':Locale.activeLanguage==='kr'?'ko':Locale.activeLanguage;
    }
    NumberFormat.setSeparators(settings.decimal,settings.grouping);
    CircuitElm.setDecimalDigits(settings.digits,false,true);
    CircuitElm.setDecimalDigits(settings.digits,true,true);
    app.menus.printableCheckItem.setState(settings.whiteBackground);
    app.ui.setOptionInStorage('whiteBackground',settings.whiteBackground);
    app.repaint();
    const applied={...settings,language:Locale.activeLanguage};
    window.dispatchEvent(new CustomEvent('circuit-jgr-settings-applied',{detail:applied}));
    if(settings.notify!==false&&window.parent!==window)
        window.parent.postMessage({source:'circuit-jgr-tabs',action:'settings-changed',settings:applied},location.origin);
}
