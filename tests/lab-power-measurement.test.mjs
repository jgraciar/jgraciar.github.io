import assert from "node:assert/strict";
import {LabPowerMeasurement} from "../scripts/LabPowerMeasurement.ts";

// El motor puede avanzar entre muestras almacenadas (separadas 100 µs).
const live=new LabPowerMeasurement();
live.add(0,12,1);
live.add(0.00004,15,-2);
assert.deepEqual(live.getWindowReadings(.02).instantaneous,{v:15,i:-2,p:-30});
assert.equal(live.getWindowReadings(.02).duration,.00004);
// Un reinicio también puede ocurrir entre dos muestras almacenadas.
live.add(.00002,3,2);
assert.equal(live.getWindowReadings(.02).duration,0);
assert.equal(live.getWindowReadings(.02).instantaneous.p,6);
live.clear();
assert.equal(live.getWindowReadings(.02),null);

function measure(v, i, end=0.75, mode="auto") {
    const meter=new LabPowerMeasurement();
    for(let k=0; k<=Math.round(end/0.00005);k++) {
        const t=k*0.00005;
        meter.add(t, v(t), i(t));
    }
    return meter.measure(mode);
}
function approx(label, actual, expected, relative=0.012) {
    assert.ok(Number.isFinite(actual), label + ": resultado no numerico " + actual);
    assert.ok(Math.abs(actual-expected)<=Math.max(0.5,Math.abs(expected)*relative),
        label + ": " + actual + " frente a " + expected);
}
const dc=measure(()=>12,()=>1.2);
assert.equal(dc.kind,"dc");
approx("P continua",dc.p,14.4);
assert.equal(dc.q,null);
assert.equal(dc.s,null);

const f=50, omega=2*Math.PI*f, voltage=230,current=5,phi=Math.PI/6;
const sin=(t,phase=0)=>Math.SQRT2*Math.sin(omega*t+phase);
const rl=measure(t=>voltage*sin(t),t=>current*sin(t,-phi));
assert.equal(rl.kind,"ac");
approx("P carga RL",rl.p,voltage*current*Math.cos(phi));
approx("Q1 inductiva",rl.q,voltage*current*Math.sin(phi));
approx("S carga RL",rl.s,voltage*current);
assert(Math.abs(rl.cosPhi-Math.cos(phi))<0.015,
    "cos φ de carga RL debe ser el desfase de las fundamentales");
assert(Math.abs(rl.powerFactor-rl.cosPhi)<0.015,
    "En régimen sinusoidal, cos φ y f.d.p. deben coincidir");

const capacitor=measure(t=>voltage*sin(t),t=>current*sin(t,Math.PI/2));
assert.equal(capacitor.kind,"ac");
approx("P capacitiva",capacitor.p,0,0.02);
approx("Q1 capacitiva",capacitor.q,-voltage*current);
approx("S capacitiva",capacitor.s,voltage*current);

const resistive=measure(t=>voltage*sin(t),t=>current*sin(t));
approx("P resistiva",resistive.p,voltage*current);
approx("Q1 resistiva",resistive.q,0);
approx("S resistiva",resistive.s,voltage*current);
assert(Math.abs(resistive.cosPhi-1)<0.005);
assert(Math.abs(resistive.powerFactor-1)<0.005);

const nonSine=measure(t=>voltage*sin(t)+30*sin(3*t),t=>current*sin(t));
approx("P distorsion",nonSine.p,voltage*current);
approx("Q1 distorsion",nonSine.q,0);
assert.ok(nonSine.s>voltage*current,"La potencia aparente debe incluir distorsion");
assert(Math.abs(nonSine.cosPhi-1)<0.02,
    "Distorsión de tensión no debe cambiar el desfase fundamental");
assert(nonSine.powerFactor<nonSine.cosPhi-0.002,
    "El f.d.p. verdadero debe incluir la distorsión de tensión");

const harmonicCurrent=measure(t=>voltage*sin(t),
    t=>current*sin(t,-phi) + 4*Math.SQRT2*Math.sin(3*omega*t));
