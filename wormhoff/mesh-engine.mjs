// Motor algebraico común para circuitos de corriente continua descritos por mallas.
// incidence[m][r]: +1 si la malla atraviesa la resistencia en su referencia,
// -1 si lo hace en sentido contrario, 0 si no pertenece a la malla.
export function meshSystem({incidence,resistors,resistance,sourceTerms}){
 const n=incidence.length;
 if(!n||sourceTerms.length!==n||incidence.some(row=>row.length!==resistors.length))throw Error('Dimensiones de mallas incompatibles');
 for(const id of resistors)if(!Number.isFinite(resistance[id])||resistance[id]<=0)throw Error('Resistencia no válida: '+id);
 if(sourceTerms.some(v=>!Number.isFinite(v)))throw Error('Término independiente no válido');
 const A=incidence.map(row=>incidence.map(other=>row.reduce((sum,sign,j)=>sum+sign*other[j]*resistance[resistors[j]],0)));
 return {A,b:sourceTerms.slice()};
}
export function solveLinearSystem(A,b){
 const n=b.length;
 if(A.length!==n||A.some(row=>row.length!==n))throw Error('Sistema no cuadrado');
 const m=A.map((row,i)=>[...row,b[i]]);
 for(let k=0;k<n;k++){
  let pivot=k;
  for(let i=k+1;i<n;i++)if(Math.abs(m[i][k])>Math.abs(m[pivot][k]))pivot=i;
  if(Math.abs(m[pivot][k])<1e-12)throw Error('Sistema singular');
  [m[k],m[pivot]]=[m[pivot],m[k]];
  const d=m[k][k];for(let j=k;j<=n;j++)m[k][j]/=d;
  for(let i=0;i<n;i++)if(i!==k){const f=m[i][k];for(let j=k;j<=n;j++)m[i][j]-=f*m[k][j];}
 }
 return m.map(row=>row[n]);
}
export function solveMeshCircuit(config){
 const {incidence,resistors,resistance,sourceTerms}=config;
 const {A,b}=meshSystem(config);
 const mesh=solveLinearSystem(A,b);
 const branches=Object.fromEntries(resistors.map((id,j)=>[id,incidence.reduce((sum,row,k)=>sum+row[j]*mesh[k],0)]));
 const residual=A.map((row,i)=>row.reduce((sum,v,k)=>sum+v*mesh[k],0)-b[i]);
 const resistorPower=resistors.reduce((sum,id)=>sum+resistance[id]*branches[id]**2,0);
 return {A,b,mesh,branches,residual,resistorPower};
}
