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
 const line=equation=>'<p class="math" data-algebra-line>'+equation+'</p>';
 function addStep(title,equations){
  html+='<details class="solution-step algebra-step" open><summary>Paso '+(++number)+'. '+title+'</summary>'+equations.map(line).join('')+'</details>';
 }
 const coefficient=(q,c)=>classicalLinear(vars.map((_,k)=>k===c?q:z()),vars);
 function isolate(row,c){
  const v=variable(vars[c]),p=row.a[c],terms=row.a.map((q,k)=>k===c?z():q.neg());
  const rhs=classicalAffine(row.b,terms,vars);
  addStep('Despejar '+v+' en '+row.label+': pasar los demás términos al segundo miembro',[
   classicalEquation(row,vars),coefficient(p,c)+' = '+rhs
  ]);
  if(p.n===p.d)return;
  addStep('Dividir los dos miembros entre '+qhtml(p),[v+' = ('+rhs+') / ('+qhtml(p)+')']);
  addStep('Simplificar el despeje de '+v,[v+' = '+classicalAffine(row.b.div(p),terms.map(q=>q.div(p)),vars)]);
 }
 if(method==='auto')html+='<p>Automático: se ha elegido '+classicalNames[trace.method].toLowerCase()+' al comparar las operaciones algebraicas estimadas de los tres métodos.</p>';
 html+='<p>Sistema inicial:</p><div class="algebra-equations">'+A.map((a,i)=>'<p class="math">E'+(i+1)+': '+classicalEquation({a,b:b[i]},vars)+'</p>').join('')+'</div>';
 for(const step of trace.steps){
  const c=step.relation.c,v=variable(vars[c]);
  if(step.type==='isolate'){
   isolate(step.row,c);continue;
  }
  if(step.type==='back'){
   const source=step.relation.source,p=source.a[c];
   const known=source.a.map((q,k)=>({q,k})).filter(t=>t.k!==c&&!t.q.zero);
   let rhs=source.b;
   if(known.length){
    const products=known.map(({q,k})=>({q:q.mul(step.values[k]),k:null}));
    const substitutions=known.map(({q,k})=>classicalProduct(q,step.values[k]));
    addStep('Sustituir los valores conocidos en '+source.label,[
     classicalEquation(source,vars),coefficient(p,c)+' + '+substitutions.join(' + ')+' = '+qhtml(source.b)
    ]);
    addStep('Calcular los productos numéricos',[
     classicalTerms([{q:p,k:c},...products],vars)+' = '+qhtml(source.b)
    ]);
    addStep('Pasar los términos numéricos al segundo miembro',[
     coefficient(p,c)+' = '+qhtml(source.b)+products.map(t=>' − ('+qhtml(t.q)+')').join('')
    ]);
    rhs=products.reduce((acc,t)=>acc.sub(t.q),source.b);
    if(p.n!==p.d)addStep('Calcular el término independiente',[coefficient(p,c)+' = '+qhtml(rhs)]);
   }else addStep('Resolver la ecuación de una incógnita '+source.label,[classicalEquation(source,vars)]);
   if(p.n!==p.d)addStep('Dividir los dos miembros entre '+qhtml(p)+' para obtener '+v,[v+' = ('+qhtml(rhs)+') / ('+qhtml(p)+')']);
   addStep('Obtener el valor de '+v,[v+' = '+qhtml(step.value)]);
   continue;
  }
  const row=step.row,pivot=step.pivot,p=pivot.a[c],q=row.a[c];
  if(step.type==='elimination'){
   const [f,h]=step.multipliers;
   const first={a:row.a.map(t=>t.mul(f)),b:row.b.mul(f)},second={a:pivot.a.map(t=>t.mul(h)),b:pivot.b.mul(h)};
   addStep('Elegir multiplicadores para eliminar '+v,[classicalProduct(f,q)+' + '+classicalProduct(h,p)+' = 0']);
   addStep('Multiplicar '+row.label+' por '+qhtml(f),[
    classicalDistributed(f,row,-1,vars)+' = '+classicalProduct(f,row.b),classicalEquation(first,vars)
   ]);
   addStep('Multiplicar '+pivot.label+' por '+qhtml(h),[
    classicalDistributed(h,pivot,-1,vars)+' = '+classicalProduct(h,pivot.b),classicalEquation(second,vars)
   ]);
   const sums=vars.map((name,k)=>first.a[k].zero&&second.a[k].zero?'':'(('+qhtml(first.a[k])+') + ('+qhtml(second.a[k])+')) · '+variable(name)).filter(Boolean);
   addStep('Sumar las ecuaciones miembro a miembro',[(sums.join(' + ')||'0')+' = ('+qhtml(first.b)+') + ('+qhtml(second.b)+')']);
   addStep('Calcular las sumas y obtener '+step.label,[classicalEquation(step.result,vars)]);
   continue;
  }
  if(step.type==='equalization'){
   isolate(row,c);
   addStep('Igualar los dos despejes de '+v,[classicalIsolated(pivot,c,vars)+' = '+classicalIsolated(row,c,vars)]);
   const pivotNumerator=classicalAffine(pivot.b,pivot.a.map((t,k)=>k===c?z():t.neg()),vars);
   const rowNumerator=classicalAffine(row.b,row.a.map((t,k)=>k===c?z():t.neg()),vars);
   if(p.n!==p.d||q.n!==q.d)addStep('Quitar denominadores multiplicando los dos miembros por ('+qhtml(p)+') · ('+qhtml(q)+')',[
    '('+qhtml(q)+') · ('+pivotNumerator+') = ('+qhtml(p)+') · ('+rowNumerator+')'
   ]);
   addStep('Desarrollar los paréntesis con la propiedad distributiva',[
    classicalDistributed(q,pivot,c,vars,true)+' = '+classicalDistributed(p,row,c,vars,true)
   ]);
   const left=[{q:q.mul(pivot.b),k:null},...pivot.a.map((t,k)=>({q:k===c?z():q.mul(t).neg(),k}))];
   const right=[{q:p.mul(row.b),k:null},...row.a.map((t,k)=>({q:k===c?z():p.mul(t).neg(),k}))];
   addStep('Calcular los productos',[classicalTerms(left,vars)+' = '+classicalTerms(right,vars)]);
  }else{
   const other=row.a.map((t,k)=>k===c?z():t),otherText=classicalLinear(other,vars);
   addStep('Sustituir el despeje de '+v+' en '+row.label,[
    '('+qhtml(q)+') · ('+classicalIsolated(pivot,c,vars)+') + ('+otherText+') = '+qhtml(row.b)
   ]);
   const numerator=classicalAffine(pivot.b,pivot.a.map((t,k)=>k===c?z():t.neg()),vars);
   if(p.n!==p.d)addStep('Quitar el denominador multiplicando los dos miembros por '+qhtml(p),[
    '('+qhtml(q)+') · ('+numerator+') + ('+qhtml(p)+') · ('+otherText+') = '+classicalProduct(p,row.b)
   ]);
   addStep('Desarrollar los paréntesis con la propiedad distributiva',[
    classicalDistributed(q,pivot,c,vars,true)+' + '+classicalDistributed(p,row,c,vars)+' = '+classicalProduct(p,row.b)
   ]);
   const products=[{q:q.mul(pivot.b),k:null}];
   vars.forEach((_,k)=>{if(k!==c)products.push({q:q.mul(pivot.a[k]).neg(),k},{q:p.mul(row.a[k]),k})});
   addStep('Calcular los productos',[classicalTerms(products,vars)+' = '+qhtml(p.mul(row.b))]);
  }
  const items=[];
  vars.forEach((_,k)=>{if(k!==c)items.push({q:q.mul(pivot.a[k]).neg(),k},{q:p.mul(row.a[k]),k})});
  const right='('+qhtml(p.mul(row.b))+') − ('+qhtml(q.mul(pivot.b))+')';
  addStep('Pasar las incógnitas al primer miembro y los números al segundo',[
   classicalTerms(items,vars)+' = '+right
  ]);
  const grouped=vars.map((name,k)=>k===c||(pivot.a[k].zero&&row.a[k].zero)?'':'(('+qhtml(q.mul(pivot.a[k]).neg())+') + ('+qhtml(p.mul(row.a[k]))+')) · '+variable(name)).filter(Boolean);
  addStep('Agrupar los coeficientes de cada incógnita',[(grouped.join(' + ')||'0')+' = '+right]);
  addStep('Calcular las sumas y restas y obtener '+step.label,[classicalEquation(step.result,vars)]);
 }
 if(trace.kind!=='unique'){
  html+='<h3>Compatibilidad del sistema</h3>'+trace.remaining.map(r=>'<p class="math">'+r.label+': '+classicalEquation(r,vars)+'</p>').join('');
  html+=trace.kind==='none'?'<p>Se obtiene una contradicción: 0 es igual a un número distinto de cero. No existe solución.</p>':'<p>Las ecuaciones restantes son identidades o quedan incógnitas libres. Hay infinitas soluciones; la parametrización se muestra a continuación.</p>';
 }
 return html;
}

if(typeof module!=='undefined')module.exports={classicalSolve,chooseClassical};