assert.equal(harmonicCurrent.kind,"ac");
assert(Math.abs(harmonicCurrent.cosPhi-Math.cos(phi))<0.015,
    "cos φ debe permanecer ligado a la fundamental con corriente armónica");
const expectedFdp=Math.cos(phi)*current/Math.hypot(current,4);
assert(Math.abs(harmonicCurrent.powerFactor-expectedFdp)<0.015,
    "f.d.p. debe usar P/S total, incluyendo el armónico tercero");
assert(harmonicCurrent.powerFactor<harmonicCurrent.cosPhi-0.10,
    "Con distorsión el factor de potencia real debe distinguirse de cos φ");
const generator=measure(t=>voltage*sin(t),t=>-current*sin(t));
assert(generator.powerFactor < -0.98 && generator.cosPhi < -0.98,
    "Con inversión de corriente deben conservarse los signos");
assert.equal(dc.cosPhi,null,"cos φ no definido en continua");
assert.equal(dc.powerFactor,null,"f.d.p. no definido por convenio con S=0 en CC");

const transient=measure(()=>12,t=>1.2+0.4*Math.exp(-t*10));
assert.equal(transient.kind,"dc","Transitorio con tension CC no debe interpretarse como CA");
assert.equal(measure(()=>12,()=>1.2,0.75,"ac").kind,"ac");
assert.equal(measure(t=>voltage*sin(t),t=>current*sin(t),0.75,"dc").kind,"dc");

const restarted=new LabPowerMeasurement();
restarted.add(1,12,1.2);
restarted.add(1.001,12,1.2);
restarted.add(0,3,2);
restarted.add(.05,3,2);
restarted.add(.1,3,2);
assert.equal(restarted.measure().kind,"dc","Debe reiniciarse el historial al retroceder el tiempo");
approx("P tras reinicio",restarted.measure().p,6);
console.log("OK: P/Q1/S en CC, CA resistiva, inductiva, capacitiva, distorsion y reinicio.");


// TEST: cuatro modos de lectura para las señales reales de las bobinas.
const temporal=new LabPowerMeasurement();
const f2=50, angular=2*Math.PI*f2, urms=230, irms=5;
for(let k=0;k<=15000;k++){
    const t=k*0.00005;
    temporal.add(t,Math.SQRT2*urms*Math.sin(angular*t),
        Math.SQRT2*irms*Math.sin(angular*t));
}
const readings=temporal.getWindowReadings(0.1);
assert(readings,"Faltan lecturas temporales");
approx("U eficaz",readings.rms.v,urms,0.005);
approx("I eficaz",readings.rms.i,irms,0.005);
approx("U pico absoluto",readings.peak.v,Math.SQRT2*urms,0.005);
approx("I pico absoluto",readings.peak.i,Math.SQRT2*irms,0.005);
approx("P media resistiva",readings.mean.p,urms*irms,0.005);
approx("P pico resistiva",readings.peak.p,2*urms*irms,0.005);
approx("p(t) RMS resistiva",readings.rms.p,
    urms*irms*Math.sqrt(1.5),0.005);
approx("U media sinusoidal",readings.mean.v,0,0.005);
approx("I media sinusoidal",readings.mean.i,0,0.005);
assert(readings.instantaneous.p>=0,"La carga resistiva no puede absorber potencia negativa");
assert(readings.rms.p>readings.mean.p,
    "El RMS de p(t) no debe confundirse con la potencia activa media");

