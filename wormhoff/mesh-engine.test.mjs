import test from 'node:test';
import assert from 'node:assert/strict';
import {meshSystem,solveMeshCircuit,solveLinearSystem} from './mesh-engine.mjs';
import {type5Topology,type5System,type5Solve} from './type5-model.mjs';

test('tipo 5: el sistema eléctrico coincide con la topología IEC',()=>{
 const {A,b}=type5System();
 assert.deepEqual(A,[[6,-4,0],[-4,15,-6],[0,-6,9]]);
 assert.deepEqual(b,[6,6,-9]);
});
test('tipo 5: KVL y conservación de potencia',()=>{
 const s=type5Solve();
 assert.ok(s.residual.every(v=>Math.abs(v)<1e-9));
 assert.ok(Math.abs(s.resistorPower-s.sourcePower)<1e-9);
 for(const id of type5Topology.resistors)assert.ok(Number.isFinite(s.branches[id]));
});
test('motor: admite otras matrices de mallas y rechaza sistemas singulares',()=>{
 const s=solveMeshCircuit({incidence:[[1,1],[0,-1]],resistors:['a','b'],resistance:{a:2,b:3},sourceTerms:[7,-3]});
 assert.ok(s.residual.every(v=>Math.abs(v)<1e-10));
 assert.deepEqual(s.mesh,[2,1]);
 assert.throws(()=>solveLinearSystem([[1,2],[2,4]],[3,6]),/singular/);
 assert.throws(()=>meshSystem({incidence:[[1]],resistors:['a'],resistance:{a:0},sourceTerms:[1]}),/Resistencia/);
});
