// Crea una copia aislada del interfaz publicado, sin modificar el motor ni el lienzo.
import {readFileSync,writeFileSync,copyFileSync} from "node:fs";
import {join} from "node:path";
const site=process.argv[2];if(!site)throw Error("Falta directorio site-root");
const source=readFileSync(join(site,"circuitjgr.html"),"utf8");
if(!source.includes('id="shared-chrome"')||!source.includes('id="workspace"'))throw Error("Interfaz desconocida");
const preview=source.replace("<title>Circuit JGR</title>",'<title>Circuit JGR · Prueba de interfaz</title>\n<meta name="robots" content="noindex,nofollow">\n<link rel="stylesheet" href="./interfaz-prueba.css">')
.replace('</body>','<div id="jgr-preview-label" aria-label="Versión de prueba del interfaz">PRUEBA DE INTERFAZ · Sin cambios en producción</div>\n</body>');
writeFileSync(join(site,"interfaz-prueba.html"),preview);
copyFileSync(new URL("../interfaz-prueba.css",import.meta.url),join(site,"interfaz-prueba.css"));
console.log("OK: interfaz-prueba.html aislado, motor y zona de trabajo intactos");
