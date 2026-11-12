'use strict';

// Operaciones exactas con Q, compartidas por las dos formas de entrada.
const classicalNames = {equalization:'Igualación', elimination:'Reducción', substitution:'Sustitución'};
function classicalSolve(A, b, method) {
 if (!classicalNames[method]) throw Error('Método algebraico desconocido.');
 const n=A[0].length, steps=[], relations=[];
 let rows=A.map((a,i)=>({a:[...a], b:b[i], label:'E'+(i+1)})), active=Array.from({length:n},(_,i)=>i);
 let operations=0, serial=0;
 const unit=q=>q.n===q.d||q.n===-q.d;
 const multiply=(a,b)=>{if(!a.zero&&!b.zero&&!unit(a)&&!unit(b))operations++;return a.mul(b)};
 const add=(a,b)=>{if(!a.zero&&!b.zero)operations++;return a.add(b)};
 const rowCopy=r=>({a:[...r.a], b:r.b, label:r.label});
 const size=q=>q.n.toString().length+q.d.toString().length;
 while (active.length && rows.length) {
  // Preferir coeficientes unidad y despejes con menos términos.
  const choices=[];
  rows.forEach((r,i)=>active.forEach(c=>{
   if(!r.a[c].zero) choices.push({i,c,cost:(r.a[c].n===r.a[c].d||r.a[c].n===-r.a[c].d?0:10)+active.filter(k=>!r.a[k].zero).length+size(r.a[c])/100});
  }));
  if(!choices.length)break;
  choices.sort((a,b)=>a.cost-b.cost||a.c-b.c||a.i-b.i);
  const {i,c}=choices[0], pivot=rows[i], p=pivot.a[c], rest=rows.filter((_,j)=>j!==i);
  const relation={c, constant:pivot.b.div(p), terms:pivot.a.map((q,k)=>k===c?z():q.neg().div(p)),source:rowCopy(pivot)};
  if(method!=='elimination'&&!unit(p))operations+=1+active.filter(k=>k!==c&&!pivot.a[k].zero).length;
  relations.push(relation);
  if(method!=='elimination'&&rest.some(r=>!r.a[c].zero))steps.push({type:'isolate',label:pivot.label,row:rowCopy(pivot),relation});
  rows=rest.map(r=>{
   const q=r.a[c];
   if(q.zero)return r;
   const label='R'+(++serial);
   let a, rhs, multipliers;
   if(method==='elimination'){
    // Mínimos multiplicadores enteros, también con coeficientes fraccionarios.
    const u=p.n*q.d, v=q.n*p.d, g=gcd(u,v);
    const f=new Q(u/g), h=new Q(-v/g);
    a=r.a.map((value,k)=>add(multiply(value,f),multiply(pivot.a[k],h)));
    rhs=add(multiply(r.b,f),multiply(pivot.b,h));multipliers=[f,h];
   }else if(method==='equalization'){
    // Despejar la misma variable en las dos ecuaciones e igualar.
    a=r.a.map((value,k)=>k===c?z():add(multiply(p,value),multiply(q,pivot.a[k]).neg()));
    rhs=add(multiply(p,r.b),multiply(q,pivot.b).neg());
   }else{
    // Sustituir el despeje de la ecuación pivote en cada ecuación restante.
    a=r.a.map((value,k)=>k===c?z():add(multiply(p,value),multiply(q,pivot.a[k]).neg()));
    rhs=add(multiply(p,r.b),multiply(q,pivot.b).neg());
   }
   const result={a,b:rhs,label};
   steps.push({type:method,label,row:rowCopy(r),pivot:rowCopy(pivot),relation,result:rowCopy(result),multipliers});
   return result;
  });
  active=active.filter(k=>k!==c);
 }
 const contradiction=rows.find(r=>r.a.every(q=>q.zero)&&!r.b.zero);
 const kind=contradiction?'none':relations.length<n?'infinite':'unique';
 const x=kind==='unique'?Array.from({length:n},z):null;
 if(x){
  for(const relation of [...relations].reverse()){
   const value=relation.terms.reduce((acc,q,k)=>acc.add(q.mul(x[k])),relation.constant);
   x[relation.c]=value;
   steps.push({type:'back',relation,value,values:[...x]});
  }
 }
 return {kind,x,steps,remaining:rows,operations,method};
}

