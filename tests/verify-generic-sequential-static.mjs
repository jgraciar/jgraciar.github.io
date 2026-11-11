import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const dir=process.argv[2];
if(!dir)throw Error("Usage: verify-generic-sequential-static.mjs <patched-ts-directory>");
const read=name=>readFileSync(join(dir,name),"utf8");
for(const name of ["DFlipFlopElm","JKFlipFlopElm","TFlipFlopElm","RSGenericElm"]){
 const s=read(name+".ts");
 assert.match(s,/new Choice\(/);
 assert.match(s,/Operating Mode/);
 assert.match(s,/\.bubble\s*=/);
 assert.match(s,/\.clock\s*=/);
}
for(const name of ["RSGenericElm","BinaryToBCD4Elm","SevenSegNumericElm"]){
 assert(read("registerElements.ts").includes('registerClass("'+name+'"'));
 assert(read("Menus.ts").includes('"'+name+'"'));
}
assert(read("BinaryToBCD4Elm.ts").includes("Math.floor(n/10)"));
assert(read("SevenSegNumericElm.ts").includes("0x3f,0x06,0x5b"));
console.log("OK: four configurable generic bistables and two additional readout components");
