// Topología de la fotografía: cinco resistencias, tres fuentes y tres mallas.
// Referencias: R1 y R4 arriba; R3 central; R5 transversal; R2 abajo.
// U1 y U2: polo positivo arriba; U3: polo positivo a la derecha.
// Las corrientes de malla se definen en sentido horario.
export const type5Topology={
 id:'type5-3m5r3u',meshes:3,
 resistors:['R1','R2','R3','R4','R5'],
 sources:['U1','U2','U3'],
 defaultR:{R1:2,R2:3,R3:4,R4:5,R5:6},
 defaultU:{U1:22,U2:12,U3:3},
 // Matriz de incidencia de resistencias en cada malla; filas M1,M2,M3.
 incidence:[
  [1,0,1,0,0],
  [0,0,-1,1,1],
  [0,1,0,0,-1]
 ]
};
import {meshSystem,solveMeshCircuit} from './mesh-engine.mjs';
function config(R,U){
 for(const id of type5Topology.sources)if(!Number.isFinite(U[id]))throw Error('Fuente no válida: '+id);
 return {incidence:type5Topology.incidence,resistors:type5Topology.resistors,resistance:R,sourceTerms:[U.U1-U.U2,U.U2,-U.U3]};
}
export function type5System(R=type5Topology.defaultR,U=type5Topology.defaultU){
 return meshSystem(config(R,U));
}
export function type5Solve(R=type5Topology.defaultR,U=type5Topology.defaultU){
 const result=solveMeshCircuit(config(R,U));
 const sourcePower=U.U1*result.branches.R1-U.U2*result.branches.R3-U.U3*result.branches.R2;
 return {...result,sourcePower};
}

/** Generate a circuit whose mesh and branch currents are all integers. */
export function type5IntegerExample(random=Math.random){
 const rand=(min,max)=>min+Math.floor(random()*(max-min+1));
 for(let attempt=0;attempt<1000;attempt++){
  const R=Object.fromEntries(type5Topology.resistors.map(id=>[id,rand(1,9)]));
  const mesh=Array.from({length:3},()=>rand(-3,3));
  if(mesh.every(v=>v===0))continue;
  const {A}=type5System(R,{U1:0,U2:0,U3:0});
  const b=A.map(row=>row.reduce((sum,value,i)=>sum+value*mesh[i],0));
  const U={U2:b[1],U1:b[0]+b[1],U3:-b[2]};
  if(Object.values(U).some(value=>Math.abs(value)>90))continue;
  return {R,U,mesh};
 }
 throw Error('No se ha podido generar un circuito con solución entera');
}
