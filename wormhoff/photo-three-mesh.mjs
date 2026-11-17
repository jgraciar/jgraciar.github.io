// Topología de la fotografía: cinco resistencias, tres fuentes y tres mallas.
// Referencias: R1 y R4 arriba; R3 central; R5 transversal; R2 abajo.
// U1 y U2: polo positivo arriba; U3: polo positivo a la derecha.
// Las corrientes de malla se definen en sentido horario.
export const photoTopology={
 id:'photo-5r3u',meshes:3,
 resistors:['R1','R2','R3','R4','R5'],
 sources:['U1','U2','U3'],
 defaultR:{R1:2,R2:3,R3:4,R4:5,R5:6},
 defaultU:{U1:12,U2:6,U3:9},
 // Matriz de incidencia de resistencias en cada malla; filas M1,M2,M3.
 incidence:[
  [1,0,1,0,0],
  [0,0,-1,1,1],
  [0,1,0,0,-1]
 ]
};
export function photoSystem(R=photoTopology.defaultR,U=photoTopology.defaultU){
 const {incidence,resistors}=photoTopology;
 for(const id of resistors)if(!Number.isFinite(R[id])||R[id]<=0)throw Error('Resistencia no válida: '+id);
 for(const id of photoTopology.sources)if(!Number.isFinite(U[id]))throw Error('Fuente no válida: '+id);
 const A=incidence.map(row=>incidence.map(other=>row.reduce((sum,sign,j)=>sum+sign*other[j]*R[resistors[j]],0)));
 return {A,b:[U.U1-U.U2,U.U2,-U.U3]};
}
export function photoSolve(R=photoTopology.defaultR,U=photoTopology.defaultU){
 const {A,b}=photoSystem(R,U);
 const n=3,m=A.map((row,i)=>[...row,b[i]]);
 for(let k=0;k<n;k++){
  let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(m[i][k])>Math.abs(m[pivot][k]))pivot=i;
  if(Math.abs(m[pivot][k])<1e-12)throw Error('Sistema singular');
  [m[k],m[pivot]]=[m[pivot],m[k]];
  const d=m[k][k];for(let j=k;j<=n;j++)m[k][j]/=d;
  for(let i=0;i<n;i++)if(i!==k){const f=m[i][k];for(let j=k;j<=n;j++)m[i][j]-=f*m[k][j];}
 }
 const mesh=m.map(row=>row[n]);
 const branches=Object.fromEntries(photoTopology.resistors.map((id,j)=>[id,photoTopology.incidence.reduce((sum,row,k)=>sum+row[j]*mesh[k],0)]));
 const residual=A.map((row,i)=>row.reduce((sum,v,k)=>sum+v*mesh[k],0)-b[i]);
 const resistorPower=photoTopology.resistors.reduce((sum,id)=>sum+R[id]*branches[id]**2,0);
 const sourcePower=U.U1*branches.R1-U.U2*branches.R3-U.U3*branches.R2;
 return {A,b,mesh,branches,residual,resistorPower,sourcePower};
}
