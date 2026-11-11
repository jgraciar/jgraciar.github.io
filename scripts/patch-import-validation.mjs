import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];if(!dir)throw Error('Usage: patch-import-validation.mjs <ts dir>');
copyFileSync(new URL('./CircuitJGRImportValidation.ts',import.meta.url),join(dir,'CircuitJGRImportValidation.ts'));
function once(file,anchor,replacement){const p=join(dir,file),s=readFileSync(p,'utf8');if(s.split(anchor).length!==2)throw Error('Import validation anchor '+file);writeFileSync(p,s.replace(anchor,replacement));}
once('CircuitLoader.ts','import { CirSim } from "./CirSim";',`import { CirSim } from "./CirSim";
import { circuitImportIssue, circuitImportMessage } from "./CircuitJGRImportValidation";`);
once('CircuitLoader.ts','    readCircuit(text: string, flags: number = 0): void {',`    canReadCircuit(text: string): boolean {
        if (CircuitLoader.isSubcircuitLibrary(text)) return true;
        const issue = circuitImportIssue(text, CirSim.xmlDumpTypeMap, CirSim.dumpTypeMap);
        if (!issue) return true;
        window.alert(circuitImportMessage(issue, Locale.activeLanguage));
        return false;
    }

    readCircuit(text: string, flags: number = 0): void {
        text = text.replace(/^\\uFEFF/, "").trimStart();
        if (!this.canReadCircuit(text)) return;`);
once('CirSim.ts','    importCircuitFromText(circuitText: string | null, subcircuitsOnly: boolean): void {',`    importCircuitFromText(circuitText: string | null, subcircuitsOnly: boolean): void {
        if (circuitText != null && !this.loader.canReadCircuit(circuitText)) return;`);
console.log('OK: preflight rejects unknown XML/TXT elements or malformed XML before replacing the open circuit');
