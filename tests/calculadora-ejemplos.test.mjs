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
const fn=vm.runInNewContext(app.slice(start,end)+'\nexampleCells',{
 Q,z:()=>new Q(0),one:()=>new Q(1)
});
const toQ=value=>{const [num,den='1']=String(value).split('/');return new Q(num,den)};
const wanted=[[3,2],[5,4],[7,3],[9,5],[11,8],[13,6]];
let count=0;
for(let n=1;n<=6;n++){
 for(const kind of ['unique','infinite','none']){
  const cells=fn(n,kind);
  assert.equal(cells.length,n,'Número de ecuaciones');
  assert(cells.every(row=>row.length===n+1),'Número de coeficientes y términos independientes');
  const data=cells.map(row=>Array.from(row,toQ));
  const A=data.map(row=>row.slice(0,n)),b=data.map(row=>row[n]);
  const result=solve(A,b);
  assert.equal(result.kind,kind,'Clasificación '+kind+' con '+n+' incógnitas');
  if(kind==='unique'){
   assert.equal(result.x.length,n);
   result.x.forEach((value,j)=>{
    const expected=new Q(...wanted[j]);
    assert.equal(value.toString(),expected.toString(),'Valor de incógnita '+j);
    assert(value.d>1n,'Las soluciones de los ejemplos no deben ser enteras');
   });
  }
  if(kind==='infinite'&&n>1){
   const sample=wanted.slice(0,n).map(pair=>new Q(...pair));
   A.forEach((row,i)=>{
    const calculated=row.reduce((sum,q,j)=>sum.add(q.mul(sample[j])),new Q(0));
    assert.equal(calculated.toString(),b[i].toString(),'Ejemplo compatible con solución fraccionaria');
   });
  }
  count++;
 }
}
console.log('OK: '+count+' ejemplos, seis soluciones únicas fraccionarias y clasificación exacta.');
