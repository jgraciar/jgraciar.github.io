import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';const source=fs.readFileSync(new URL('../wormhoff/index.html',import.meta.url),'utf8');
const c={formatNumber:n=>String(n),rememberPhase(){},syncPhaseNavigation(){},show(){},$:()=>({textContent:'',replaceChildren(){}}),sixRenderSolve(){},sixMeshArrows(){},S:{score:0},A6:{},NAMES6:['I1','I2','I3','I4','I5','I6'],N6:{A:[350,74],B:[130,225],C:[350,225],D:[570,225]},EDGES6:[{from:'B',to:'A'},{from:'A',to:'C'},{from:'A',to:'D'},{from:'B',to:'C'},{from:'C',to:'D'},{from:'B',to:'D'}]};vm.createContext(c);
vm.runInContext('const fmt6=v=>formatNumber(v);'+source.slice(source.indexOf('  function nodeDefinitions('),source.indexOf('  function syncNodeSelection('))+source.slice(source.indexOf('  function sixChosenNodeIds('),source.indexOf('  function sixKCLRows('))+source.slice(source.indexOf('  function matSolve6('),source.indexOf('  function sixCancel('))+source.slice(source.indexOf('  function sixNodeSubstitution('),source.indexOf('  function sixRenderSolve(')),c);
const rows=[[4,3,0,-2,0,0],[0,-3,2,0,-5,0],[0,0,0,2,5,-3]],b=[16,-16,8];let physical,count=0;
const triples=[];for(const a of ['A','B','C','D'])for(const b of ['A','B','C','D'])for(const d of ['A','B','C','D'])if(new Set([a,b,d]).size===3)triples.push([a,b,d]);
for(const ids of triples)for(let mask=0;mask<64;mask++)for(let turns=0;turns<8;turns++){
 c.A6.nodeIds=ids;c.A6.signs=Array.from({length:6},(_,i)=>mask>>i&1?-1:1);c.A6.done=rows.map((r,k)=>{const factor=turns>>k&1?-1:1;return {row:r.map(v=>v*factor),b:b[k]*factor,cw:factor===1}});
 c.sixStartSolve();assert(c.A6.finalGood,`Nudos ${ids}, referencias ${mask}, giros ${turns}`);const result=Array.from(c.A6.finalCurrents,(v,i)=>v*c.A6.signs[i]);
 if(!physical)physical=result;else result.forEach((v,i)=>assert(Math.abs(v-physical[i])<1e-7));
 for(const step of c.A6.steps)for(const line of step.rows??[]){const values=(step.vars??c.NAMES6).map(name=>c.A6.finalCurrents[c.NAMES6.indexOf(name)]);assert(Math.abs(line.row.reduce((a,v,i)=>a+v*values[i],0)-line.b)<1e-6,step.title);}
 count++;
}
const definitions=c.nodeDefinitions(true);assert.equal(c.requiredNodeEquations(true),3);assert.equal(c.nodeEquationRank(definitions.map(n=>n.row)),3);for(const ids of triples)assert.equal(c.nodeEquationRank(definitions.filter(n=>ids.includes(n.id)).map(n=>n.row)),3);
console.log('OK:',count,'combinaciones de nudos elegidos, sentidos de corriente y giros; cada ecuación y cada paso satisfacen la solución');
const std={names:['I1','I2','I3'],formatNumber:String,fmt:String,active:{id:'demo'},jValues:[5,-1,-4],S:{signs:[1,1,1]}};
std.system=()=>({A:[std.S.signs.map(v=>v*(std.S.nodeSelected==='B'?-1:1)),[2,-2,0].map((v,i)=>v*std.S.signs[i]),[0,2,-2].map((v,i)=>v*std.S.signs[i])],b:[0,12,6]});std.finalISummary=()=>'';vm.createContext(std);
vm.runInContext(source.slice(source.indexOf('  function coefEq('),source.indexOf('  function bindClickable('))+source.slice(source.indexOf('  function buildSteps('),source.indexOf('  function renderSteps(')),std);
for(const id of ['A','B'])for(let mask=0;mask<8;mask++){std.S.nodeSelected=id;std.S.signs=Array.from({length:3},(_,i)=>mask>>i&1?-1:1);const values=std.jValues.map((v,i)=>v*std.S.signs[i]);for(const step of std.buildSteps())for(const row of step.rows??[])assert(Math.abs(row.row.reduce((a,v,i)=>a+v*values[i],0)-row.b)<1e-8);}
console.log('OK: elección de A o B en las 16 combinaciones del circuito de tres ramas');
