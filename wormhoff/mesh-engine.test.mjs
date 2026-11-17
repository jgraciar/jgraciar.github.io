import test from 'node:test';
import assert from 'node:assert/strict';
import {meshSystem,solveMeshCircuit,solveLinearSystem} from './mesh-engine.mjs';
import {photoTopology,photoSystem,photoSolve} from './photo-three-mesh.mjs';

test('tipo 5: el sistema eléctrico coincide con la topología IEC',()=>{
 const {A,b}=photoSystem();
 assert.deepEqual(A,[[6,-4,0],[-4,15,-6],[0,-6,9]]);
 assert.deepEqual(b,[6,6,-9]);
});
test('tipo 5: KVL y conservación de potencia',()=>{
 const s=photoSolve();
 assert.ok(s.residual.every(v=>Math.abs(v)<1e-9));
 assert.ok(Math.abs(s.resistorPower-s.sourcePower)<1e-9);
 for(const id of photoTopology.resistors)assert.ok(Number.isFinite(s.branches[id]));
});
test('motor: admite otras matrices de mallas y rechaza sistemas singulares',()=>{
 const s=solveMeshCircuit({incidence:[[1,1],[0,-1]],resistors:['a','b'],resistance:{a:2,b:3},sourceTerms:[7,-3]});
 assert.ok(s.residual.every(v=>Math.abs(v)<1e-10));
 assert.deepEqual(s.mesh,[2,1]);
 assert.throws(()=>solveLinearSystem([[1,2],[2,4]],[3,6]),/singular/);
 assert.throws(()=>meshSystem({incidence:[[1]],resistors:['a'],resistance:{a:0},sourceTerms:[1]}),/Resistencia/);
});