const readingsDc=new LabPowerMeasurement();
for(let k=0;k<=3000;k++){
    const t=k*0.0001;
    readingsDc.add(t,12,1.2);
}
const dcValues=readingsDc.getWindowReadings(0.25);
assert(dcValues);
for(const mode of ["instantaneous","peak","rms","mean"]){
    approx("U CC "+mode,dcValues[mode].v,12);
    approx("I CC "+mode,dcValues[mode].i,1.2);
    approx("p CC "+mode,dcValues[mode].p,14.4);
}
const reversed=new LabPowerMeasurement();
for(let k=0;k<=1000;k++)reversed.add(k*0.0001,12,-1.2);
const powerOut=reversed.getWindowReadings(0.05);
assert(powerOut);
approx("Potencia generada con signo",powerOut.mean.p,-14.4);
approx("Pico algebraico negativo",powerOut.peak.p,-14.4);
console.log("OK: lectura instantánea, pico, RMS y media de U/I/p; ventana y signos");

console.log("OK: cos φ fundamental y f.d.p. P/S en CA sinusoidal, armónica, inversa y CC");


// Pruebas espectrales con valores analíticos independientes.
const harmonic=measure(t=>230*sin(t),
 t=>10*sin(t,-Math.acos(.8))+3*Math.SQRT2*Math.sin(5*omega*t)+Math.SQRT2*Math.sin(7*omega*t));
assert.equal(harmonic.kind,"ac");
approx("THD U ideal",harmonic.thdVoltage,0,.001);
assert(Math.abs(harmonic.thdCurrent-Math.sqrt(10)/10)<.008,
 "THD I: 5.º de 3 A y 7.º de 1 A frente a 10 A fundamentales");
approx("P con armonicos solo de corriente",harmonic.p,1840,.015);
approx("Q1 con armonicos solo de corriente",harmonic.q,1380,.015);
approx("S con armonicos solo de corriente",harmonic.s,230*Math.sqrt(110),.015);
approx("D* residual",harmonic.distortionResidual,230*Math.sqrt(10),.025);
assert(Math.abs(harmonic.powerFactor-.8*10/Math.sqrt(110))<.015);
const voltageHarmonics=measure(t=>230*sin(t)+23*Math.SQRT2*Math.sin(5*omega*t),
 t=>10*sin(t));
assert.equal(voltageHarmonics.kind,"ac");
assert(Math.abs(voltageHarmonics.thdVoltage-.1)<.008,"THD U 5.º al 10 %");
assert(Math.abs(voltageHarmonics.thdCurrent)<.008,"THD I sinusoidal");
const bothHarmonics=measure(t=>230*sin(t)+23*Math.SQRT2*Math.sin(5*omega*t),
 t=>10*sin(t)+2*Math.SQRT2*Math.sin(5*omega*t));
approx("P armonica adicional",bothHarmonics.p,2300+46,.015);
approx("P solo armonicos",bothHarmonics.harmonicPower,46,.04);
console.log("OK: THD U/I, potencia armonica y D* frente a referencias analiticas");


// Regresión: una carga rectificadora puede tener varios máximos y cruces
// en la corriente; la frecuencia fundamental debe seguir siendo 50 Hz.
const rectifierLike=measure(t=>230*sin(t),
 t=>10*sin(t)+8*Math.SQRT2*Math.sin(3*omega*t)+5*Math.SQRT2*Math.sin(5*omega*t));
assert.equal(rectifierLike.kind,"ac");
assert(Math.abs(rectifierLike.period-.02)<.001,
 "La corriente deformada no debe cambiar el periodo de la fuente de 50 Hz");
assert(Math.abs(rectifierLike.thdCurrent-Math.hypot(8,5)/10)<.02,
 "El THD de la corriente deformada debe incluir el 3.º y el 5.º");
const waveformVoltage=measure(t=>230*sin(t)+70*Math.SQRT2*Math.sin(5*omega*t),
 t=>10*sin(t));
assert.equal(waveformVoltage.kind,"ac");
assert(Math.abs(waveformVoltage.period-.02)<.001,
 "Una tensión con 5.º armónico no debe confundirse con 250 Hz");
console.log("OK: periodo de red frente a formas de onda muy deformadas");


// Cruces por cero espurios: el quinto armónico supera al umbral
// que provoca varios cruces ascendentes en cada ciclo de 50 Hz.
const multipleCrossings=measure(t=>230*sin(t)+180*Math.SQRT2*Math.sin(5*omega*t),
 t=>10*sin(t));
