import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const dir=resolve(process.argv[2]||'');
assert(process.argv[2],'Indica el directorio de la calculadora');
const path=join(dir,'app.js'),src=readFileSync(path,'utf8');
const begin=src.indexOf('function exampleCells(n,kind){');
const end=src.indexOf("\n document.querySelectorAll('[data-example]')",begin);
const fallback=src.indexOf("\ndocument.querySelectorAll('[data-example]')",begin);
const finish=end>=0?end:fallback;
assert(begin>=0&&finish>begin,'No se encuentra el generador de ejemplos');
const replacement=[
'function exampleCells(n,kind){',
" const values=['2','-1','3','1','-2','4'];",
' const target=values.slice(0,n).map(Q.from);',
' let rows=Array.from({length:n},(_,i)=>{',
'  const coeff=Array.from({length:n},(_,j)=>new Q(i===j?2*n+1:((i+j)%2?-1:1)));',
'  return [...coeff,coeff.reduce((sum,q,j)=>sum.add(q.mul(target[j])),z())];',
' });',
" if(kind!=='unique'){",
"  if(n===1)rows=[[z(),kind==='none'?one():z()]];",
'  else{',
'   rows[n-1]=rows[0].map(q=>q.mul(new Q(2)));',
"   if(kind==='none')rows[n-1][n]=rows[n-1][n].add(one());",
'  }',
' }',
' const format=q=>{if(q.d!==1n)throw Error("Los ejemplos deben contener solo enteros");return q.n.toString()};',
' return rows.map(row=>row.map(format));',
'}'
].join('\n');
writeFileSync(path,src.slice(0,begin)+replacement+src.slice(finish));
console.log('OK: ejemplos con coeficientes, términos independientes y soluciones de referencia enteros.');
