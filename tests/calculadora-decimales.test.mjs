import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {join,resolve} from "node:path";
import vm from "node:vm";

const dir=resolve(process.argv[2]||"site-root/calculadora");
const app=readFileSync(join(dir,"app.js"),"utf8");
const html=readFileSync(join(dir,"index.html"),"utf8");
const decimal=app.match(/^function decimal\(q\)\{[\s\S]*?^\}/m)?.[0];
assert(decimal,"No se reconoce la función decimal de la calculadora");
assert(app.includes("Resultados con hasta "),"El texto informativo debe indicar una precisión máxima");
assert(html.includes("Hasta 4 decimales"),"El selector debe mostrar que las cifras decimales son un máximo");

const cases=[
 [0n,1n,4,"0","0"],[1n,1n,4,"1","1"],
 [5n,2n,4,"2,5","2.5"],[-5n,2n,4,"−2,5","−2.5"],
 [1n,3n,4,"0,3333","0.3333"],
 [10000n,1n,4,"10.000","10,000"],
 [1234567n,1000n,4,"1.234,567","1,234.567"],
 [-1n,100000n,4,"0","0"],[1n,100000n,4,"0","0"],
 [1n,20000n,4,"0,0001","0.0001"],
 [1n,2n,10,"0,5","0.5"],
 [123n,1000n,3,"0,123","0.123"],
 [-99999n,100000n,3,"−1","−1"],
 [1234000n,100000n,6,"12,34","12.34"],
 [1n,2n,3,"0,5","0.5"],
 [1n,3n,10,"0,3333333333","0.3333333333"]
];
let count=0;
for(const region of ["eu","en"]){
 for(const [n,d,digits,es,en] of cases){
  const output=vm.runInNewContext(decimal+"\ndecimal(q)",{
   q:{n,d},region,$:()=>({value:String(digits)})
  });
  assert.equal(output,region==="eu"?es:en,
   `Incorrecto para ${n}/${d}, ${digits} decimales, ${region}`);
  count++;
 }
}
console.log("OK: "+count+" comprobaciones de redondeo y ceros no significativos (europeo/anglosajón)");