assert.equal(multipleCrossings.kind,"ac");
assert(Math.abs(multipleCrossings.period-.02)<.001,
 "Cruces armónicos espurios: se debe recuperar la fundamental de 50 Hz");
assert(Math.abs(multipleCrossings.thdVoltage-180/230)<.025,
 "THD U incorrecto tras identificar la fundamental");
console.log("OK: quinto armónico intenso con cruces por cero adicionales");


// Referencia independiente: fundamental inductiva y 5.º armónico con
// potencia activa NEGATIVA. Q1 solo corresponde a la fundamental.
const fifthOpposed=measure(
 t=>230*sin(t)+40*Math.SQRT2*Math.sin(5*omega*t),
 t=>10*sin(t,-Math.PI/3)-2*Math.SQRT2*Math.sin(5*omega*t));
assert.equal(fifthOpposed.kind,"ac");
const expectedP=230*10*Math.cos(Math.PI/3)-40*2;
const expectedQ1=230*10*Math.sin(Math.PI/3);
const expectedS=Math.hypot(230,40)*Math.hypot(10,2);
const expectedD=Math.sqrt(expectedS**2-expectedP**2-expectedQ1**2);
approx("P con quinto armonico de signo opuesto",fifthOpposed.p,expectedP,.012);
approx("Q1 fundamental inductiva con quinto armonico",fifthOpposed.q,expectedQ1,.012);
approx("S total con armonicos en ambas ondas",fifthOpposed.s,expectedS,.012);
approx("Potencia activa del quinto armonico negativa",fifthOpposed.harmonicPower,-80,.03);
approx("THD U quinto armonico",fifthOpposed.thdVoltage,40/230,.02);
approx("THD I quinto armonico",fifthOpposed.thdCurrent,2/10,.02);
approx("D* residual con potencia armonica negativa",fifthOpposed.distortionResidual,expectedD,.02);
assert(Math.abs(fifthOpposed.cosPhi-.5)<.015,
 "cos phi fundamental debe ser 0,5 aunque exista potencia armonica negativa");
assert(Math.abs(fifthOpposed.powerFactor-expectedP/expectedS)<.015,
 "El factor de potencia real debe calcularse como P total/S total");
assert(fifthOpposed.powerFactor<fifthOpposed.cosPhi,
 "La distorsion debe separar el factor de potencia real del cos phi");
console.log("OK: P, Q1, S, cos phi, f.d.p., THD U/I y D* con quinto armonico de potencia negativa");


// Carga no lineal de referencia: rectificador ideal de media onda con R.
// i(t)=max(u(t),0)/R; no es una carga lineal R alimentada con seno completo.
// Analíticamente: P=U²/(2R), I_rms=U/(sqrt(2)R), S=U²/(sqrt(2)R),
// cosφ₁=1 y f.d.p.=1/sqrt(2). La corriente incluye componente continua.
const rectifierR=100;
const halfWave=measure(t=>voltage*sin(t),
    t=>Math.max(0,voltage*sin(t))/rectifierR);
assert.equal(halfWave.kind,"ac");
approx("Rectificador media onda: P",halfWave.p,voltage*voltage/(2*rectifierR),.025);
approx("Rectificador media onda: S",halfWave.s,voltage*voltage/(Math.SQRT2*rectifierR),.025);
assert(Math.abs(halfWave.cosPhi-1)<.03,
    "Rectificador ideal: la fundamental de corriente está en fase con la tensión");
assert(Math.abs(halfWave.powerFactor-1/Math.SQRT2)<.03,
    "Rectificador media onda: f.d.p. verdadero debe incluir la corriente no sinusoidal");
assert(halfWave.powerFactor<halfWave.cosPhi-.2,
    "No se debe confundir cosφ₁ con el factor de potencia real");
console.log("OK: referencia analítica de carga no lineal, rectificador ideal de media onda.");


