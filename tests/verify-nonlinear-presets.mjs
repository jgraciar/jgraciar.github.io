import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {labLanguageCodes,labTranslation} from "../scripts/LabTranslations.ts";
import {nonlinearPresetKeys,nonlinearPresetTranslations} from "../scripts/CircuitJsNonlinearPresets.ts";

const dir=resolve(process.argv[2]||"");
assert(dir,"Es necesario indicar el directorio TS del motor compilado");
assert.equal(labLanguageCodes.length,22);
for(const code of labLanguageCodes){
 const values=nonlinearPresetTranslations[code];
 assert(values&&values.length===nonlinearPresetKeys.length,
  code+": traducciones de perfiles incompletas");
 for(const [index,key] of nonlinearPresetKeys.entries()){
  const label=labTranslation(code,key);
  assert(label&&label===values[index]&&label.trim().length>2,
   code+": falta traducción de "+key);
 }
}
assert.equal(labTranslation("en","Ejemplo LED sin PFC"),"LED example without PFC");
assert.equal(labTranslation("ca-es-valencia","Ejemplo fuente de ordenador sin PFC"),
 "Exemple de font d'alimentació d'ordinador sense PFC");
const source=readFileSync(join(dir,"FilteredBridgeElm.ts"),"utf8");
assert(source.includes('getXmlDumpType():string{return "FilteredBridge";}'));
assert(source.includes('getDumpType():number{return 1554;}'));
assert(source.includes('this.seriesResistance=xml.parseDoubleAttr("rs",0);'),
 "Los XML antiguos deben mantener Rs=0");
assert(source.includes('this.profile=value===1||value===2?value:0;'));
assert(source.includes("ResistorElm 1 5"),
 "La resistencia de entrada debe estar incluida en el circuito físico");
assert(source.includes("if(this.pendingPresetSwitch)return;"),
 "Un cambio de perfil no debe ser sobrescrito por los campos viejos");
const registrations=readFileSync(join(dir,"registerElements.ts"),"utf8");
assert(registrations.includes('ElementFactory.registerClass("FilteredBridgeElm"'),
 "No se ha registrado el componente compuesto");
console.log("OK: perfiles no lineales, compatibilidad XML antiguo, 22 traducciones y editor.");
