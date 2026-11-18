import test from 'node:test';
import assert from 'node:assert/strict';
import {meshSystem,solveMeshCircuit,solveLinearSystem} from './mesh-engine.mjs';
import {type5Topology,type5System,type5Solve,type5IntegerExample} from './type5-model.mjs';

test('tipo 5: el sistema eléctrico coincide con la topología IEC',()=>{
 const {A,b}=type5System();
 assert.deepEqual(A,[[6,-4,0],[-4,15,-6],[0,-6,9]]);
 assert.deepEqual(b,[10,12,-3]);
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

test('tipo 5: los valores iniciales tienen soluciones enteras',()=>{
 const result=type5Solve();
 assert.deepEqual(result.mesh.map(Math.round),[3,2,1]);
 assert.ok(result.mesh.every(value=>Math.abs(value-Math.round(value))<1e-9));
});
test('tipo 5: generador de 500 ejemplos enteros con conservación de potencia',()=>{
 for(let i=0;i<500;i++){
  const sample=type5IntegerExample();
  const result=type5Solve(sample.R,sample.U);
  assert.ok(result.mesh.every((value,j)=>Math.abs(value-sample.mesh[j])<1e-8));
  assert.ok(Object.values(result.branches).every(value=>Math.abs(value-Math.round(value))<1e-8));
  assert.ok(result.residual.every(value=>Math.abs(value)<1e-8));
  assert.ok(Math.abs(result.resistorPower-result.sourcePower)<1e-8);
 }
});