// Regresión de instalaciones con N equipos no lineales idénticos en paralelo:
// las corrientes y potencias extensivas se multiplican por N, mientras que
// THD, cosφ₁ y factor de potencia permanecen invariantes.
const nonlinearUnits=7;
const unitCurrent=t=>5*sin(t,-Math.PI/6)
    +2*Math.SQRT2*Math.sin(5*omega*t)
    +Math.SQRT2*Math.sin(7*omega*t);
const singleUnit=measure(t=>230*sin(t),unitCurrent);
const parallelUnits=measure(t=>230*sin(t),t=>nonlinearUnits*unitCurrent(t));
for(const field of ["p","q","s","harmonicPower","distortionResidual"]){
    const expected=nonlinearUnits*singleUnit[field];
    assert(Math.abs(parallelUnits[field]-expected)<Math.max(0.05,Math.abs(expected)*0.002),
        field+": el escalado de "+nonlinearUnits+" equipos debe ser lineal");
}
for(const field of ["cosPhi","powerFactor","thdCurrent","thdVoltage"]){
    assert(Math.abs(parallelUnits[field]-singleUnit[field])<0.002,
        field+": magnitud adimensional no debe cambiar al duplicar equipos idénticos");
}
assert(Math.abs(parallelUnits.powerFactor-parallelUnits.p/parallelUnits.s)<1e-9,
    "El factor de potencia real debe ser P/S también con varias unidades");
assert(Math.abs(parallelUnits.s**2-parallelUnits.p**2-parallelUnits.q**2
    -parallelUnits.distortionResidual**2)<parallelUnits.s**2*0.002,
    "El residual de distorsión debe cerrar el balance cuadrático S²=P²+Q₁²+D*²");
console.log("OK: escalado de 7 cargas armónicas en paralelo y balance P/Q₁/S/D*.");


// Superposición de cargas DIFERENTES en un mismo punto de medida.
// P y Q₁ son aditivas; S no lo es en general porque depende de la
// corriente eficaz de la suma y no de la suma de valores eficaces.
const loadA=t=>8*sin(t,-Math.PI/4);
const loadB=t=>3*sin(t,Math.PI/3)+2*Math.SQRT2*Math.sin(5*omega*t);
const meterA=measure(t=>230*sin(t),loadA);
const meterB=measure(t=>230*sin(t),loadB);
const meterTotal=measure(t=>230*sin(t),t=>loadA(t)+loadB(t));
for(const field of ["p","q","harmonicPower"]){
    const expected=meterA[field]+meterB[field];
    assert(Math.abs(meterTotal[field]-expected)<Math.max(.1,Math.abs(expected)*.003),
        field+": la lectura de cargas distintas debe sumar algebraicamente");
}
assert(meterTotal.s < meterA.s+meterB.s-1,
    "No se deben sumar potencias aparentes escalares de cargas diferentes");
assert(Math.abs(meterTotal.powerFactor-meterTotal.p/meterTotal.s)<1e-9,
    "El FP conjunto debe calcularse desde las potencias conjuntas");
assert(meterTotal.q>0 && meterB.q<0,
    "La reactiva capacitiva debe compensar parcialmente la inductiva");
assert(meterTotal.thdCurrent>0.05,
    "La corriente armónica de la segunda carga debe aparecer en la medida conjunta");
console.log("OK: superposición de cargas R-L, capacitiva y armónica; P/Q₁ aditivas, S no aditiva.");


// Dos cargas con quintos armónicos opuestos pueden cancelar su corriente
// distorsionante en el punto común de conexión. La THD individual no es
// aditiva y la THD conjunta debe calcularse sobre la corriente resultante.
const cancellationA=t=>6*sin(t,-Math.PI/6)
    +2*Math.SQRT2*Math.sin(5*omega*t);
const cancellationB=t=>4*sin(t,Math.PI/6)
    -2*Math.SQRT2*Math.sin(5*omega*t);
