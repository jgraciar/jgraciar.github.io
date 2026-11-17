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
import {meshSystem,solveMeshCircuit} from './mesh-engine.mjs';
function config(R,U){
 for(const id of photoTopology.sources)if(!Number.isFinite(U[id]))throw Error('Fuente no válida: '+id);
 return {incidence:photoTopology.incidence,resistors:photoTopology.resistors,resistance:R,sourceTerms:[U.U1-U.U2,U.U2,-U.U3]};
}
export function photoSystem(R=photoTopology.defaultR,U=photoTopology.defaultU){
 return meshSystem(config(R,U));
}
export function photoSolve(R=photoTopology.defaultR,U=photoTopology.defaultU){
 const result=solveMeshCircuit(config(R,U));
 const sourcePower=U.U1*result.branches.R1-U.U2*result.branches.R3-U.U3*result.branches.R2;
 return {...result,sourcePower};
}
