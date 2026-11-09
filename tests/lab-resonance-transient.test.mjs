import assert from "node:assert/strict";

// Solución independiente en el dominio temporal de un nudo con fuente de
// corriente armónica, rama R-L de red y condensador en derivación.
// No utiliza el solucionador interno de CircuitJS.
const f=50,w=2*Math.PI*f,R=.08,L=.0005,C=1/(25*w*w*L);
const I=2,wh=5*w,dt=2e-6,tEnd=.22;
const source=t=>Math.SQRT2*I*Math.cos(wh*t);
function derivatives(t,y){
  const [i,v]=y;
  return [(v-R*i)/L,(source(t)-i)/C];
}
function advance(t,y){
  const a=derivatives(t,y);
  const b=derivatives(t+dt/2,y.map((x,j)=>x+dt*a[j]/2));
  const c=derivatives(t+dt/2,y.map((x,j)=>x+dt*b[j]/2));
  const d=derivatives(t+dt,y.map((x,j)=>x+dt*c[j]));
  return y.map((x,j)=>x+dt*(a[j]+2*b[j]+2*c[j]+d[j])/6);
}
let state=[0,0],sumV=0,sumGrid=0,sumCap=0,sumSource=0,count=0;
let suppliedEnergy=0,resistiveLoss=0;
for(let n=0;n<Math.round(tEnd/dt);n++){
  const t=n*dt;
  const previous=state;
  state=advance(t,state);
  const tNext=t+dt;
  // Integración trapezoidal del balance de energía desde el arranque.
  suppliedEnergy+=dt*(previous[1]*source(t)+state[1]*source(tNext))/2;
  resistiveLoss+=dt*R*(previous[0]**2+state[0]**2)/2;
  if(tNext>tEnd-.04){
    const [i,v]=state;
    const ic=source(tNext)-i;
    sumV+=v*v;
    sumGrid+=i*i;
    sumCap+=ic*ic;
    sumSource+=source(tNext)*source(tNext);
    count++;
  }
}
const rms=sum=>Math.sqrt(sum/count);
const yGrid={re:R/(R*R+(wh*L)**2),im:-wh*L/(R*R+(wh*L)**2)};
const yTotal={re:yGrid.re,im:yGrid.im+wh*C};
const expectedV=I/Math.hypot(yTotal.re,yTotal.im);
const expectedGrid=expectedV*Math.hypot(yGrid.re,yGrid.im);
const expectedCap=expectedV*wh*C;
function close(label,actual,expected,tol=.025){
  assert.ok(Math.abs(actual-expected)<tol*expected,
    `${label}: ${actual} frente a ${expected}`);
}
close("Fuente armónica",rms(sumSource),I,.005);
close("Tensión de nudo",rms(sumV),expectedV);
close("Corriente rama R-L",rms(sumGrid),expectedGrid);
close("Corriente condensador",rms(sumCap),expectedCap);
assert.ok(rms(sumGrid)>I && rms(sumCap)>I,
  "La resonancia debe amplificar las corrientes de ambas ramas");
console.log("OK: integración temporal RK4 del nudo R-L/C a 250 Hz.");

const storedEnergy=.5*L*state[0]**2+.5*C*state[1]**2;
const energyResidual=suppliedEnergy-resistiveLoss-storedEnergy;
assert.ok(Math.abs(energyResidual)<Math.max(.02,Math.abs(suppliedEnergy)*.003),
  `Balance energético R-L-C incorrecto: residual ${energyResidual} J`);
assert.ok(suppliedEnergy>0 && resistiveLoss>0,
  "La fuente debe aportar energía y la resistencia disiparla");
console.log("OK: conservación de energía en transitorio R-L-C (fuente, pérdidas y almacenamiento).");