const cancellationMeterA=measure(t=>230*sin(t),cancellationA);
const cancellationMeterB=measure(t=>230*sin(t),cancellationB);
const cancellationMeter=measure(t=>230*sin(t),t=>cancellationA(t)+cancellationB(t));
assert(cancellationMeterA.thdCurrent>.2 && cancellationMeterB.thdCurrent>.2,
    "Ambas cargas deben presentar distorsión armónica individual");
assert(cancellationMeter.thdCurrent<.01,
    "Los quintos armónicos opuestos deben cancelarse en la acometida");
assert(Math.abs(cancellationMeter.p-cancellationMeterA.p-cancellationMeterB.p)<.2,
    "La cancelación de armónicos no altera la aditividad de P");
assert(Math.abs(cancellationMeter.q-cancellationMeterA.q-cancellationMeterB.q)<.2,
    "La reactiva fundamental total debe ser suma algebraica de Q₁");
assert(Math.abs(cancellationMeter.powerFactor-cancellationMeter.cosPhi)<.01,
    "Con tensión y corriente totales sinusoidales FP y cosφ₁ deben coincidir");
console.log("OK: cancelación de armónicos de quinto orden entre cargas distintas.");


// Compensación de Q₁ con condensadores en paralelo a una carga R-L no lineal.
// Para una red ideal sinusoidal, el condensador no absorbe armónicos de corriente
// de la carga: mejora el desplazamiento fundamental, pero no elimina su THD.
const supplyV=230,loadFundamental=10,loadPhi=Math.acos(.8);
const capacitorIrms=loadFundamental*Math.sin(loadPhi); // Qc = -U·Ic
const distortedLoad=t=>loadFundamental*sin(t,-loadPhi)
    +3*Math.SQRT2*Math.sin(5*omega*t);
const capacitorCurrent=t=>capacitorIrms*sin(t,Math.PI/2);
const uncompensated=measure(t=>supplyV*sin(t),distortedLoad);
const compensated=measure(t=>supplyV*sin(t),t=>distortedLoad(t)+capacitorCurrent(t));
const expectedActive=supplyV*loadFundamental*.8;
const expectedApparent=supplyV*Math.hypot(loadFundamental*.8,3);
approx("Compensación: P permanece",compensated.p,expectedActive,.01);
assert(Math.abs(compensated.p-uncompensated.p)<.5,
    "El condensador ideal no consume potencia activa media");
assert(Math.abs(uncompensated.q-supplyV*capacitorIrms)<3,
    "La carga debe presentar Q₁ inductiva antes de compensar");
assert(Math.abs(compensated.q)<3,
    "La batería debe anular Q₁ de la fundamental");
approx("Compensación: S con quinto armónico",compensated.s,expectedApparent,.01);
assert(Math.abs(compensated.cosPhi-1)<.01,
    "La corriente fundamental compensada debe estar en fase con la tensión");
assert(Math.abs(compensated.powerFactor-8/Math.hypot(8,3))<.012,
    "Aunque Q₁ sea nula, FP debe permanecer por debajo de 1 debido al quinto armónico");
assert(compensated.powerFactor<compensated.cosPhi-.05,
    "No se debe confundir la compensación de cosφ con la eliminación de armónicos");
assert(compensated.thdCurrent>uncompensated.thdCurrent,
    "La THD relativa aumenta al reducir I₁ sin filtrar I₅");
assert(Math.abs(compensated.harmonicPower)<1,
    "Con tensión sinusoidal el quinto armónico no aporta potencia activa");
console.log("OK: batería de condensadores, Q₁ compensada, FP real y THD residual.");


// Con tensión de quinto armónico, una batería ideal SÍ absorbe corriente
// armónica: I_C,h = h·ω·C·U_h. El modelo anterior de fuente sinusoidal
// no debe extrapolarse a una red con tensión distorsionada.
const fifthVoltageRms=23;
const capacitance=capacitorIrms/(omega*supplyV);
const harmonicVoltage=t=>supplyV*sin(t)
    +fifthVoltageRms*Math.SQRT2*Math.sin(5*omega*t);
