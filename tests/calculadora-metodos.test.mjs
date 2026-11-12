import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,join} from 'node:path';
import vm from 'node:vm';

const dir=resolve(process.argv[2]||'site-root/calculadora');
const context=vm.createContext({});
vm.runInContext(readFileSync(join(dir,'solver.js'),'utf8')+'\n'+readFileSync(join(dir,'classical.js'),'utf8')+'\nfunction qhtml(q){return q.d===1n?String(q.n):"("+q.n+"/"+q.d+")"} function variable(v){return v} globalThis.api={Q,solve,classicalSolve,chooseClassical,parseSystem,renderClassical};',context);
const {Q,solve,classicalSolve,chooseClassical,parseSystem,renderClassical}=context.api;
let count=0,displayedEquations=0;
function check(A,b){
 A=A.map(r=>r.map(v=>v instanceof Q?v:new Q(v)));b=b.map(v=>v instanceof Q?v:new Q(v));
 const expected=solve(A,b);
 for(const method of ['equalization','elimination','substitution']){
  const actual=classicalSolve(A,b,method);
  assert.equal(actual.kind,expected.kind,method);
  if(actual.x)assert.equal(actual.x.map(String).join(','),expected.x.map(String).join(','),method);
  if(expected.x){
   const vars=A[0].map((_,k)=>'x'+k),html=renderClassical(A,b,vars,method);
   for(const match of html.matchAll(/<p class="math" data-algebra-line>(.*?)<\/p>/g)){
    const equation=match[1],parsed=parseSystem(equation,vars.join(','));
    const residual=parsed.A[0].reduce((sum,q,k)=>sum.add(q.mul(expected.x[k])),new Q(0)).sub(parsed.b[0]);
    assert(residual.zero,method+': igualdad incorrecta mostrada: '+equation);
    displayedEquations++;
   }
   assert(!html.includes('Operamos y agrupamos los términos:'),'No omitir operaciones intermedias');
  }
  for(const step of actual.steps){
   if(!step.result)continue;
   assert(step.result.a[step.relation.c].zero,'La variable elegida debe desaparecer.');
   if(expected.x)assert(step.result.a.reduce((s,q,k)=>s.add(q.mul(expected.x[k])),new Q(0)).sub(step.result.b).zero,'Cada ecuación derivada conserva la solución.');
   if(step.type==='elimination'){
    const [f,h]=step.multipliers;
    assert.equal(step.result.b.toString(),step.row.b.mul(f).add(step.pivot.b.mul(h)).toString());
    assert(step.result.a.every((q,k)=>q.sub(step.row.a[k].mul(f).add(step.pivot.a[k].mul(h))).zero));
   }
  }
  count++;
 }
 const automatic=chooseClassical(A,b);
 assert.equal(automatic.kind,expected.kind);
}
check([[2,3],[1,-1]],[12,1]);
check([[1,2],[2,4]],[3,6]);check([[1,2],[2,4]],[3,7]);
check([[0,1],[1,0]],[2,3]);check([[0,0],[0,0]],[0,0]);check([[0,0],[0,0]],[0,1]);
check([[0,1]],[2]);check([[0,0]],[0]);check([[0,0]],[1]);
check([[1],[2],[3]],[2,4,6]);check([[1],[2],[3]],[2,4,7]);
check([[new Q(-1,2),new Q(2,3)],[new Q(3,7),new Q(-5,4)]],[new Q(5,6),new Q(-2,9)]);
// Matrices aleatorias reproducibles: rectangulares, ceros, signos y fracciones.
let seed=20261112;
const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed;};
for(let n=1;n<=6;n++)for(let m=1;m<=8;m++)for(let trial=0;trial<12;trial++){
 const A=Array.from({length:m},()=>Array.from({length:n},()=>new Q(Number(random()%9)-4,Number(random()%4)+1)));
 const b=Array.from({length:m},()=>new Q(Number(random()%13)-6,Number(random()%3)+1));
 check(A,b);
}
console.log('OK: '+count+' resoluciones exactas y '+displayedEquations+' igualdades del desarrollo verificadas sustituyendo la solución.');
