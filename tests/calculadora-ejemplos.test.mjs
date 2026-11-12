import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createRequire} from 'node:module';
import vm from 'node:vm';

const dir=resolve(process.argv[2]||'site-root/calculadora');
const require=createRequire(import.meta.url);
const {Q,solve}=require(join(dir,'solver.js'));
const app=readFileSync(join(dir,'app.js'),'utf8');
const start=app.indexOf('function exampleCells(n,kind){');
const end=app.indexOf("\ndocument.querySelectorAll('[data-example]')",start);
assert(start>=0&&end>start,'El generador de ejemplos debe existir');
const source=app.slice(start,end)+'\nexampleCells';
let count=0,seed=20261112;
const seededMath=Object.create(Math);
seededMath.random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
// Semilla reproducible y fuente constante para comprobar también la no repetición.
for(const math of [seededMath,Object.assign(Object.create(Math),{random:()=>0})]){
 for(const region of ['eu','en']){
  const exampleCells=vm.runInNewContext(source,{Q,z:()=>new Q(0),one:()=>new Q(1),region,Math:math});
  for(let n=1;n<=6;n++)for(const kind of ['unique','infinite','none']){
   let previous;
   for(let trial=0;trial<30;trial++){
    const cells=exampleCells(n,kind),signature=JSON.stringify(cells);
    assert.equal(cells.length,n);
    assert(cells.every(row=>row.length===n+1));
    assert(cells.flat().every(value=>/^-?\d+$/.test(value)),'Datos enteros');
    if(previous&&!(n===1&&kind==='infinite'))assert.notEqual(signature,previous,'Cada pulsación genera un sistema diferente');
    previous=signature;
    const data=cells.map(row=>row.map(Q.from)),A=data.map(row=>row.slice(0,n)),b=data.map(row=>row[n]);
    const result=solve(A,b);
    assert.equal(result.kind,kind,'Compatibilidad garantizada '+kind+' con '+n+' incógnitas');
    if(kind==='unique')assert(result.x.every(q=>q.d===1n),'Soluciones de referencia enteras');
    else assert.equal(result.pivots.length,n-1,'Exactamente una relación dependiente');
    count++;
   }
  }
 }
}
console.log('OK: '+count+' sistemas aleatorios y de fuente constante: enteros, compatibilidad y no repetición (excepto la identidad 0 = 0).');
