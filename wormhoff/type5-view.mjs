import {type5Topology,type5Solve,type5IntegerExample} from './type5-model.mjs';
// Circuito tipo 5 montado directamente en el DOM de Wormhoff, sin iframe.
export function mountType5(host, initialDemo){
 if(host.__wormhoffType5)return host.__wormhoffType5;
 const root=host.shadowRoot||host.attachShadow({mode:'open'});
 root.innerHTML='<style>'+"\n :host{font:16px system-ui,sans-serif;color:#172235;background:#f5f7fa}:host{max-width:1150px;margin:24px auto;padding:0 16px}h1{font-size:1.45rem}p{line-height:1.5}.type5-main{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr);gap:18px}section{background:white;border:1px solid #d6dce5;border-radius:12px;padding:16px;min-width:0}svg{width:100%;height:auto}.wire{fill:none;stroke:#233b57;stroke-width:3}.res{fill:white;stroke:#233b57;stroke-width:2.5}.source{stroke:#233b57;stroke-width:3}.node{fill:#233b57}.node.pickable{cursor:pointer;stroke:transparent;stroke-width:16}.node.pickable.selected{fill:#d58c12;stroke:#f9d47b;stroke-width:9}.node.pickable:focus-visible{stroke:#d58c12;stroke-width:12}.name{font-size:16px;fill:#172235}.mesh{font-size:20px;fill:#2563a8}.controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}label{display:flex;justify-content:space-between;align-items:center;gap:8px}input{width:74px;padding:7px;border:1px solid #8798ac;border-radius:6px;font:inherit}button{padding:9px 14px;background:#215c9a;color:white;border:0;border-radius:6px;cursor:pointer}output{display:block;white-space:pre-wrap;font-family:ui-monospace,monospace;line-height:1.8}small{color:#536479}#error{color:#a32222}.branch-arrow{cursor:pointer;outline:none}.branch-arrow line,.branch-arrow path{stroke:#136e87;stroke-width:3;fill:none;stroke-linecap:round;stroke-linejoin:round}.branch-arrow text{fill:#136e87;font-size:14px;font-weight:700}.branch-arrow:focus-visible{filter:drop-shadow(0 0 4px #e9a01b)}.branch-arrow[aria-pressed=\"true\"] line,.branch-arrow[aria-pressed=\"true\"] path{stroke:#b45309}.branch-arrow[aria-pressed=\"true\"] text{fill:#b45309}.branch-legend{margin:12px 0;font-size:.9rem}#wormLayer{pointer-events:none}#wormLayer .worm-body{fill:#80bd47;stroke:#315c27;stroke-width:2}#wormLayer .worm-head{fill:#a5d65b;stroke:#315c27;stroke-width:2}#wormLayer .worm-eye{fill:#1d3024}#wormLayer .worm-arrow{fill:#315c27}.mesh [data-mesh].active{fill:#b45309;font-weight:800}.mesh [data-mesh]:not(.active){opacity:.45}.guide{margin-top:16px;border-top:1px solid #d6dce5;padding-top:12px}.guide p{line-height:1.5}.guide button:disabled{opacity:.4;cursor:default}.guide output{background:#f3f6fa;padding:10px;border-radius:7px;min-height:75px}.guide .actions{display:flex;gap:8px;flex-wrap:wrap}@media(max-width:800px){.type5-main{grid-template-columns:1fr}.controls{grid-template-columns:repeat(2,minmax(0,1fr))}}\n:host{max-width:none;margin:0;padding:10px;background:transparent;color:var(--txt,#172235);font-family:inherit}:host section{background:var(--panel,#fff);border-color:var(--line,#d6dce5);color:var(--txt,#172235)}:host button{font-family:inherit}:host .guide output{background:var(--paint-163045,#f3f6fa);color:var(--txt,#172235)}:host h1,:host>a,:host>p:first-of-type{display:none}:host .type5-main{grid-template-columns:minmax(0,1.5fr) minmax(280px,1fr)}@media(max-width:780px){:host .type5-main{grid-template-columns:1fr}}"+'</style>'+"<main class=\"type5-main\"><section><svg viewBox=\"0 0 650 465\" role=\"img\" aria-label=\"Circuito de tres mallas, cinco resistencias y tres fuentes\">\n<g class=\"wire\"><path d=\"M95 135 H170 M235 135 H330 M330 135 H405 M470 135 H555 V330 M95 135 V224 M95 233 V330 H330 M330 135 V190 M330 244 V288 M330 297 V330 M330 330 H405 M470 330 H555 M95 330 V420 H170 M235 420 H405 M470 420 H555 V330\"/></g>\n<g class=\"res\"><rect x=\"170\" y=\"120\" width=\"65\" height=\"30\"/><rect x=\"405\" y=\"120\" width=\"65\" height=\"30\"/><rect x=\"315\" y=\"190\" width=\"30\" height=\"54\"/><rect x=\"405\" y=\"315\" width=\"65\" height=\"30\"/><rect x=\"170\" y=\"405\" width=\"65\" height=\"30\"/></g>\n<g class=\"source\"><path d=\"M73 224 H117 M84 233 H106 M307 288 H353 M318 297 H342 M425 398 V442 M434 409 V431\"/></g>\n<g class=\"name\" text-anchor=\"middle\"><text x=\"203\" y=\"109\">R1</text><text x=\"437\" y=\"109\">R4</text><text x=\"366\" y=\"224\">R3</text><text x=\"437\" y=\"304\">R5</text><text x=\"203\" y=\"394\">R2</text><text x=\"58\" y=\"219\">U1</text><text x=\"291\" y=\"281\">U2</text><text x=\"440\" y=\"458\">U3</text><text x=\"125\" y=\"222\">+</text><text x=\"125\" y=\"247\">−</text><text x=\"360\" y=\"284\">+</text><text x=\"360\" y=\"312\">−</text><text x=\"470\" y=\"395\">+</text><text x=\"393\" y=\"395\">−</text></g>\n<g class=\"node\"><circle cx=\"330\" cy=\"135\" r=\"5\" class=\"pickable\" data-node=\"A\" tabindex=\"0\" role=\"button\" aria-label=\"Seleccionar nudo superior A\"/><circle cx=\"330\" cy=\"330\" r=\"5\" class=\"pickable\" data-node=\"B\" tabindex=\"0\" role=\"button\" aria-label=\"Seleccionar nudo central B\"/><circle cx=\"95\" cy=\"330\" r=\"5\" class=\"pickable\" data-node=\"B\" tabindex=\"0\" role=\"button\" aria-label=\"Seleccionar nudo central B\"/><circle cx=\"555\" cy=\"330\" r=\"5\" class=\"pickable\" data-node=\"C\" tabindex=\"0\" role=\"button\" aria-label=\"Seleccionar nudo derecho C\"/></g>\n<g class=\"mesh\" text-anchor=\"middle\"><text data-mesh=\"0\" x=\"210\" y=\"245\">M1 ↻</text><text data-mesh=\"1\" x=\"448\" y=\"245\">M2 ↻</text><text data-mesh=\"2\" x=\"330\" y=\"390\">M3 ↻</text></g>\n<g id=\"branchArrows\"></g><g id=\"wormLayer\" aria-hidden=\"true\"></g></svg><p class=\"branch-legend\">Pulsa una flecha para invertir el sentido de referencia de la intensidad. Los valores se expresan con el signo correspondiente.</p><p class=\"actions\"><button type=\"button\" id=\"wormPlay\">Reproducir recorrido</button><button type=\"button\" id=\"wormReset\">Reiniciar gusano</button></p><p id=\"wormStatus\" aria-live=\"polite\">Recorrido preparado.</p><div class=\"guide\"><h2>Recorrido guiado</h2><p id=\"guideTitle\"></p><output id=\"guideText\" aria-live=\"polite\"></output><div id=\"nodeTask\" hidden><p>Selecciona en el circuito los dos nudos donde se plantearán las ecuaciones de corrientes (A y C).</p><p id=\"nodeFeedback\" aria-live=\"polite\"></p><div id=\"kclBuilder\" hidden><p id=\"kclPrompt\"></p><div id=\"kclTerms\"></div><p><strong id=\"kclPreview\"></strong></p><button type=\"button\" id=\"kclCheck\">Comprobar nudo</button><p id=\"kclFeedback\" aria-live=\"polite\"></p></div></div><div id=\"equationTask\" hidden><p>Completa los coeficientes de M1, M2, M3 y el término independiente:</p><div class=\"controls\" id=\"equationInputs\"></div><p><button type=\"button\" id=\"checkEquation\">Comprobar ecuación</button></p><p id=\"equationFeedback\" aria-live=\"polite\"></p></div><p class=\"actions\"><button type=\"button\" id=\"guideBack\">Anterior</button><button type=\"button\" id=\"guideNext\">Siguiente</button><button type=\"button\" id=\"guideRestart\">Reiniciar recorrido</button></p></div><small>Las fuentes se representan mediante placas de distinta longitud; la polaridad indicada prevalece para el cálculo.</small></section>\n<section><h2>Valores de los elementos</h2><div class=\"controls\" id=\"controls\"></div><p hidden><button type=\"button\" id=\"toggleDemo\" aria-pressed=\"false\">Modo demo: desactivado</button></p><p><button id=\"solve\" hidden>Resolver circuito</button> <button id=\"reset\" type=\"button\">Restaurar valores</button></p><p id=\"error\" role=\"alert\"></p><h2>Resolución</h2><output id=\"result\" aria-live=\"polite\"></output></section></main>";
 const scope={getElementById:id=>root.getElementById(id),querySelectorAll:selector=>root.querySelectorAll(selector)};


 

const controls=scope.getElementById('controls'),out=scope.getElementById('result'),err=scope.getElementById('error');
const fields=[...type5Topology.resistors.map(id=>[id,'Ω',type5Topology.defaultR[id]]),...type5Topology.sources.map(id=>[id,'V',type5Topology.defaultU[id]])];
for(const [id,unit,value] of fields){const label=document.createElement('label');label.textContent=id+' ('+unit+')';const input=document.createElement('input');input.type='number';input.step='any';input.id=id;input.value=value;label.append(input);controls.append(label);}
// Las cinco referencias son las de type5Solve: R1 →, R3 ↓, R4 →, R5 ←, R2 ←.
const branchLocations={R1:[260,105,1,0],R3:[385,218,0,1],R4:[502,105,1,0],R5:[502,310,-1,0],R2:[260,397,-1,0]};
const branchSigns=Object.fromEntries(Object.keys(branchLocations).map(id=>[id,1]));
function drawBranchArrows(){
 const root=scope.getElementById('branchArrows');root.replaceChildren();
 const ns='http://www.w3.org/2000/svg';
 for(const [id,[x,y,dx,dy]] of Object.entries(branchLocations)){
  const sign=branchSigns[id],ux=dx*sign,uy=dy*sign;
  const group=document.createElementNS(ns,'g');group.setAttribute('class','branch-arrow');
  group.setAttribute('role','button');group.setAttribute('tabindex','0');
  group.setAttribute('aria-label','Invertir intensidad de '+id);
  group.setAttribute('aria-pressed',String(sign<0));
  const line=document.createElementNS(ns,'line');line.setAttribute('x1',x-ux*19);line.setAttribute('y1',y-uy*19);line.setAttribute('x2',x+ux*19);line.setAttribute('y2',y+uy*19);group.append(line);
  const tip=document.createElementNS(ns,'path');const tx=x+ux*19,ty=y+uy*19;tip.setAttribute('d','M'+(tx-ux*10-uy*6)+' '+(ty-uy*10+ux*6)+' L'+tx+' '+ty+' L'+(tx-ux*10+uy*6)+' '+(ty-uy*10-ux*6));group.append(tip);
  const label=document.createElementNS(ns,'text');label.setAttribute('x',x+(dy?24:0));label.setAttribute('y',y+(dy?0:-12));label.setAttribute('text-anchor','middle');label.textContent='I'+id.slice(1);group.append(label);
  const toggle=()=>{branchSigns[id]*=-1;kclVerified.clear();drawBranchArrows();if(!out.hidden)solve();guide();};
  group.addEventListener('click',toggle);group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
  root.append(group);
 }
}
// Animación propia del prototipo: recorre las tres mallas en sentido horario.
const wormRoutes=[
 [[95,135],[330,135],[330,330],[95,330],[95,135]],
 [[330,135],[555,135],[555,330],[330,330],[330,135]],
 [[95,330],[555,330],[555,420],[95,420],[95,330]]
];
let wormToken=0,wormFrame=null;
// Eventos calculados por distancia recorrida sobre los tramos reales del SVG.
const wormEvents=[
 [{name:'R1',kind:'resistor',x:203,y:135},{name:'R3',kind:'resistor',x:330,y:217},{name:'U2',kind:'source',sign:-1,x:330,y:292},{name:'U1',kind:'source',sign:1,x:95,y:229}],
 [{name:'R4',kind:'resistor',x:437,y:135},{name:'R5',kind:'resistor',x:437,y:330},{name:'U2',kind:'source',sign:1,x:330,y:292},{name:'R3',kind:'resistor',x:330,y:217}],
 [{name:'R5',kind:'resistor',x:437,y:330},{name:'U3',kind:'source',sign:-1,x:430,y:420},{name:'R2',kind:'resistor',x:203,y:420}]
];
function routeFraction(route,point){
 let traversed=0,total=0,found=null;
 for(let i=0;i<route.length-1;i++){
  const [ax,ay]=route[i],[bx,by]=route[i+1],dx=bx-ax,dy=by-ay,length=Math.hypot(dx,dy);
  if(found===null){
   const projection=((point.x-ax)*dx+(point.y-ay)*dy)/(length*length);
   const t=Math.max(0,Math.min(1,projection));
   if(projection>=0&&projection<=1&&Math.hypot(ax+dx*t-point.x,ay+dy*t-point.y)<2)found=traversed+length*t;
  }
  traversed+=length;total+=length;
 }
 if(found===null)throw Error('Elemento fuera de la trayectoria: '+point.name);
 return found/total;
}
wormEvents.forEach((events,i)=>{for(const event of events)event.t=routeFraction(wormRoutes[i],event);events.sort((a,b)=>a.t-b.t);});
let wormEventIndex=0,wormPauseUntil=0;
const wormLayer=scope.getElementById('wormLayer');
function wormDraw(x,y,angle,victory=false,reaction=''){
 const ux=Math.cos(angle),uy=Math.sin(angle),px=-uy,py=ux;
 const arrow=[[x+ux*23,y+uy*23],[x+ux*10+px*8,y+uy*10+py*8],[x+ux*10-px*8,y+uy*10-py*8]];
 const circle=(cx,cy,r,fill,stroke='#315c27',width=2)=>'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+fill+'" stroke="'+stroke+'" stroke-width="'+width+'"/>';
 const line=(x1,y1,x2,y2,stroke,width)=>'<path d="M'+x1+' '+y1+' L'+x2+' '+y2+'" fill="none" stroke="'+stroke+'" stroke-width="'+width+'" stroke-linecap="round"/>';
 const headX=x,headY=y,bodyX=x-ux*19,bodyY=y-uy*19;
 let parts=circle(x-ux*35,y-uy*35,9,'#6fae45')+circle(bodyX,bodyY,13,'#80bd47')+circle(headX,headY,17,'#a5d65b');
 if(victory){
  parts+=line(bodyX-12,bodyY-9,bodyX+14,bodyY+9,'#315c27',4)+line(bodyX+12,bodyY-9,bodyX-14,bodyY+9,'#315c27',4);
  parts+='<path d="M'+(x-15)+' '+(y-6)+' h30" stroke="#202b38" stroke-width="5"/>';
  parts+='<rect x="'+(x-14)+'" y="'+(y-12)+'" width="12" height="10" rx="3" fill="#202b38"/><rect x="'+(x+2)+'" y="'+(y-12)+'" width="12" height="10" rx="3" fill="#202b38"/>';
  parts+='<path d="M'+(x-7)+' '+(y+6)+' Q'+x+' '+(y+15)+' '+(x+7)+' '+(y+6)+'" fill="none" stroke="#315c27" stroke-width="2.5"/>';
 }else{
  const eye1=[x+ux*5+px*7,y+uy*5+py*7],eye2=[x+ux*5-px*7,y+uy*5-py*7];
  parts+=circle(eye1[0],eye1[1],3.5,'white','#315c27',1)+circle(eye2[0],eye2[1],3.5,'white','#315c27',1);
  parts+=circle(eye1[0]+ux,eye1[1]+uy,1.8,'#1d3024','#1d3024',0)+circle(eye2[0]+ux,eye2[1]+uy,1.8,'#1d3024','#1d3024',0);
  const mouthX=x+ux*10,mouthY=y+uy*10;
  parts+='<path d="M'+(mouthX-px*5)+' '+(mouthY-py*5)+' Q'+(mouthX+ux*(reaction==='−'?-6:5))+' '+(mouthY+uy*(reaction==='−'?-6:5))+' '+(mouthX+px*5)+' '+(mouthY+py*5)+'" fill="none" stroke="#315c27" stroke-width="2.3" stroke-linecap="round"/>';
 }
 parts+='<polygon class="worm-arrow" points="'+arrow.map(p=>p.join(',')).join(' ')+'"/>';
 if(reaction)parts+='<text x="'+(x+23)+'" y="'+(y-24)+'" fill="'+(reaction==='+'?'#187f3d':'#b23528')+'" font-size="23" font-weight="bold">'+reaction+'</text>';
 wormLayer.innerHTML=parts;
}
function wormStop(){wormToken++;if(wormFrame!==null)cancelAnimationFrame(wormFrame);wormFrame=null;scope.getElementById('wormPlay').disabled=false;}
function wormPlay(meshOnly=null){
 wormStop();
 const token=wormToken,button=scope.getElementById('wormPlay'),status=scope.getElementById('wormStatus');
 button.disabled=true;
 let index=meshOnly===null?0:meshOnly,start=null,lastTime=null,elapsed=0;
 wormEventIndex=0;wormPauseUntil=0;
 const duration=4800;
 function tick(now){
  if(token!==wormToken)return;
  if(lastTime===null)lastTime=now;
  const delta=Math.min(100,now-lastTime);lastTime=now;
  if(start===null)start=now;
  if(wormPauseUntil>0){wormPauseUntil-=delta;if(wormPauseUntil>0){wormFrame=requestAnimationFrame(tick);return;}wormPauseUntil=0;}
  elapsed+=delta;
  const route=wormRoutes[index],lengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1])),total=lengths.reduce((a,b)=>a+b,0);
  const fraction=Math.min(1,elapsed/duration);
  let distance=fraction*total,segment=0;
  while(segment<lengths.length-1&&distance>lengths[segment]){distance-=lengths[segment];segment++;}
  const a=route[segment],b=route[segment+1],t=distance/lengths[segment];
  const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
  const event=wormEvents[index][wormEventIndex];
  if(event&&fraction>=event.t){
   wormEventIndex++;wormPauseUntil=850;
   elapsed=event.t*duration;
   const message=event.kind==='resistor'?'Resistencia '+event.name+': caída de tensión.':'Fuente '+event.name+': '+(event.sign>0?'subida':'bajada')+' de potencial según el recorrido.';
   status.textContent='Malla '+(index+1)+' · '+message;
   wormDraw(event.x,event.y,angle,false,event.kind==='source'?(event.sign>0?'+':'−'):'');
   wormFrame=requestAnimationFrame(tick);return;
  }
  wormDraw(x,y,angle);
  if(fraction>=1){
   index++;elapsed=0;wormEventIndex=0;
   if(index===wormRoutes.length||meshOnly!==null){wormDraw(325,390,0,meshOnly===null);status.textContent=meshOnly===null?'Recorrido completado: tres mallas. El gusano celebra la resolución.':'Recorrido de la malla '+(meshOnly+1)+' completado.';button.disabled=false;wormFrame=null;return;}
   status.textContent='Comienza la malla '+(index+1)+'.';
  }
  wormFrame=requestAnimationFrame(tick);
 }
 status.textContent='Comienza la malla '+(index+1)+'.';
 wormFrame=requestAnimationFrame(tick);
}
scope.getElementById('wormPlay').addEventListener('click',()=>wormPlay(guideStep>=2&&guideStep<=4?guideStep-2:null));
scope.getElementById('wormReset').addEventListener('click',()=>{wormStop();wormLayer.replaceChildren();scope.getElementById('wormStatus').textContent='Recorrido preparado.';});
const fmt=n=>Number(n.toFixed(3)).toLocaleString('es-ES',{maximumFractionDigits:3});
function renderSolutionOverlay(){
 const svg=root.querySelector('svg'),ns='http://www.w3.org/2000/svg';
 let overlay=scope.getElementById('type5SolutionOverlay');
 if(!overlay){overlay=document.createElementNS(ns,'g');overlay.id='type5SolutionOverlay';svg.append(overlay);}
 overlay.replaceChildren();
 const {R,U}=values(),sol=type5Solve(R,U);
 for(const [id,[x,y]] of Object.entries(branchLocations)){
  const current=sol.branches[id]*branchSigns[id];
  const text=document.createElementNS(ns,'text');
  text.setAttribute('x',x);text.setAttribute('y',y-16);
  text.setAttribute('text-anchor','middle');text.setAttribute('font-size','13');
  text.setAttribute('font-weight','700');text.setAttribute('fill','#17633d');
  text.textContent='I'+id.slice(1)+' = '+fmt(current)+' A ✓';
  overlay.append(text);
 }
 for(let i=0;i<3;i++){
  const label=scope.querySelectorAll('[data-mesh]')[i];
  if(label)label.textContent='M'+(i+1)+' ↻ ✓';
 }
}
function clearSolutionOverlay(){
 scope.getElementById('type5SolutionOverlay')?.replaceChildren();
 scope.querySelectorAll('[data-mesh]').forEach((label,i)=>label.textContent='M'+(i+1)+' ↻');
}
function solve(){try{const R={},U={};for(const [id] of fields){const raw=scope.getElementById(id).value;if(!raw.trim())throw Error('Introduce un valor para '+id);const value=Number(raw);if(!Number.isFinite(value))throw Error('Valor no válido: '+id);(id[0]==='R'?R:U)[id]=value;}const x=type5Solve(R,U);err.textContent='';const lines=['Ecuaciones de malla (A · M = b):',...x.A.map((row,i)=>row.map(fmt).join(' · ')+' | '+fmt(x.b[i])),'','Corrientes de malla:',...x.mesh.map((v,i)=>'M'+(i+1)+' = '+fmt(v)+' A'),'','Corrientes de rama:',...Object.entries(x.branches).map(([id,v])=>'I('+id+') = '+fmt(v*branchSigns[id])+' A'),'','Potencia disipada = '+fmt(x.resistorPower)+' W','Potencia suministrada neta = '+fmt(x.sourcePower)+' W'];out.textContent=lines.join('\n');renderSolutionOverlay();}catch(e){err.textContent=e.message;out.textContent='';}}
// Secuencia explicativa: no sustituye todavía la interacción jugable del motor principal.
let guideStep=0;
let demoEnabled=(()=>{try{return localStorage.getItem('wormhoff.demo')!=='false';}catch{return true;}})();
// Sincronización del modo DEMO con el selector principal, incluso si se abre después.
window.addEventListener('wormhoff-demo-changed',event=>{
 demoEnabled=Boolean(event.detail);
 try{localStorage.setItem('wormhoff.demo',String(demoEnabled));}catch{}
 const button=scope.getElementById('toggleDemo');
 button.setAttribute('aria-pressed',String(demoEnabled));
 button.textContent='Modo demo: '+(demoEnabled?'activado':'desactivado');
 guide();
});
const verifiedEquations=new Set();
const selectedNodes=new Set();
const kclVerified=new Set();
let kclActive='A';
const kclAssignments={A:{},C:{}};
const kclBranches={A:['R1','R3','R4'],C:['R4','R5','R2']};
const kclNatural={A:{R1:'entra',R3:'sale',R4:'sale'},C:{R4:'entra',R5:'sale',R2:'sale'}};
function kclExpected(node,id){const natural=kclNatural[node][id];return branchSigns[id]===1?natural:(natural==='entra'?'sale':'entra');}
function renderKcl(){
 const builder=scope.getElementById('kclBuilder');
 builder.hidden=demoEnabled||guideStep!==1||!selectedNodes.has('A')||!selectedNodes.has('C');
 if(builder.hidden)return;
 if(kclVerified.has('A')&&kclActive==='A')kclActive='C';
 scope.getElementById('kclPrompt').textContent='Nudo '+kclActive+': asigna cada intensidad al lado correspondiente de la igualdad.';
 const switcher=document.createElement('button');switcher.type='button';switcher.textContent='Cambiar al nudo '+(kclActive==='A'?'C':'A');switcher.addEventListener('click',()=>{kclActive=kclActive==='A'?'C':'A';renderKcl();});
 const prompt=scope.getElementById('kclPrompt');prompt.replaceChildren(document.createTextNode('Nudo '+kclActive+': asigna las intensidades. '),switcher);
 const terms=scope.getElementById('kclTerms');terms.replaceChildren();
 for(const id of kclBranches[kclActive]){
  const wrap=document.createElement('p');wrap.textContent='I'+id.slice(1)+' ';
  for(const side of ['entra','sale']){
   const button=document.createElement('button');button.type='button';button.textContent=side==='entra'?'Entra':'Sale';
   button.setAttribute('aria-pressed',String(kclAssignments[kclActive][id]===side));
   button.style.opacity=kclAssignments[kclActive][id]===side?'1':'.55';
   button.addEventListener('click',()=>{kclAssignments[kclActive][id]=side;kclVerified.delete(kclActive);renderKcl();guideNextState();});
   wrap.append(button,document.createTextNode(' '));
  }
  terms.append(wrap);
 }
 const assigned=kclAssignments[kclActive];
 const sideText=side=>kclBranches[kclActive].filter(id=>assigned[id]===side).map(id=>'I'+id.slice(1)).join(' + ')||'…';
 scope.getElementById('kclPreview').textContent=sideText('entra')+' = '+sideText('sale');
 scope.getElementById('kclFeedback').textContent='Nudos comprobados: '+([...kclVerified].join(', ')||'ninguno');
}
function guideNextState(){
 scope.getElementById('guideNext').disabled=guideStep===guideTitles.length-1||(!demoEnabled&&((guideStep===1&&!(kclVerified.has('A')&&kclVerified.has('C')))||(guideStep>=2&&guideStep<=4&&!verifiedEquations.has(guideStep-2))));
}
const guideTitles=['Identificar los nudos e intensidades','Ley de los nudos','Primera malla','Segunda malla','Tercera malla','Sistema matricial','Resultado y comprobación'];
function values(){const R={},U={};for(const [id] of fields){const raw=scope.getElementById(id).value;if(!raw.trim())throw Error('Introduce un valor para '+id);const value=Number(raw);if(!Number.isFinite(value))throw Error('Valor no válido: '+id);(id[0]==='R'?R:U)[id]=value;}return {R,U};}
function guide(){
 host.dispatchEvent(new CustomEvent('wormhoff-type5-phase',{detail:guideStep}));
 wormStop();
 if(guideStep>=2&&guideStep<=4){
   scope.getElementById('wormStatus').textContent='Malla '+(guideStep-1)+' seleccionada. Pulsa reproducir recorrido.';
 }
 const title=scope.getElementById('guideTitle'),body=scope.getElementById('guideText');
 title.textContent='Paso '+(guideStep+1)+' de '+guideTitles.length+' · '+guideTitles[guideStep];
 scope.querySelectorAll('[data-mesh]').forEach(el=>el.classList.toggle('active',Number(el.dataset.mesh)===guideStep-2&&guideStep>=2&&guideStep<=4));
 scope.getElementById('guideBack').disabled=guideStep===0;
 guideNextState();
 scope.getElementById('nodeTask').hidden=demoEnabled||guideStep!==1;
 scope.querySelectorAll('[data-node]').forEach(el=>{el.classList.toggle('selected',guideStep===1&&selectedNodes.has(el.dataset.node));el.setAttribute('aria-pressed',String(selectedNodes.has(el.dataset.node)));});
 scope.getElementById('nodeFeedback').textContent=guideStep===1?'Nudos seleccionados: '+([...selectedNodes].join(', ')||'ninguno'):'';
 renderKcl();
 try{
  const {R,U}=values(),x=type5Solve(R,U),row=i=>x.A[i].map((v,j)=>fmt(v)+'·M'+(j+1)).join(' + ')+' = '+fmt(x.b[i]);
  const steps=[
   'Identifica los nudos A, B y C y las intensidades de referencia I1 a I5. Pulsa sobre una flecha para invertir su sentido. El nudo B es la referencia. Las tres mallas M1, M2 y M3 se recorrerán en sentido horario.',
   'Selecciona los nudos A y C y construye sus ecuaciones asignando las intensidades que entran y salen. Las flechas determinan el sentido de referencia.',
   'M1: R1·M1 + R3·(M1−M2) = U1−U2\n'+((demoEnabled||verifiedEquations.has(0))?row(0):'Completa los coeficientes para comprobar la ecuación.'),
   'M2: R4·M2 + R5·(M2−M3) − R3·(M1−M2) = U2\n'+((demoEnabled||verifiedEquations.has(1))?row(1):'Completa los coeficientes para comprobar la ecuación.'),
   'M3: R2·M3 − R5·(M2−M3) = −U3\n'+((demoEnabled||verifiedEquations.has(2))?row(2):'Completa los coeficientes para comprobar la ecuación.'),
   'A · M = b\n'+x.A.map((a,i)=>'['+a.map(fmt).join(', ')+']  ['+fmt(x.b[i])+']').join('\n'),
   'M1 = '+fmt(x.mesh[0])+' A; M2 = '+fmt(x.mesh[1])+' A; M3 = '+fmt(x.mesh[2])+' A.\n'+Object.entries(x.branches).map(([id,v])=>'I('+id+') = '+fmt(v)+' A').join('\n')+'\nPotencias: '+fmt(x.resistorPower)+' W = '+fmt(x.sourcePower)+' W'
  ];
  body.textContent=steps[guideStep];err.textContent='';
  const task=scope.getElementById('equationTask'),inputs=scope.getElementById('equationInputs');
  task.hidden=demoEnabled||guideStep<2||guideStep>4;
  inputs.replaceChildren();
  scope.getElementById('equationFeedback').textContent=verifiedEquations.has(guideStep-2)?'Ecuación comprobada.':'';
  if(!task.hidden)for(let j=0;j<4;j++){
   const label=document.createElement('label');label.textContent=j<3?'M'+(j+1):'b';
   const input=document.createElement('input');input.type='number';input.step='any';input.setAttribute('aria-label',j<3?'Coeficiente de M'+(j+1):'Término independiente');label.append(input);inputs.append(label);
  }
 }catch(e){body.textContent='Corrige los valores de los elementos para continuar.';err.textContent=e.message;}
}
scope.getElementById('checkEquation').addEventListener('click',()=>{
 if(guideStep<2||guideStep>4)return;
 const feedback=scope.getElementById('equationFeedback');
 try{
  const {R,U}=values(),{A,b}=type5Solve(R,U),i=guideStep-2,expected=[...A[i],b[i]];
  const inputs=[...scope.querySelectorAll('#equationInputs input')];
  if(inputs.some(el=>el.value.trim()===''))throw Error('Introduce los cuatro valores.');
  const actual=inputs.map(el=>Number(el.value));
  const correct=actual.every((v,j)=>Number.isFinite(v)&&Math.abs(v-expected[j])<1e-7*Math.max(1,Math.abs(expected[j])));
  if(correct){verifiedEquations.add(i);feedback.textContent='Ecuación correcta. Puedes continuar.';scope.getElementById('guideNext').disabled=false;}
  else{verifiedEquations.delete(i);feedback.textContent='Revisa los signos y los coeficientes de las resistencias compartidas.';scope.getElementById('guideNext').disabled=true;}
 }catch(e){feedback.textContent=e.message;}
});
scope.getElementById('kclCheck').addEventListener('click',()=>{
 const ids=kclBranches[kclActive],assigned=kclAssignments[kclActive];
 const feedback=scope.getElementById('kclFeedback');
 if(ids.some(id=>!assigned[id])){feedback.textContent='Asigna las tres intensidades.';return;}
 if(ids.some(id=>assigned[id]!==kclExpected(kclActive,id))){feedback.textContent='Revisa qué intensidades entran y salen según las flechas.';return;}
 kclVerified.add(kclActive);
 if(kclActive==='A'){kclActive='C';renderKcl();}else{feedback.textContent='Las dos ecuaciones de nudos son correctas.';}
 guideNextState();
});
scope.querySelectorAll('[data-node]').forEach(el=>{
 const toggle=()=>{
  if(guideStep!==1)return;
  const id=el.dataset.node;
  if(id==='B'){scope.getElementById('nodeFeedback').textContent='El nudo B es el de referencia. Selecciona A y C.';return;}
  if(selectedNodes.has(id))selectedNodes.delete(id);else selectedNodes.add(id);
  guide();
 };
 el.addEventListener('click',toggle);
 el.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();toggle();}});
});
scope.getElementById('guideBack').addEventListener('click',()=>{guideStep=Math.max(0,guideStep-1);guide();});
scope.getElementById('guideNext').addEventListener('click',()=>{guideStep=Math.min(guideTitles.length-1,guideStep+1);guide();if(guideStep>=2&&guideStep<=4)wormPlay(guideStep-2);if(guideStep===guideTitles.length-1){out.hidden=false;solve();wormDraw(325,390,0,true);}});
scope.getElementById('guideRestart').addEventListener('click',()=>{clearSolutionOverlay();wormStop();wormLayer.replaceChildren();out.hidden=true;guideStep=0;verifiedEquations.clear();selectedNodes.clear();kclVerified.clear();kclActive='A';for(const id of ['A','C'])kclAssignments[id]={};guide();});
controls.addEventListener('input',()=>{clearSolutionOverlay();verifiedEquations.clear();guide();});
scope.getElementById('toggleDemo').addEventListener('click',()=>{
 demoEnabled=!demoEnabled;
 try{localStorage.setItem('wormhoff.demo',String(demoEnabled));}catch{}
 const btn=scope.getElementById('toggleDemo');
 btn.textContent='Modo demo: '+(demoEnabled?'activado':'desactivado');
 btn.setAttribute('aria-pressed',String(demoEnabled));
 window.dispatchEvent(new CustomEvent('wormhoff-type5-demo',{detail:demoEnabled}));
 guide();
});
scope.getElementById('solve').addEventListener('click',()=>{out.hidden=false;solve();});scope.getElementById('reset').addEventListener('click',()=>{clearSolutionOverlay();for(const [id,,v] of fields)scope.getElementById(id).value=v;verifiedEquations.clear();out.hidden=true;guide();});drawBranchArrows();out.hidden=true;const demoButton=scope.getElementById('toggleDemo');demoButton.textContent='Modo demo: '+(demoEnabled?'activado':'desactivado');demoButton.setAttribute('aria-pressed',String(demoEnabled));guide();

 host.__wormhoffType5={
  solveDirect(){wormStop();out.hidden=false;guideStep=guideTitles.length-1;verifiedEquations.clear();guide();solve();wormDraw(325,390,0,true);},
  randomize(){
   clearSolutionOverlay();
   const example=type5IntegerExample();
   for(const [id] of fields){
    scope.getElementById(id).value=example[id[0]==='R'?'R':'U'][id];
   }
   verifiedEquations.clear();selectedNodes.clear();kclVerified.clear();guideStep=0;out.hidden=true;wormLayer.replaceChildren();guide();
  },
  reset(){clearSolutionOverlay();wormStop();wormLayer.replaceChildren();out.hidden=true;guideStep=0;verifiedEquations.clear();selectedNodes.clear();kclVerified.clear();guide();},
  setDemo(value){demoEnabled=Boolean(value);guide();},
  goTo(step){guideStep=Math.max(0,Math.min(guideTitles.length-1,step));guide();},
  playMesh(index){wormPlay(index);},
  getStep(){return guideStep;}
 };
 if(typeof initialDemo==='boolean'&&initialDemo!==demoEnabled){
  window.dispatchEvent(new CustomEvent('wormhoff-demo-changed',{detail:initialDemo}));
 }
 return host.__wormhoffType5;
}
