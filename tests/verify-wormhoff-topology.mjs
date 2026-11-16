import assert from 'node:assert/strict';
import {validateCircuit,nodeEquations,independentMeshes,linearSystem,solveCurrents} from '../wormhoff/topology.mjs';
const R=value=>({type:'R',value}),E=(value,polarity=1)=>({type:'E',value,polarity});
const cases=[
 {name:'A. Ejemplo 3.13',nodes:['A','B'],branches:[
 {id:'I1',from:'B',to:'A',components:[E(12),R(.1)]},
 {id:'I2',from:'B',to:'A',components:[E(12),R(.2)]},
 {id:'I3',from:'A',to:'B',components:[R(1)]}]},
 {name:'P. Resuelta 7.1',nodes:['A','B'],branches:[
 {id:'I1',from:'B',to:'A',components:[E(12),R(.2)]},
 {id:'I2',from:'B',to:'A',components:[E(11),R(.1)]},
 {id:'I3',from:'A',to:'B',components:[R(10)]}]},
 {name:'Puente de cuatro nudos y cinco ramas',nodes:['A','B','C','D'],branches:[
 {id:'I1',from:'A',to:'B',components:[E(20),R(4)]},
 {id:'I2',from:'B',to:'C',components:[R(2)]},
 {id:'I3',from:'C',to:'D',components:[R(3)]},
 {id:'I4',from:'D',to:'A',components:[R(5)]},
 {id:'I5',from:'B',to:'D',components:[R(7)]}]},
 {name:'Seis ramas y cuatro nudos',nodes:['A','B','C','D'],branches:[
 {id:'I1',from:'B',to:'A',components:[R(4),E(10)]},
 {id:'I2',from:'A',to:'C',components:[R(3)]},
 {id:'I3',from:'A',to:'D',components:[R(2),E(6,-1)]},
 {id:'I4',from:'B',to:'C',components:[R(2)]},
 {id:'I5',from:'C',to:'D',components:[R(5)]},
 {id:'I6',from:'B',to:'D',components:[R(3)]}]}
];
for(const c of cases){
 assert.equal(validateCircuit(c),true);
 assert.equal(nodeEquations(c).length,c.nodes.length-1);
 assert.equal(independentMeshes(c).length,c.branches.length-c.nodes.length+1);
 assert.equal(linearSystem(c).A.length,c.branches.length);
 const result=solveCurrents(c);
 assert.ok(result.residual.every(v=>Math.abs(v)<1e-8),c.name);
 assert.equal(Object.keys(result.currents).length,c.branches.length);
 console.log('OK',c.name,result.currents);
}
const a=solveCurrents(cases[0]).currents;
assert.ok(Math.abs(a.I1-7.5)<1e-8);
assert.ok(Math.abs(a.I2-3.75)<1e-8);
assert.ok(Math.abs(a.I3-11.25)<1e-8);
