// Publicar la interfaz de pestañas probada como ruta oficial, conservando
// íntegra la compilación del motor Circuit JGR para cada pestaña.
// Se ejecuta después del empaquetado y antes de las pruebas de navegador.
import assert from "node:assert/strict";
import {existsSync,readFileSync,renameSync,writeFileSync} from "node:fs";
import {join,resolve} from "node:path";

const site=resolve(process.argv[2]||"site-root");
const official=join(site,"circuitjgr.html");
const core=join(site,"circuitjgr-core.html");
const experimental=join(site,"tabs-experimental.html");
assert(existsSync(official)&&existsSync(experimental),
 "Faltan la página original o el prototipo para activar pestañas");
assert(!existsSync(core),"Ya existe una copia del motor Circuit JGR");
const original=readFileSync(official,"utf8");
assert(original.includes('src="./initial-settings.js"'),
 "No se reconoce la compilación completa del simulador");
const source=readFileSync(experimental,"utf8");
const before='const url=new URL("./circuitjgr.html",location.href);';
assert(source.split(before).length===2,
 "La página de pruebas no contiene la referencia esperada al motor");
assert(source.includes("JGRTabsExperimental")&&source.includes("jgr-tab-strip"),
 "La página de pruebas no contiene la gestión de pestañas");
const tabbed=source.replace(before,
 'const url=new URL("./circuitjgr-core.html",location.href);\n' +
 '  url.search=location.search;');
const robot='<meta name="robots" content="noindex,nofollow">';
assert(tabbed.includes(robot),"Falta la cabecera del prototipo");
const publicTabbed=tabbed.replace(robot,
 '<meta name="application-name" content="Circuit JGR">\n' +
 '<meta name="description" content="Circuit JGR: simulador de circuitos eléctricos y electrónicos.">');
renameSync(official,core);
writeFileSync(experimental,tabbed);
writeFileSync(official,publicTabbed);
// Los ejemplos de uso mediante iframe o la API JS necesitan el motor
// directamente, no la interfaz contenedora de pestañas.
for(const name of ["iframe.html","jsinterface.html"]){
 const path=join(site,name);
 if(!existsSync(path))continue;
 const text=readFileSync(path,"utf8");
 writeFileSync(path,text.replaceAll("circuitjgr.html","circuitjgr-core.html"));
}
for(const name of ["circuitjgr.html","circuitjgr-core.html","tabs-experimental.html"]){
 assert(existsSync(join(site,name)),"Falta "+name);
}
assert(readFileSync(official,"utf8").includes('new URL("./circuitjgr-core.html",location.href)'));
assert(readFileSync(core,"utf8").includes('src="./initial-settings.js"'));
console.log("OK: /circuitjgr.html usa pestañas; motor original en /circuitjgr-core.html.");
