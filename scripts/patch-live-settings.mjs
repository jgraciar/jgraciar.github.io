import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync}from'node:fs';
import{join}from'node:path';
const dir=process.argv[2];
function patch(file,from,to){const p=join(dir,file);let s=readFileSync(p,'utf8');assert(s.includes(from),file+': live settings anchor missing');writeFileSync(p,s.replace(from,to));}
copyFileSync(new URL('./CircuitJGRLiveSettings.ts',import.meta.url),join(dir,'CircuitJGRLiveSettings.ts'));
patch('Locale.ts','    static LS(s: string): string {',`    static liveTranslations = new Map<string,string>();
    static LS(s: string): string {
        const result=Locale.translateLiveSource(s);
        Locale.liveTranslations.set(s,result);
        return result;
    }
    private static translateLiveSource(s: string): string {`);
patch('Locale.ts','static async load(): Promise<void>','static async load(languageOverride?: string): Promise<void>');
patch('Locale.ts','let lang: string | null = qp.get("lang");','let lang: string | null = languageOverride ?? qp.get("lang");');
const js=join(dir,'JSInterface.ts');writeFileSync(js,'import {applyCircuitJGRSettings} from "./CircuitJGRLiveSettings";\n'+readFileSync(js,'utf8'));
patch('JSInterface.ts','            setSimRunning:  (run: boolean)',`            getWhiteBackground: () => that.app.menus.printableCheckItem.getState(),
            applyInitialSettings: (settings:any) => applyCircuitJGRSettings(that.app,settings),
            setSimRunning:  (run: boolean)`);
console.log('OK: initial settings apply to the running circuit without reload or reimport.');
