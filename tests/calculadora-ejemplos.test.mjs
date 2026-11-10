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
const values=['1.5','1.25','2.75','1.8','1.375','2.625'];
let count=0;
for(const region of ['eu','en']){
 const exampleCells=vm.runInNewContext(source,{Q,z:()=>new Q(0),one:()=>new Q(1),region});
 for(let n=1;n<=6;n++){
  for(const kind of ['unique','infinite','none']){
   const cells=exampleCells(n,kind);
   assert.equal(cells.length,n,'Número de ecuaciones');
   assert(cells.every(row=>row.length===n+1),'Número de coeficientes y términos independientes');
   assert(cells.flat().every(value=>!value.includes('/')),'No deben figurar fracciones en la matriz');
   assert(cells.flat().every(value=>!value.includes(region==='eu'?'.':',')),'Separador decimal correcto');
   const data=cells.map(row=>row.map(value=>Q.from(value.replace(',','.'))));
   const A=data.map(row=>row.slice(0,n)),b=data.map(row=>row[n]);
   const result=solve(A,b);
   assert.equal(result.kind,kind,'Clasificación '+kind+' con '+n+' incógnitas y '+region);
   if(kind==='unique'){
    assert.equal(result.x.length,n);
    result.x.forEach((value,j)=>{
     assert.equal(value.toString(),Q.from(values[j]).toString(),'Solución '+j);
     assert(value.d>1n,'La solución no debe ser entera');
    });
    assert(cells.flat().some(value=>value.includes(region==='eu'?',':'.')),'El ejemplo debe incluir valores decimales');
   }
   if(kind==='infinite'&&n>1){
    const sample=values.slice(0,n).map(Q.from);
    A.forEach((row,i)=>{
     const calculated=row.reduce((sum,q,j)=>sum.add(q.mul(sample[j])),new Q(0));
     assert.equal(calculated.toString(),b[i].toString(),'Ejemplo compatible con soluciones no enteras');
    });
   }
   count++;
  }
 }
}
console.log('OK: '+count+' casos verificados para dos formatos regionales, sin fracciones en la matriz.');
