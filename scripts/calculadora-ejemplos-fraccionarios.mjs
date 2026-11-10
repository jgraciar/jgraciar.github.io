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
" const values=['1.5','1.25','2.75','1.8','1.375','2.625'];",
' const target=values.slice(0,n).map(Q.from);',
' let rows=Array.from({length:n},(_,i)=>{',
'  const coeff=Array.from({length:n},(_,j)=>new Q(i===j?2*n+1:1,2));',
'  return [...coeff,coeff.reduce((sum,q,j)=>sum.add(q.mul(target[j])),z())];',
' });',
" if(kind!=='unique'){",
"  if(n===1)rows=[[z(),kind==='none'?one():z()]];",
'  else{',
'   rows[n-1]=rows[0].map(q=>q.mul(new Q(2)));',
"   if(kind==='none')rows[n-1][n]=rows[n-1][n].add(one());",
'  }',
' }',
' const format=q=>{',
'  const negative=q.n<0n,abs=negative?-q.n:q.n,scaled=abs*10000n;',
"  if(scaled%q.d!==0n)throw Error('El ejemplo debe tener una representación decimal exacta');",
"  const s=(scaled/q.d).toString().padStart(5,'0');",
"  const integer=s.slice(0,-4),fraction=s.slice(-4).replace(/0+$/,'');",
"  return (negative?'-':'')+integer+(fraction?(region==='eu'?',':'.')+fraction:'');",
' };',
' return rows.map(row=>row.map(format));',
'}'
].join('\n');
writeFileSync(path,src.slice(0,begin)+replacement+src.slice(finish));
console.log('OK: ejemplos expresados con números decimales exactos en ambos formatos regionales.');
