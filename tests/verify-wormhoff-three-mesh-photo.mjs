// Reference mesh equations for the five-resistor, three-source circuit
// supplied in the user's photograph (two upper meshes, one lower mesh).
// The source image does not specify numeric values: these are test values.
// Clockwise mesh currents M1, M2, M3. U1/U2 positive at top; U3 positive at right.
import assert from 'node:assert/strict';
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
for(let i=0;i<3;i++){
 const residual=A[i].reduce((sum,value,j)=>sum+value*currents[j],0)-b[i];
 assert(Math.abs(residual)<1e-10,'Mesh '+(i+1)+' violates KVL');
}
assert.deepEqual(A,[[6,-4,0],[-4,15,-6],[0,-6,9]]);
assert.deepEqual(b,[6,6,-9]);
console.log('Three-mesh photo reference: KVL equations verified',currents);
