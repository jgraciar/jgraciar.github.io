/* Wormhoff · motor topológico de corriente continua (ES module).
   Cada rama conserva sus componentes; nunca calcula resistencias equivalentes.
   Convenio: corriente positiva de from a to; fuente positiva eleva el potencial
   de from a to; R·I = V(from)-V(to)+E. */
export function validateCircuit(circuit) {
  const {nodes,branches}=circuit;
  if(!Array.isArray(nodes)||nodes.length<2||new Set(nodes).size!==nodes.length)throw Error('Nudos no válidos');
  if(!Array.isArray(branches)||branches.length<2)throw Error('Ramas insuficientes');
  const ids=new Set();
  for(const b of branches){
    if(!b.id||ids.has(b.id)||!nodes.includes(b.from)||!nodes.includes(b.to)||b.from===b.to)throw Error('Rama incorrecta: '+b.id);
    ids.add(b.id);
    if(!Array.isArray(b.components)||!b.components.length)throw Error('Rama sin componentes: '+b.id);
    for(const c of b.components){
      if(!['R','E'].includes(c.type)||!Number.isFinite(c.value)||(c.type==='R'&&c.value<0)||c.type==='E'&&![1,-1].includes(c.polarity??1))throw Error('Componente inválido: '+b.id);
    }
  }
  const reached=new Set([nodes[0]]);
  let changed=true;
  while(changed){changed=false;for(const b of branches){if(reached.has(b.from)&&!reached.has(b.to)){reached.add(b.to);changed=true}if(reached.has(b.to)&&!reached.has(b.from)){reached.add(b.from);changed=true}}}
  if(reached.size!==nodes.length)throw Error('Circuito desconectado');
  return true;
}
export function branchTerms(b){
  return {R:b.components.filter(c=>c.type==='R').reduce((v,c)=>v+c.value,0),
    E:b.components.filter(c=>c.type==='E').reduce((v,c)=>v+c.value*(c.polarity??1),0)};
}
export function nodeEquations(circuit){
  validateCircuit(circuit);
  return circuit.nodes.slice(0,-1).map(node=>({
    node,coefficients:circuit.branches.map(b=>(b.to===node?1:0)-(b.from===node?1:0)),rhs:0
  }));
}
function spanningTree(circuit){
  const reached=new Set([circuit.nodes[0]]),tree=[],other=[];
  for(const b of circuit.branches){
    // Kruskal con conjuntos disjuntos para no depender del orden de las ramas
    other.push(b);
  }
  const parent=new Map(circuit.nodes.map(n=>[n,n]));
  function root(n){while(parent.get(n)!==n)n=parent.get(n);return n}
  const chords=[];
  for(const b of other){const a=root(b.from),z=root(b.to);if(a!==z){parent.set(a,z);tree.push(b)}else chords.push(b)}
  return {tree,chords};
}
export function independentMeshes(circuit){
  validateCircuit(circuit);
  const {tree,chords}=spanningTree(circuit);
  return chords.map(chord=>{
    // Cerramos la cuerda (from -> to) con un camino del árbol (to -> from).
    const queue=[{node:chord.to,path:[]}],visited=new Set([chord.to]);
    while(queue.length){
      const {node,path}=queue.shift();
      if(node===chord.from)return [{branchId:chord.id,direction:1},...path];
      for(const b of tree){
        const next=b.from===node?b.to:b.to===node?b.from:null;
        if(next&&!visited.has(next)){
          visited.add(next);queue.push({node:next,path:[...path,{branchId:b.id,direction:b.from===node?1:-1}]});
        }
      }
    }
    throw Error('No existe camino de cierre');
  });
}
export function meshEquations(circuit){
  return independentMeshes(circuit).map((mesh,index)=>{
    const coefficients=circuit.branches.map(b=>{
      const entry=mesh.find(e=>e.branchId===b.id);
      return entry?entry.direction*branchTerms(b).R:0;
    });
    const rhs=mesh.reduce((sum,e)=>{
      const b=circuit.branches.find(b=>b.id===e.branchId);
      return sum+e.direction*branchTerms(b).E;
    },0);
    return {mesh:index+1,edges:mesh,coefficients,rhs};
  });
}
export function linearSystem(circuit){
  const equations=[...nodeEquations(circuit),...meshEquations(circuit)];
  if(equations.length!==circuit.branches.length)throw Error('Sistema no cuadrado');
  return {A:equations.map(e=>e.coefficients),b:equations.map(e=>e.rhs),equations};
}
export function solveCurrents(circuit){
  const {A,b,equations}=linearSystem(circuit),n=b.length;
  const m=A.map((row,i)=>[...row,b[i]]),steps=[];
  for(let k=0;k<n;k++){
    let pivot=k;for(let i=k+1;i<n;i++)if(Math.abs(m[i][k])>Math.abs(m[pivot][k]))pivot=i;
    if(Math.abs(m[pivot][k])<1e-10)throw Error('Sistema singular: fuentes ideales incompatibles o circuito indeterminado');
    if(pivot!==k){[m[k],m[pivot]]=[m[pivot],m[k]];steps.push({action:'intercambiar',rows:[k,pivot]})}
    for(let i=k+1;i<n;i++){
      const factor=m[i][k]/m[k][k];if(Math.abs(factor)<1e-12)continue;
      steps.push({action:'eliminar',target:i,pivot:k,factor,before:[...m[i]],pivotRow:[...m[k]]});
      for(let j=k;j<=n;j++)m[i][j]-=factor*m[k][j];
      steps[steps.length-1].after=[...m[i]];
    }
  }
  const x=Array(n).fill(0);
  for(let i=n-1;i>=0;i--){
    const substitutions=[];let remaining=m[i][n];
    for(let j=i+1;j<n;j++){remaining-=m[i][j]*x[j];substitutions.push({coefficient:m[i][j],value:x[j],product:m[i][j]*x[j]})}
    x[i]=remaining/m[i][i];
    steps.push({action:'despejar',variable:circuit.branches[i].id,original:[...m[i]],substitutions,remaining,divisor:m[i][i],value:x[i]});
  }
  const residual=A.map((row,i)=>row.reduce((v,c,j)=>v+c*x[j],0)-b[i]);
  if(residual.some(v=>Math.abs(v)>1e-7))throw Error('Fallo de verificación de Kirchhoff');
  return {currents:Object.fromEntries(circuit.branches.map((branch,i)=>[branch.id,x[i]])),steps,equations,residual};
}
