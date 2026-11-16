// Añadir el juego autónomo al sitio generado y a la portada principal.
import assert from "node:assert/strict";
import {cpSync,existsSync,mkdirSync,readFileSync,writeFileSync} from "node:fs";
import {resolve,join} from "node:path";

const [siteArg,repoArg]=process.argv.slice(2);
assert(siteArg&&repoArg,"Uso: publish-wormhoff.mjs <site-root> <repositorio>");
const site=resolve(siteArg),repo=resolve(repoArg);
const source=join(repo,"wormhoff","index.html");
const destination=join(site,"wormhoff","index.html");
const portal=join(site,"index.html");
assert(existsSync(source)&&existsSync(portal),
  "Faltan el juego Wormhoff o la portada del sitio generado");
mkdirSync(join(site,"wormhoff"),{recursive:true});
cpSync(source,destination);
// El modo topológico importa su motor como módulo ES: ambos ficheros deben publicarse juntos.
for(const filename of ["topologias.html","topology.mjs"]){
  const asset=join(repo,"wormhoff",filename);
  assert(existsSync(asset),"Falta el recurso de Wormhoff: "+filename);
  cpSync(asset,join(site,"wormhoff",filename));
}
let index=readFileSync(portal,"utf8");
const href='href="./wormhoff/"';
if(!index.includes(href)){
  const marker='    </nav>';
  assert(index.includes(marker)&&index.includes('href="./calculadora/"'),
    "No se reconoce la navegación de la portada principal");
  const card='      <a href="./wormhoff/"><strong>Wormhoff</strong>\n'+
    '        <span>Juego de circuitos y resolución de ecuaciones mediante las leyes de Kirchhoff.</span></a>\n';
  index=index.replace(marker,card+marker);
  writeFileSync(portal,index);
}
assert(["topologias.html","topology.mjs"].every(name=>existsSync(join(site,"wormhoff",name))),"Faltan recursos del modo topológico publicado");
assert(existsSync(destination)&&readFileSync(destination,"utf8").includes("Wormhoff")&&
  readFileSync(portal,"utf8").includes(href),
  "No se ha publicado o enlazado Wormhoff");
assert(!existsSync(join(site,"kirchhoff")),"La ruta antigua no debe publicarse");
console.log("OK: /wormhoff/ incorporado a GitHub Pages y a la portada principal");
