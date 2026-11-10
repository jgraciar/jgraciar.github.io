import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join,resolve} from 'node:path';
const dir=resolve(process.argv[2]||'');
assert(process.argv[2],'Indica el directorio de la calculadora');
const path=join(dir,'app.js'),src=readFileSync(path,'utf8');
const begin=src.indexOf('function exampleCells(n,kind){');
const end=src.indexOf("\ndocument.querySelectorAll('[data-example]')",begin);
assert(begin>=0&&end>begin,'No se encuentra el generador de ejemplos');
const replacement=[
'function exampleCells(n,kind){',
' const target=[[3,2],[5,4],[7,3],[9,5],[11,8],[13,6]].slice(0,n).map(([a,b])=>new Q(a,b));',
' let rows=Array.from({length:n},(_,i)=>{',
'  const coeff=Array.from({length:n},(_,j)=>new Q(i===j?n+1:1));',
'  return [...coeff,coeff.reduce((sum,q,j)=>sum.add(q.mul(target[j])),z())];',
' });',
" if(kind!=='unique'){",
"  if(n===1)rows=[[z(),kind==='none'?one():z()]];",
'  else{',
'   rows[n-1]=rows[0].map(q=>q.mul(new Q(2)));',
"   if(kind==='none')rows[n-1][n]=rows[n-1][n].add(one());",
'  }',
' }',
' return rows.map(row=>row.map(q=>q.toString()));',
'}'
].join('\n');
writeFileSync(path,src.slice(0,begin)+replacement+src.slice(end));
console.log('OK: ejemplos con soluciones fraccionarias y clasificación conservada.');