function chooseClassical(A,b){
 // Comparar las operaciones de las tres resoluciones exactas.
 return Object.keys(classicalNames).map(method=>classicalSolve(A,b,method))
  .sort((a,b)=>a.operations-b.operations||a.steps.length-b.steps.length)[0];
}

function classicalEquation(row,vars){
 const terms=[];
 row.a.forEach((q,k)=>{
  if(q.zero)return;
  const negative=q.n<0n, abs=negative?q.neg():q;
  terms.push((terms.length?(negative?' − ':' + '):(negative?'−':''))+(abs.n===abs.d?'':qhtml(abs)+' · ')+variable(vars[k]));
 });
 return (terms.join('')||'0')+' = '+qhtml(row.b);
}
function classicalAffine(constant,terms,vars){
 let text=constant.zero?'':qhtml(constant);
 terms.forEach((q,k)=>{
  if(q.zero)return;
  const negative=q.n<0n,abs=negative?q.neg():q;
  text+=(text?(negative?' − ':' + '):(negative?'−':''))+(abs.n===abs.d?'':qhtml(abs)+' · ')+variable(vars[k]);
 });
 return text||'0';
}
function classicalIsolated(row,c,vars){
 const terms=row.a.map((q,k)=>k===c?z():q.neg());
 if(row.a[c].n===row.a[c].d)return classicalAffine(row.b,terms,vars);
 return '('+classicalAffine(row.b,terms,vars)+') / ('+qhtml(row.a[c])+')';
}
// Cada línea conserva una igualdad verificable; cada transformación tiene su paso.
function classicalLinear(a,vars){return classicalEquation({a,b:z()},vars).split(' = ')[0]}
function classicalTerms(items,vars){
 let text='';
 for(const {q,k} of items){
  if(q.zero)continue;
  const negative=q.n<0n,abs=negative?q.neg():q;
  const value=k===null?qhtml(abs):(abs.n===abs.d?'':qhtml(abs)+' · ')+variable(vars[k]);
  text+=(text?(negative?' − ':' + '):(negative?'−':''))+value;
 }
 return text||'0';
}
function classicalProduct(f,q){return '('+qhtml(f)+') · ('+qhtml(q)+')'}
function classicalDistributed(f,row,c,vars,withConstant=false){
 const terms=withConstant?[classicalProduct(f,row.b)]:[];
 row.a.forEach((q,k)=>{if(k!==c&&!q.zero)terms.push(classicalProduct(f,withConstant?q.neg():q)+' · '+variable(vars[k]))});
 return terms.join(' + ')||'0';
}
function renderClassical(A,b,vars,method){
 const trace=method==='auto'?chooseClassical(A,b):classicalSolve(A,b,method);
 let html='<h3>Resolución por '+classicalNames[trace.method].toLowerCase()+'</h3>',number=0;
 function addStep(title,equations){
  const unique=[...new Set(equations)];
  html+='<details class="solution-step algebra-step" open><summary>Paso '+(++number)+'. '+title+'</summary>'+unique.map(equation=>'<p class="math" data-algebra-line>'+equation+'</p>').join('')+'</details>';
 }
 const coefficient=(q,c)=>classicalLinear(vars.map((_,k)=>k===c?q:z()),vars);
 function isolate(row,c){
  const v=variable(vars[c]),p=row.a[c],terms=row.a.map((q,k)=>k===c?z():q.neg());
  const rhs=classicalAffine(row.b,terms,vars),lines=[];
  if(p.n!==p.d)lines.push(coefficient(p,c)+' = '+rhs);
  lines.push(v+' = '+classicalIsolated(row,c,vars));
  addStep('Despejar '+v+' en '+row.label,lines);
 }
 if(method==='auto')html+='<p>Automático: método elegido, '+classicalNames[trace.method].toLowerCase()+'.</p>';
 html+='<p>Sistema inicial:</p><div class="algebra-equations">'+A.map((a,i)=>'<p class="math">E'+(i+1)+': '+classicalEquation({a,b:b[i]},vars)+'</p>').join('')+'</div>';
 for(const step of trace.steps){
  const c=step.relation.c,v=variable(vars[c]);
  if(step.type==='isolate'){isolate(step.row,c);continue;}
  if(step.type==='back'){
   const source=step.relation.source,p=source.a[c];
   const known=source.a.map((q,k)=>({q,k})).filter(t=>t.k!==c&&!t.q.zero),lines=[];
   if(known.length){
    const substitutions=known.map(({q,k})=>classicalProduct(q,step.values[k]));
    const products=known.map(({q,k})=>({q:q.mul(step.values[k]),k:null}));
    lines.push(coefficient(p,c)+' + '+substitutions.join(' + ')+' = '+qhtml(source.b));
    const rhs=products.reduce((acc,t)=>acc.sub(t.q),source.b);
    if(p.n!==p.d)lines.push(coefficient(p,c)+' = '+qhtml(rhs),v+' = ('+qhtml(rhs)+') / ('+qhtml(p)+')');
   }else if(p.n!==p.d)lines.push(v+' = ('+qhtml(source.b)+') / ('+qhtml(p)+')');
   lines.push(v+' = '+qhtml(step.value));
   addStep(known.length?'Sustituir los valores conocidos en '+source.label+' y obtener '+v:'Obtener '+v,lines);
   continue;
  }
  const row=step.row,pivot=step.pivot,p=pivot.a[c],q=row.a[c];
  if(step.type==='elimination'){
   const [f,h]=step.multipliers;
   const first={a:row.a.map(t=>t.mul(f)),b:row.b.mul(f)},second={a:pivot.a.map(t=>t.mul(h)),b:pivot.b.mul(h)};
   addStep('Eliminar '+v+': ('+qhtml(f)+') · '+row.label+' + ('+qhtml(h)+') · '+pivot.label,[
    classicalEquation(first,vars),classicalEquation(second,vars),classicalEquation(step.result,vars)
   ]);
   continue;
  }
  const lines=[];
  if(step.type==='equalization'){
   isolate(row,c);
   lines.push(classicalIsolated(pivot,c,vars)+' = '+classicalIsolated(row,c,vars));
   const pivotNumerator=classicalAffine(pivot.b,pivot.a.map((t,k)=>k===c?z():t.neg()),vars);
   const rowNumerator=classicalAffine(row.b,row.a.map((t,k)=>k===c?z():t.neg()),vars);
   if(p.n!==p.d||q.n!==q.d)lines.push('('+qhtml(q)+') · ('+pivotNumerator+') = ('+qhtml(p)+') · ('+rowNumerator+')');
   const left=[{q:q.mul(pivot.b),k:null},...pivot.a.map((t,k)=>({q:k===c?z():q.mul(t).neg(),k}))];
   const right=[{q:p.mul(row.b),k:null},...row.a.map((t,k)=>({q:k===c?z():p.mul(t).neg(),k}))];
   lines.push(classicalTerms(left,vars)+' = '+classicalTerms(right,vars));
  }else{
   const other=row.a.map((t,k)=>k===c?z():t),otherText=classicalLinear(other,vars);
   lines.push('('+qhtml(q)+') · ('+classicalIsolated(pivot,c,vars)+')'+(otherText==='0'?'':' + ('+otherText+')')+' = '+qhtml(row.b));
   if(p.n!==p.d){
    const numerator=classicalAffine(pivot.b,pivot.a.map((t,k)=>k===c?z():t.neg()),vars);
    lines.push('('+qhtml(q)+') · ('+numerator+')'+(otherText==='0'?'':' + ('+qhtml(p)+') · ('+otherText+')')+' = '+qhtml(p.mul(row.b)));
   }
   const products=[{q:q.mul(pivot.b),k:null}];
   vars.forEach((_,k)=>{if(k!==c)products.push({q:q.mul(pivot.a[k]).neg(),k},{q:p.mul(row.a[k]),k})});
   lines.push(classicalTerms(products,vars)+' = '+qhtml(p.mul(row.b)));
  }
  lines.push(classicalEquation(step.result,vars));
  addStep((step.type==='equalization'?'Igualar los despejes de '+v:'Sustituir '+v+' en '+row.label)+' y simplificar para obtener '+step.label,lines);
 }
 if(trace.kind!=='unique'){
  html+='<h3>Compatibilidad del sistema</h3>'+trace.remaining.map(r=>'<p class="math">'+r.label+': '+classicalEquation(r,vars)+'</p>').join('');
  html+=trace.kind==='none'?'<p>La contradicción 0 igual a un número distinto de cero indica que no existe solución.</p>':'<p>Quedan identidades o incógnitas libres. La solución general se muestra al principio.</p>';
 }
 return html;
}

if(typeof module!=='undefined')module.exports={classicalSolve,chooseClassical};
