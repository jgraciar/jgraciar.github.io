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
const replacement=String.raw`function exampleCells(n,kind){
 const random=(min,max)=>min+Math.floor(Math.random()*(max-min+1));
 const nonzero=max=>random(1,max)*(random(0,1)?1:-1);
 const previous=exampleCells.previous||(exampleCells.previous=new Map());
 const key=n+':'+kind;
 let rows,delta=1,signature;
 for(let attempt=0;attempt<10;attempt++){
  const target=Array.from({length:n},()=>random(-5,5));
  rows=Array.from({length:n},(_,i)=>{
   const a=Array.from({length:n},()=>random(-3,3));
   a[i]=(a.reduce((sum,q,j)=>sum+(i===j?0:Math.abs(q)),0)+random(1,3))*(random(0,1)?1:-1);
   return [...a,a.reduce((sum,q,j)=>sum+q*target[j],0)];
  });
  if(kind!=='unique'){
   delta=nonzero(5);
   if(n===1)rows=[[0,kind==='none'?delta:0]];
   else{
    const weights=Array.from({length:n-1},()=>nonzero(2));
    rows[n-1]=Array.from({length:n+1},(_,j)=>weights.reduce((sum,w,i)=>sum+w*rows[i][j],0));
    if(kind==='none')rows[n-1][n]+=delta;
   }
  }
  signature=JSON.stringify(rows);
  if(signature!==previous.get(key)||(n===1&&kind==='infinite'))break;
 }
 // Evitar repetir el mismo sistema incluso si el generador aleatorio se repite.
 if(signature===previous.get(key)&&!(n===1&&kind==='infinite')){
  if(kind==='unique')rows.forEach(r=>r[n]+=r[0]);
  else if(kind==='none')rows[n-1][n]+=delta;
  else rows[n-1]=rows[n-1].map(q=>2*q);
  signature=JSON.stringify(rows);
 }
 previous.set(key,signature);
 return rows.map(row=>row.map(String));
}`;
let output=src.slice(0,begin)+replacement+src.slice(finish);
const notice=output.split('\n').find(line=>line.includes("$('example-notice').textContent="));
assert(notice,'Falta el aviso de los ejemplos');
output=output.replace(notice," $('example-notice').textContent=n===1&&btn.dataset.example==='infinite'?'Con una incógnita, el caso de infinitas soluciones siempre es 0 = 0. Pulsa Resolver.':'Nuevo sistema aleatorio de '+n+' ecuación(es) y '+n+' incógnita(s). Pulsa Resolver.';");
writeFileSync(path,output);
console.log('OK: ejemplos aleatorios con datos enteros y compatibilidad garantizada.');