const harmonicCapacitor=t=>capacitorIrms*sin(t,Math.PI/2)
    +5*omega*capacitance*fifthVoltageRms*Math.SQRT2
        *Math.sin(5*omega*t+Math.PI/2);
const harmonicCapReading=measure(harmonicVoltage,harmonicCapacitor);
const fifthCapCurrent=5*omega*capacitance*fifthVoltageRms;
assert(Math.abs(harmonicCapReading.thdVoltage-fifthVoltageRms/supplyV)<.01,
    "La tensión distorsionada debe conservar el quinto armónico");
assert(Math.abs(harmonicCapReading.thdCurrent-fifthCapCurrent/capacitorIrms)<.02,
    "La THD del condensador debe incluir el factor de frecuencia h=5");
assert(Math.abs(harmonicCapReading.p)<1,
    "Un condensador ideal no consume potencia activa ni a frecuencia armónica");
assert(Math.abs(harmonicCapReading.q+supplyV*capacitorIrms)<3,
    "Q₁ del condensador se refiere exclusivamente a la fundamental");
assert(Math.abs(harmonicCapReading.harmonicPower)<1,
    "La corriente capacitiva del quinto armónico está en cuadratura con U₅");
console.log("OK: condensador con tensión armónica, I₅=5ωCU₅ y Q₁ fundamental.");


// Referencia analítica para estudiar la resonancia paralelo entre inductancia
// equivalente de red y batería de condensadores. Es una comprobación de
// ingeniería, NO una simulación del circuito R-L-C en CircuitJS.
// Para fuente armónica de corriente inyectada en el nudo:
// |Z_eq(h)| = 1 / |1/(R+jhωL) + jhωC|.
// Se mantiene R>0 para obtener un máximo finito y evitar una singularidad.
const gridL=0.0005, gridR=0.08, gridC=1/(25*omega*omega*gridL);
const nodeImpedance=(h)=>{
    const x=h*omega*gridL;
    const denom=gridR*gridR+x*x;
    const g=gridR/denom;
    const b=-x/denom+h*omega*gridC;
    return 1/Math.hypot(g,b);
};
const naturalHarmonic=1/(omega*Math.sqrt(gridL*gridC));
assert(Math.abs(naturalHarmonic-5)<1e-12,
    "La frecuencia propia LC debe estar próxima al quinto armónico");
const z1=nodeImpedance(1),z5=nodeImpedance(5),z7=nodeImpedance(7);
assert(Number.isFinite(z5) && z5>z1*4 && z5>z7*2,
    "La resonancia paralelo debe elevar la impedancia armónica en torno a h=5");
const injectedFifthRms=2;
const nodeFifthRms=injectedFifthRms*z5;
assert(Math.abs(nodeFifthRms/z5-injectedFifthRms)<1e-12,
    "La tensión armónica del nudo debe cumplir U₅=I₅|Z_eq(5)|");
const gridFifthCurrent=nodeFifthRms/Math.hypot(gridR,5*omega*gridL);
const capacitorFifthCurrent=nodeFifthRms*5*omega*gridC;
assert(gridFifthCurrent>injectedFifthRms &&
       capacitorFifthCurrent>injectedFifthRms,
    "En resonancia pueden circular corrientes de rama mayores que la inyectada");
assert(Math.abs(nodeFifthRms-z5*injectedFifthRms)<1e-10);
console.log("OK: referencia de resonancia paralelo R-L de red / C, quinto armónico.");


