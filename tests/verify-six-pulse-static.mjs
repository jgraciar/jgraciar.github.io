import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join,resolve} from "node:path";
import {labLanguageCodes,labTranslation} from "../scripts/LabTranslations.ts";
import {sixPulseKeys,sixPulseTranslations} from "../scripts/CircuitJsSixPulseTranslations.ts";

const dir=resolve(process.argv[2]||"");
const source=readFileSync(join(dir,"SixPulseBridgeElm.ts"),"utf8");
const registry=readFileSync(join(dir,"registerElements.ts"),"utf8");
const menus=readFileSync(join(dir,"Menus.ts"),"utf8");
assert.equal(labLanguageCodes.length,22);
for(const lang of labLanguageCodes){
 const row=sixPulseTranslations[lang];
 assert(row&&row.length===sixPulseKeys.length,"Falta catálogo trifásico de "+lang);
 for(let i=0;i<row.length;i++){
  assert(row[i].trim().length>5,"Traducción vacía: "+lang+" "+i);
  assert.equal(labTranslation(lang,sixPulseKeys[i]),row[i],
   "El rectificador no está traducido a "+lang+": "+sixPulseKeys[i]);
 }
}
assert.equal(labTranslation("en",sixPulseKeys[0]),
 "Nonlinear load: three-phase six-pulse rectifier");
assert.equal(labTranslation("ca-es-valencia",sixPulseKeys[0]),
 "Càrrega no lineal: rectificador trifàsic de 6 polsos");
assert(source.includes('getXmlDumpType():string{return "SixPulseBridge";}'));
assert(source.includes("getDumpType():number{return 1555;}"));
assert(source.includes('this.loadComposite(null,entries.join("\\r"),[1,2,3])'),
 "El modelo debe tener exactamente tres fases de entrada");
for(const fragment of [
 "DiodeElm \"+phase+\" 4",
 "DiodeElm 5 \"+phase",
 "CapacitorElm 4 5",
 "ResistorElm 4 5",
 "const r=this.resistance/this.units;",
 "const c=this.capacitance*this.units;",
 "const rs=this.seriesResistance/this.units;",
 'this.units=xml.parseIntAttr("units",1);',
 'CircuitXMLSerializer.dumpAttr(elem,"units",this.units);',
 'if(!Number.isInteger(value)||value<1||value>SixPulseBridgeElm.maxUnits)'
])assert(source.includes(fragment),"Falta regla de funcionamiento: "+fragment);
assert(registry.includes('ElementFactory.registerClass("SixPulseBridgeElm"'));
assert(registry.includes('CirSim.theApp.register("SixPulseBridgeElm"'));
assert(menus.includes('"Carga no lineal: rectificador trifásico de 6 pulsos", "SixPulseBridgeElm"'));
console.log("OK: modelo eléctrico de seis pulsos, N unidades, XML y 22 traducciones.");
