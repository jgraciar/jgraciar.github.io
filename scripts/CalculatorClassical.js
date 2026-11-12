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
 const divide=(a,b)=>{if(!a.zero&&!unit(b))operations++;return a.div(b)};
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
  if(method!=='elimination')steps.push({type:'isolate',label:pivot.label,row:rowCopy(pivot),relation});
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
    a=r.a.map((value,k)=>k===c?z():add(divide(value,q),relation.terms[k]));
    rhs=add(divide(r.b,q),relation.constant.neg());
   }else{
    // Sustituir el despeje de la ecuación pivote en cada ecuación restante.
    a=r.a.map((value,k)=>k===c?z():add(value,multiply(q,relation.terms[k])));
    rhs=add(r.b,multiply(q,relation.constant).neg());
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
 return '('+classicalAffine(row.b,terms,vars)+') / ('+qhtml(row.a[c])+')';
}
function renderClassical(A,b,vars,method){
 const trace=method==='auto'?chooseClassical(A,b):classicalSolve(A,b,method);
 let html='<h3>Resolución por '+classicalNames[trace.method].toLowerCase()+'</h3>';
 if(method==='auto')html+='<p>Automático: se ha elegido '+classicalNames[trace.method].toLowerCase()+' al comparar las operaciones algebraicas estimadas de los tres métodos.</p>';
 html+='<p>Puedes cambiar de método para comparar los desarrollos del mismo sistema.</p>';
 html+='<div class="algebra-equations">'+A.map((a,i)=>'<p class="math">E'+(i+1)+': '+classicalEquation({a,b:b[i]},vars)+'</p>').join('')+'</div>';
 trace.steps.forEach((step,i)=>{
  let title,body;const v=step.relation?variable(vars[step.relation.c]):'';
  if(step.type==='isolate'){
   title='Despejar '+v+' en '+step.label;
   body='<p class="math">'+classicalEquation(step.row,vars)+'</p><p class="math">'+v+' = '+classicalIsolated(step.row,step.relation.c,vars)+' = '+classicalAffine(step.relation.constant,step.relation.terms,vars)+'</p>';
  }else if(step.type==='back'){
   title='Obtener '+v;
   const terms=step.relation.terms.map((q,k)=>q.zero?'':'('+qhtml(q)+') · ('+qhtml(step.values[k])+')').filter(Boolean);
   body='<p class="math">'+step.relation.source.label+': '+classicalEquation(step.relation.source,vars)+'</p><p class="math">'+v+' = '+classicalIsolated(step.relation.source,step.relation.c,vars)+' = '+classicalAffine(step.relation.constant,step.relation.terms,vars)+'</p><p class="math">'+v+' = '+[qhtml(step.relation.constant),...terms].join(' + ')+' = <strong>'+qhtml(step.value)+'</strong></p>';
  }else{
   if(step.type==='equalization'){
    title='Igualar los despejes de '+v+' en '+step.pivot.label+' y '+step.row.label;
    body='<p class="math">'+v+' = '+classicalIsolated(step.row,step.relation.c,vars)+'</p><p class="math">'+classicalIsolated(step.pivot,step.relation.c,vars)+' = '+classicalIsolated(step.row,step.relation.c,vars)+'</p><p>Operamos y agrupamos los términos:</p>';
   }else if(step.type==='substitution'){
    title='Sustituir '+v+' en '+step.row.label;
    const c=step.relation.c,remaining={a:step.row.a.map((q,k)=>k===c?z():q),b:step.row.b};
    const left=classicalEquation(remaining,vars).split(' = ')[0];
    body='<p class="math">'+classicalEquation(step.row,vars)+'</p><p class="math">('+qhtml(step.row.a[c])+') · ('+classicalAffine(step.relation.constant,step.relation.terms,vars)+')'+(left==='0'?'':' + ('+left+')')+' = '+qhtml(step.row.b)+'</p><p>Operamos y agrupamos los términos:</p>';
   }else{
    title='Eliminar '+v+' sumando '+step.row.label+' y '+step.pivot.label+' multiplicadas';
    const [f,h]=step.multipliers;
    body='<p class="math">('+qhtml(f)+') · '+step.row.label+': '+classicalEquation({a:step.row.a.map(q=>q.mul(f)),b:step.row.b.mul(f)},vars)+'</p><p class="math">('+qhtml(h)+') · '+step.pivot.label+': '+classicalEquation({a:step.pivot.a.map(q=>q.mul(h)),b:step.pivot.b.mul(h)},vars)+'</p><p>Sumamos miembro a miembro:</p>';
   }
   body+='<p class="math"><strong>'+step.label+': '+classicalEquation(step.result,vars)+'</strong></p>';
  }
  html+='<details class="solution-step" open><summary>Paso '+(i+1)+'. '+title+'</summary>'+body+'</details>';
 });
 if(trace.kind!=='unique'){
  html+='<h3>Compatibilidad del sistema</h3>'+trace.remaining.map(r=>'<p class="math">'+r.label+': '+classicalEquation(r,vars)+'</p>').join('');
  html+=trace.kind==='none'?'<p>Se obtiene una contradicción: 0 es igual a un número distinto de cero. No existe solución.</p>':'<p>Las ecuaciones restantes son identidades o quedan incógnitas libres. Hay infinitas soluciones; la parametrización se muestra al principio.</p>';
 }
 return html;
}

if(typeof module!=='undefined')module.exports={classicalSolve,chooseClassical};
