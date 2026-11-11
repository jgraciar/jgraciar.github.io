import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const [base,patched,out='/tmp/falstad-audit']=process.argv.slice(2).map(p=>resolve(p));
const ts=createRequire(join(patched,'package.json'))('typescript');
const files=readdirSync(base).filter(f=>f.endsWith('.ts'));
const changed=[],identical=[];
for(const f of files){const a=readFileSync(join(base,f),'utf8'),b=readFileSync(join(patched,f),'utf8');(a===b?identical:changed).push(f);}
const allowed=new Set(['CircuitLoader.ts','SliderDialog.ts','ScopePropertiesDialog.ts','UIManager.ts','CircuitElm.ts','EditOptions.ts','Locale.ts','AboutBox.ts','CirSim.ts','CommandManager.ts','WattmeterTrueElm.ts','ImportFromDropboxDialog.ts','ScopeOverlays.ts','vite.config.ts','EditDialog.ts','MouseManager.ts','Menus.ts','GetCircuitAsSubcircuit.ts','registerElements.ts','NumberFormat.ts']);
assert.deepEqual(changed.filter(f=>!allowed.has(f)),[],'Unexpected changed original files');
const concrete=files.filter(f=>f.endsWith('Elm.ts')&&f!=='CircuitElm.ts');
assert.deepEqual(concrete.filter(f=>changed.includes(f)),['WattmeterTrueElm.ts'],'Only the deliberately extended wattmeter may differ');
function methods(dir,file){const s=ts.createSourceFile(file,readFileSync(join(dir,file),'utf8'),ts.ScriptTarget.Latest,true),r={};for(const c of s.statements)if(ts.isClassDeclaration(c))for(const n of c.members)if(ts.isMethodDeclaration(n)||ts.isConstructorDeclaration(n))r[c.name.text+'.'+(n.name?.getText(s)||'constructor')]=n.getText(s);return r;}
const methodChanges={};
for(const [file,expected]of Object.entries({'CircuitElm.ts':['CircuitElm.initClass','CircuitElm.getUnitTextImpl'],'MouseManager.ts':['MouseManager.doPopupMenu'],'CommandManager.ts':['CommandManager.menuPerformed'],'NumberFormat.ts':['NumberFormat.format'],'CircuitLoader.ts':['CircuitLoader.readCircuit']})){
 const a=methods(base,file),b=methods(patched,file),diff=Object.keys(a).filter(k=>a[k]!==b[k]);assert.deepEqual(diff.sort(),expected.sort(),file+' changed methods');methodChanges[file]=diff;
}
for(const f of ['SimulationManager.ts','CircuitNode.ts','ChipElm.ts','NumberParse.ts'])assert(identical.includes(f),f+' must remain identical');
const drawCommands=text=>new Set(Array.from(text.matchAll(/"(\w+Elm(?:[:~][^"]*)?)"/g),m=>m[1]));
const originalDraw=drawCommands(readFileSync(join(base,'Menus.ts'),'utf8')),currentDraw=drawCommands(readFileSync(join(patched,'Menus.ts'),'utf8'));
assert.deepEqual([...originalDraw].filter(c=>!currentDraw.has(c)),[],'Original Draw commands must remain available');
const report={originalDrawCommands:originalDraw.size,missingDrawCommands:0,upstream:'8d694e2ce2657b53a94a81b4816e3d19dcb645b5',originalFiles:files.length,identical:identical.length,changed,concreteElements:concrete.length,unchangedElements:concrete.length-1,intentionalElementException:'WattmeterTrueElm.ts',methodChanges};
mkdirSync(out,{recursive:true});writeFileSync(join(out,'source.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