// Validación fasorial independiente de las ramas R-L y C del nudo.
// La ley de Kirchhoff se aplica a fasores COMPLEJOS: sumar únicamente
// los módulos de las intensidades daría un resultado incorrecto.
const complex=(re,im)=>({re,im});
const addComplex=(a,b)=>complex(a.re+b.re,a.im+b.im);
const multiplyComplex=(a,b)=>complex(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const absComplex=a=>Math.hypot(a.re,a.im);
const nodalAdmittance=(h,c)=>{
    const x=h*omega*gridL,denom=gridR**2+x**2;
    return complex(gridR/denom,h*omega*c-x/denom);
};
const injected=complex(injectedFifthRms,0);
const y5=nodalAdmittance(5,gridC);
const v5=complex(
    injectedFifthRms*y5.re/(absComplex(y5)**2),
    -injectedFifthRms*y5.im/(absComplex(y5)**2));
const yGrid=complex(gridR/(gridR**2+(5*omega*gridL)**2),
    -5*omega*gridL/(gridR**2+(5*omega*gridL)**2));
const yCap=complex(0,5*omega*gridC);
const branchSum=addComplex(multiplyComplex(v5,yGrid),multiplyComplex(v5,yCap));
assert(absComplex(complex(branchSum.re-injected.re,branchSum.im-injected.im))<1e-10,
    "Las corrientes fasoriales de red y condensador deben satisfacer KCL");
assert(Math.abs(absComplex(v5)-nodeFifthRms)<1e-10,
    "La solución fasorial y la impedancia nodal deben coincidir");

// Un banco desintonizado debe desplazar el pico de impedancia fuera de h=5.
// La desintonización NO implica por sí sola una instalación segura: hay que
// comprobar el espectro real y los límites térmicos de los componentes.
const detunedC=gridC*.65;
const detunedImpedance=h=>1/absComplex(nodalAdmittance(h,detunedC));
const detunedFifth=detunedImpedance(5);
assert(detunedFifth<z5*.35,
    "Al desplazar la resonancia debe reducirse la impedancia en 250 Hz");
const resonancePeak=[...Array(81)].map((_,k)=>1+k*.1)
    .reduce((best,h)=>nodeImpedance(h)>best.z?{h,z:nodeImpedance(h)}:best,
        {h:0,z:0});
assert(resonancePeak.h>4.5 && resonancePeak.h<5.5,
    "El máximo amortiguado debe quedar próximo al quinto armónico");
console.log("OK: KCL fasorial de la resonancia y desplazamiento de frecuencia por desintonización.");


// Contraste en dominio temporal de la solución fasorial de resonancia.
// Se reconstruyen las ondas de U₅ e I₅ de cada rama y se pasan por el
// mismo motor de medidas del vatímetro (LabPowerMeasurement). No sustituye
// una prueba transitoria del solver R-L-C de CircuitJS.
const harmonicSignal=(phasor,t)=>Math.SQRT2*
    (phasor.re*Math.cos(5*omega*t)-phasor.im*Math.sin(5*omega*t));
const gridPhasor=multiplyComplex(v5,yGrid);
const capacitorPhasor=multiplyComplex(v5,yCap);
const gridWave=measure(t=>harmonicSignal(v5,t),
    t=>harmonicSignal(gridPhasor,t),.75,"ac");
const capacitorWave=measure(t=>harmonicSignal(v5,t),
    t=>harmonicSignal(capacitorPhasor,t),.75,"ac");
const injectedWave=measure(t=>harmonicSignal(v5,t),
    t=>harmonicSignal(injected,t),.75,"ac");
assert.equal(gridWave.kind,"ac");
assert.equal(capacitorWave.kind,"ac");
assert.equal(injectedWave.kind,"ac");
assert(Math.abs(gridWave.p-gridR*absComplex(gridPhasor)**2)<1,
    "La potencia disipada en la resistencia de red debe ser R·I²");
assert(Math.abs(capacitorWave.p)<1,
    "La potencia activa del condensador ideal debe ser cero");
assert(Math.abs(gridWave.p+capacitorWave.p-injectedWave.p)<1,
    "El balance temporal de potencia activa debe cumplir Kirchhoff");
assert(Math.abs(gridWave.q+capacitorWave.q-injectedWave.q)<1,
    "El balance temporal de potencia reactiva debe cumplir Kirchhoff a 250 Hz");
console.log("OK: contraste temporal de ramas R-L/C con medidas P y Q del vatímetro.");
