// Reference mesh equations for the five-resistor, three-source circuit
// supplied in the user's photograph (two upper meshes, one lower mesh).
// The source image does not specify numeric values: these are test values.
// Clockwise mesh currents M1, M2, M3. U1/U2 positive at top; U3 positive at right.
import assert from 'node:assert/strict';
import {photoSystem,photoSolve} from '../wormhoff/photo-three-mesh.mjs';
const R={R1:2,R2:3,R3:4,R4:5,R5:6};
const U={U1:12,U2:6,U3:9};
const A=[
 [R.R1+R.R3,-R.R3,0],
 [-R.R3,R.R3+R.R4+R.R5,-R.R5],
 [0,-R.R5,R.R2+R.R5]
];
const b=[U.U1-U.U2,U.U2,-U.U3];
function solve(matrix,values){
 const m=matrix.map((row,i)=>[...row,values[i]]),n=m.length;
 for(let k=0;k<n;k++){
  let pivot=k;for(let j=k+1;j<n;j++)if(Math.abs(m[j][k])>Math.abs(m[pivot][k]))pivot=j;
  assert(Math.abs(m[pivot][k])>1e-12,'Circuit must have a unique solution');
  [m[k],m[pivot]]=[m[pivot],m[k]];
  const div=m[k][k];for(let j=k;j<=n;j++)m[k][j]/=div;
  for(let i=0;i<n;i++)if(i!==k){const f=m[i][k];for(let j=k;j<=n;j++)m[i][j]-=f*m[k][j];}
 }
 return m.map(row=>row[n]);
}
const currents=solve(A,b);
const reusable=photoSolve(R,U);
assert.deepEqual(photoSystem(R,U),{A,b},'El motor reutilizable reproduce las ecuaciones de la fotografía');
reusable.mesh.forEach((value,i)=>assert(Math.abs(value-currents[i])<1e-10,'Malla '+(i+1)+' coincide con la referencia independiente'));
for(const [id,value] of Object.entries(reusable.branches))assert(Number.isFinite(value),'Corriente de rama '+id);
assert(reusable.residual.every(v=>Math.abs(v)<1e-10),'Ecuaciones verificadas');
assert(Math.abs(reusable.resistorPower-reusable.sourcePower)<1e-10,'Balance de potencia del motor');

for(let i=0;i<3;i++){
 const residual=A[i].reduce((sum,value,j)=>sum+value*currents[j],0)-b[i];
 assert(Math.abs(residual)<1e-10,'Mesh '+(i+1)+' violates KVL');
}
// Reconstrucción de las cinco corrientes de rama del esquema original.
// Orientaciones: R1 izquierda→centro; R3 arriba→abajo; R4 centro→derecha;
// R5 derecha→izquierda; R2 derecha→izquierda (rama inferior).
const [m1,m2,m3]=currents;
const branch={R1:m1,R3:m1-m2,R4:m2,R5:m2-m3,R2:m3};
const close=(actual,expected,label)=>assert(Math.abs(actual-expected)<1e-10,label+': '+actual+' frente a '+expected);
// KCL en los dos nudos superiores y en el nudo derecho.
close(branch.R1,branch.R3+branch.R4,'KCL en nudo superior central');
close(branch.R4,branch.R5+branch.R2,'KCL en nudo derecho');
// KVL expresada con las corrientes físicas de cada resistencia.
close(R.R1*branch.R1+R.R3*branch.R3,U.U1-U.U2,'KVL malla superior izquierda');
close(R.R4*branch.R4+R.R5*branch.R5-R.R3*branch.R3,U.U2,'KVL malla superior derecha');
close(R.R2*branch.R2-R.R5*branch.R5,-U.U3,'KVL malla inferior');
// El balance de potencia comprueba las polaridades de las tres fuentes.
const dissipation=Object.entries(R).reduce((sum,[id,ohms])=>sum+ohms*branch[id]**2,0);
const sourcePower=U.U1*branch.R1-U.U2*branch.R3-U.U3*branch.R2;
close(dissipation,sourcePower,'Balance de potencia de resistencias y fuentes');
assert.deepEqual(A,[[6,-4,0],[-4,15,-6],[0,-6,9]]);
assert.deepEqual(b,[6,6,-9]);
console.log('Three-mesh photo reference: KVL equations verified',currents);
