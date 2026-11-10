// SPDX-License-Identifier: GPL-3.0-or-later
import {digitalICs,gateValue,inputPins,outputPins} from './LabDigitalIC.ts';
import type {DigitalIC} from './LabDigitalIC.ts';
export interface InfoPin {number:number;name:string;index:number|null;role:'input'|'output'|'bidir'|'power'|'nc';}
export interface InfoBlock {title:string;inputs:number[];outputs:number[];inverted?:number[];clock?:number;}
export interface ICInfo {part:string;name:string;family:string;physical:boolean;pins:InfoPin[];blocks:InfoBlock[];stages:string[];vcc?:number;gnd?:number;source?:string;sourceName?:string;model:string[];notes:string[];table:string[][];definition?:DigitalIC;}
const docs:Record<string,string>={
 '4001':'cd4001b','4011':'cd4011b','4012':'cd4011b','4023':'cd4011b','4027':'cd4027b','4043':'cd4043b','4044':'cd4043b','4069':'cd4069ub','4070':'cd4070b','4071':'cd4071b','4081':'cd4081b','4082':'cd4081b','40106':'cd40106b',
 '7400':'sn7400','7402':'sn7402','7404':'sn7404','7408':'sn74ls08','7414':'sn7414','7420':'sn74ls20','7430':'sn74ls30','7432':'sn7432','7476':'sn74ls76a','7476N':'sn74ls76a','7486':'sn74ls86a','74112':'sn74ls112a',
 '74373':'sn74ls373','7475':'sn74ls75','74194':'sn74ls194a','74164':'sn74ls164','74165':'sn74ls165a','74190':'sn74ls191','74192':'sn74ls193','7447':'sn74ls47','74147':'sn74ls148','74138':'sn74ls138','74151':'sn74ls151','54151':'sn74ls151','74150':'sn74ls151','74181':'sn54ls181','4026':'cd4026b','7493':'sn74ls93','74191':'sn74ls191','555':'ne555'
};
const kinds:Record<string,{en:string;es:string;stages:string[];table:string[][];notes?:string[]}>={
 latch8:{en:'Octal transparent D latch',es:'Latch D transparente de 8 bits',stages:['LE','8 × D','/OE → Z'],table:[['/OE=0; LE=1','Q ← D'],['/OE=0; LE=0','Q(t)'],['/OE=1','Z; LE sigue activo / LE still active']]},
 latch4:{en:'Quad transparent D latch',es:'Latch D transparente de 4 bits',stages:['EN01 / EN23','4 × D','Q / /Q'],table:[['EN=1','Q ← D; /Q ← ¬D'],['EN=0','Q(t)']]},
 universal:{en:'4-bit universal shift register',es:'Registro universal bidireccional de 4 bits',stages:['S1 / S0','MUX ×4','D ×4'],table:[['/CLR=0','0000'],['/CLR=1; ↑CK; S1S0=00','Q(t)'],['/CLR=1; ↑CK; S1S0=01','QA ← SR; QA → QB → QC → QD'],['/CLR=1; ↑CK; S1S0=10','QD ← SL; QD → QC → QB → QA'],['/CLR=1; ↑CK; S1S0=11','Q ← ABCD']]},
 sipo:{en:'8-bit serial-in parallel-out register',es:'Registro SIPO de 8 bits',stages:['A ∧ B','8 × D','QA … QH'],table:[['/CLR=0','00000000'],['/CLR=1; ↑CK','QA ← A ∧ B; QA → … → QH']]},
 piso:{en:'8-bit parallel-in serial-out register',es:'Registro PISO de 8 bits',stages:['/PL / SER','8 × D','QH / /QH'],table:[['/PL=0','Q ← ABCDEFGH'],['/PL=1; ↑(CK ∨ INH)','SER → QA → … → QH'],['/PL=1; INH=1','CK no desplaza / CK inhibited']],notes:['CK ∨ INH: subir INH con CK=0 también desplaza. / Raising INH with CK=0 also shifts.']},
 counter190:{en:'BCD up/down counter',es:'Contador BCD ascendente/descendente',stages:['/LOAD / /EN / D/U','BCD 0…9','MAX/MIN / /RCO'],table:[['/LOAD=0','Q ← ABCD'],['/LOAD=1; ↑CK; /EN=0; D/U=0','+1 mod 10'],['/LOAD=1; ↑CK; /EN=0; D/U=1','−1 mod 10'],['/LOAD=1; /EN=1','Q(t)']]},
 counter192:{en:'BCD dual-clock up/down counter',es:'Contador BCD con dos relojes',stages:['CLR / /LOAD','UP / DOWN; BCD','/CO / /BO'],table:[['CLR=1','0000'],['CLR=0; /LOAD=0','Q ← ABCD'],['CLR=0; ↑UP; DOWN=1; /LOAD=1','+1 mod 10'],['CLR=0; ↑DOWN; UP=1; /LOAD=1','−1 mod 10']]},
 counter168:{en:'Synchronous BCD up/down counter',es:'Contador BCD síncrono ascendente/descendente',stages:['/LOAD / /ENP / /ENT','↑CK; BCD 0…9','/RCO'],table:[['↑CK; /LOAD=0','Q ← ABCD'],['↑CK; /LOAD=1; /ENP=/ENT=0; U/D=1','+1 mod 10'],['↑CK; /LOAD=1; /ENP=/ENT=0; U/D=0','−1 mod 10'],['/ENP=1 ∨ /ENT=1; /LOAD=1','Q(t)']]},
 encoder:{en:'Decimal-to-BCD priority encoder',es:'Codificador prioritario decimal a BCD',stages:['/1 … /9','Prioridad / Priority','/D /C /B /A'],table:[['/1…/9=1','1111'],['/n=0; /m=1 (m>n)','¬BCD(n)'],['Varias entradas a 0 / Multiple low inputs','Prioridad 9 > … > 1 / Priority 9 > … > 1']]},
 decoder:{en:'3-to-8 decoder',es:'Decodificador de 3 a 8',stages:['A / B / C','G1 / /G2A / /G2B','/Y0 … /Y7'],table:[['G1=1; /G2A=/G2B=0','/Y[CBA]=0; /Y[m≠CBA]=1'],['G1=0 ∨ /G2A=1 ∨ /G2B=1','11111111']]},
 mux8:{en:'8-to-1 multiplexer',es:'Multiplexor de 8 a 1',stages:['A / B / C','MUX 8:1','Y / /Y'],table:[['/G=0','Y=D[CBA]; /Y=¬Y'],['/G=1','Y=0; /Y=1']]},
 mux8inv:{en:'Inverting 8-to-1 multiplexer',es:'Multiplexor inversor de 8 a 1',stages:['A / B / C','MUX 8:1','/Y'],table:[['CBA=0…7','/Y=¬D[CBA]']]},
 mux16:{en:'Inverting 16-to-1 multiplexer',es:'Multiplexor inversor de 16 a 1',stages:['S3 … S0','MUX 16:1','/Y'],table:[['/G=0','/Y=¬D[S3S2S1S0]'],['/G=1','/Y=1']]},
 seven:{en:'BCD-to-7-segment decoder, open collector',es:'Decodificador BCD a 7 segmentos, colector abierto',stages:['BCD / /LT / /RBI','BCD → 7','a … g; OC'],table:[['/BI=0','a…g=Z'],['/BI=1; /LT=0','a…g=0'],['/LT=1; /RBI=0; BCD=0','a…g=Z; /RBO=0'],['BCD=0…9; /BI=1; /LT=1','Segmento encendido=0 / Lit segment=0'],['BCD=10…15','Símbolos de la tabla del fabricante / Manufacturer patterns']]},
 ram:{en:'16 × 4 RAM with inverting 3-state outputs',es:'RAM 16 × 4 con salidas invertidas de tres estados',stages:['A3 … A0 / /WE','RAM 16 × 4','/Q0 … /Q3; Z'],table:[['/CS=1','Z'],['/CS=0; /WE=0','RAM[A] ← D; Q=Z'],['/CS=0; /WE=1','Q=¬RAM[A]']]},
 alu:{en:'4-bit arithmetic logic unit',es:'Unidad aritmético-lógica de 4 bits',stages:['A / B / S / M','ALU 4 bits','F / /P / /G / /Cn+4'],table:[]}
};
const pick=(es:string,en:string,lang:string)=>lang==='es'?es:en;
export function gateSymbol(kind:string):string{return ({AND:'&',NAND:'&',OR:'≥1',NOR:'≥1',XOR:'=1',NOT:'1',SCHMITT:'1'})[kind]||kind;}
export function numberedICInfo(part:string,language='en'):ICInfo|null{
 const d=digitalICs[part];if(!d)return legacyICInfo(part,language);
 const io=inputPins(d),outs=outputPins(d),bidir=d.msi?.bidir||[];
 const pins:InfoPin[]=d.labels.map((name,i)=>{const jk=d.jk?.find(f=>f.set===i+1||f.reset===i+1);
  if(jk&&d.family==='TTL')name='/'+name.replace(/S$/, 'PRE').replace(/R$/, 'CLR');
  if(d.mode==='rs-nand'&&d.rs?.some(f=>f.set===i+1||f.reset===i+1))name='/'+name;
  if(name.includes('/Q'))name='/'+name.replace('/','');
  return {number:i+1,name,index:i,role:i+1===d.vcc||i+1===d.gnd?'power':bidir.includes(i+1)?'bidir':outs.includes(i+1)?'output':io.includes(i+1)?'input':'nc'};});
 const blocks:InfoBlock[]=[],stages:string[]=[],model:string[]=[],notes:string[]=[];let name='',table:string[][]=[];
 if(d.gates.length){
  const g=d.gates[0];name=`${d.gates.length} × ${g.kind} (${g.inputs.length} → 1)`;
  d.gates.forEach((g,i)=>blocks.push({title:`${i+1} · ${gateSymbol(g.kind)}`,inputs:g.inputs,outputs:[g.output],inverted:['NAND','NOR','NOT','SCHMITT'].includes(g.kind)?[g.output]:[]}));
  if(g.kind==='SCHMITT'){
   const lo=d.family==='TTL'?'0.9 V':'0.3 × VDD',hi=d.family==='TTL'?'1.7 V':'0.7 × VDD';
   table=[['IN ≤ '+lo,'1'],[lo+' < IN < '+hi,'Q(t)'],['IN ≥ '+hi,'0']];
   notes.push(pick('Histéresis funcional aproximada; no son límites garantizados del componente físico.','Approximate functional hysteresis; these are not guaranteed hardware limits.',language));
  }else for(let bits=0;bits<2**g.inputs.length;bits++)table.push([bits.toString(2).padStart(g.inputs.length,'0'),gateValue(g.kind,g.inputs.map((_,i)=>!!(bits&(1<<(g.inputs.length-1-i)))))?'1':'0']);
 }else if(d.jk){
  name='2 × JK';d.jk.forEach((f,i)=>blocks.push({title:`${i+1} · JK${d.mode==='master-slave'?' M–S':''}`,inputs:[f.j,f.k,f.clock,f.set,f.reset],outputs:[f.q,f.nq],inverted:[f.nq,...(d.family==='TTL'?[f.set,f.reset]:[]),...(d.mode==='falling'?[f.clock]:[])],clock:d.mode==='master-slave'?undefined:f.clock}));
  const active=d.family==='TTL'?0:1,inactive=1-active,setName=d.family==='TTL'?'/PRE':'SET',resetName=d.family==='TTL'?'/CLR':'RESET',edge=d.mode==='rising'?'↑CK':d.mode==='falling'?'↓CK':'CK=1 → ↓CK';
  table=[[`${setName}=${active}; ${resetName}=${inactive}`,'Q=1; /Q=0'],[`${setName}=${inactive}; ${resetName}=${active}`,'Q=0; /Q=1'],[`${setName}=${resetName}=${active}`,'Q=/Q=1'],[edge+'; J=0; K=0','Q(t)'],[edge+'; J=0; K=1','0'],[edge+'; J=1; K=0','1'],[edge+'; J=K=1','¬Q(t)']];
  notes.push(pick('SET y RESET tienen prioridad. Su activación simultánea es una condición no válida para diseñar el circuito.','SET and RESET take priority. Simultaneous assertion is not a valid circuit-design condition.',language));
  if(d.mode==='master-slave')notes.push(pick('Maestro-esclavo: mantener J y K estables durante todo el nivel alto de CK.','Master–slave: keep J and K stable throughout the high CK phase.',language));
 }else if(d.rs){
  name='4 × RS '+(d.mode==='rs-nor'?'NOR':'NAND')+'; Z';d.rs.forEach((f,i)=>blocks.push({title:`${i+1} · RS`,inputs:[f.set,f.reset,d.enable!],outputs:[f.q],inverted:d.mode==='rs-nand'?[f.set,f.reset]:[]}));
  table=d.mode==='rs-nor'?[['S=0; R=0','Q(t)'],['S=1; R=0','1'],['S=0; R=1','0'],['S=R=1','1']]:[['S=R=1','Q(t)'],['S=0; R=1','1'],['S=1; R=0','0'],['S=R=0','0']];
  table=table.map(([condition,value])=>['EN=1; '+condition,value]);table.push(['EN=0','Z']);notes.push(pick('EN=0 desconecta la salida, pero el latch sigue respondiendo a S y R.','EN=0 disconnects the output; the latch still responds to S and R.',language));
 }else if(d.msi){
  const k=kinds[d.msi.kind];name=language==='es'?k.es:k.en;stages.push(...k.stages.map(s=>localizedPair(s,language)));table=k.table.map(row=>row.map(cell=>localizedPair(cell,language)));notes.push(...(k.notes||[]).map(s=>localizedPair(s,language)));
  if(d.msi.kind==='alu'){
   const logic=['¬A','¬(A∨B)','¬A∧B','0','¬(A∧B)','¬B','A⊕B','A∧¬B','¬A∨B','¬(A⊕B)','B','A∧B','1111','A∨¬B','A∨B','A'];
   const arithmetic=['A','A∨B','A∨¬B','−1','A+(A∧¬B)','(A∨B)+(A∧¬B)','A−B−1','(A∧¬B)−1','A+(A∧B)','A+B','(A∨¬B)+(A∧B)','(A∧B)−1','A+A','(A∨B)+A','(A∨¬B)+A','A−1'];
   table=logic.map((f,i)=>[i.toString(2).padStart(4,'0'),f,arithmetic[i]]);
   notes.push(pick('Tabla: S3S2S1S0 | F con M=1 | F con M=0 y /Cn=1. /Cn=0 añade 1. Resultado módulo 16. A=B solo indica igualdad en el modo de comparación de la hoja técnica.','Table: S3S2S1S0 | F with M=1 | F with M=0 and /Cn=1. /Cn=0 adds 1. Result modulo 16. A=B indicates equality only in the datasheet comparison mode.',language));
  }
  if(d.msi.openCollector?.length)notes.push(pick('Colector abierto: 0 absorbe corriente; Z necesita una carga o resistencia de elevación externa.','Open collector: 0 sinks current; Z needs an external load or pull-up resistor.',language));
  if(d.msi.kind.startsWith('counter'))notes.push(pick('Conteo BCD: utilizar valores de carga de 0 a 9.','BCD counting: use parallel-load values from 0 to 9.',language));
 }
 model.push((d.family==='TTL'?'4.75–5.25 V':'3–18 V')+' ('+(d.family==='TTL'?'VCC − GND':'VDD − GND')+')');
 model.push(d.gates[0]?.kind==='SCHMITT'?(d.family==='TTL'?'0.9 / 1.7 V':'0.3 / 0.7 × VDD'):(d.family==='TTL'?'1.4 V':'0.5 × VDD'));
 notes.push(pick('Fuera del intervalo de alimentación del modelo, las salidas quedan en Z. No se simulan corrientes máximas ni retardos físicos.','Outside the model supply range, outputs are Z. Maximum currents and hardware propagation delays are not modeled.',language));
 let source=docs[part]?'https://www.ti.com/lit/ds/symlink/'+docs[part]+'.pdf':undefined;
 if(part==='7476'||part==='7476N')source='https://www.ti.com/lit/gpn/SN5476';
 if(part==='74168')source='https://susta.cz/fel/74/pdf/sn_74168.pdf';
 if(part==='74152')source='https://k1.spdns.de/Develop/Hardware/Infomix/ICs%20logic/74xxx/74152.HC.pdf';
 if(part==='74189')source='https://media.digikey.com/pdf/Data%20Sheets/Fairchild%20PDFs/74F189.pdf';
 return {part,name,family:d.family,physical:true,pins,blocks,stages,vcc:d.vcc,gnd:d.gnd,model,notes,table,source,sourceName:part==='7408'?'TI SN7408 / SN74LS08 / SN74S08':part==='7476'||part==='7476N'?'TI SN7476 / SN5476':part==='74168'?'Motorola SN74LS168':part==='74152'?'Hitachi HD74HC152':part==='74189'?'Fairchild 74F189':docs[part]?.toUpperCase(),definition:d};
}
// Bilingual explanations retain a readable English fallback; equations and pin names are invariant.
function localizedPair(text:string,language:string):string{
 const labels:Record<string,[string,string]>={
  'Prioridad / Priority':['Prioridad','Priority'],
  'Z; LE sigue activo / LE still active':['Z; LE sigue activo','Z; LE still active'],
  'CK no desplaza / CK inhibited':['CK no desplaza','CK inhibited'],
  'CK ∨ INH: subir INH con CK=0 también desplaza. / Raising INH with CK=0 also shifts.':['CK ∨ INH: subir INH con CK=0 también desplaza.','CK ∨ INH: raising INH with CK=0 also shifts.'],
  'Varias entradas a 0 / Multiple low inputs':['Varias entradas a 0','Multiple low inputs'],
  'Prioridad 9 > … > 1 / Priority 9 > … > 1':['Prioridad 9 > … > 1','Priority 9 > … > 1'],
  'Segmento encendido=0 / Lit segment=0':['Segmento encendido=0','Lit segment=0'],
  'Símbolos de la tabla del fabricante / Manufacturer patterns':['Símbolos de la tabla del fabricante','Manufacturer patterns']
 };
 return labels[text]?.[language==='es'?0:1]||text;
}
export function legacyICInfo(part:string,language='en'):ICInfo|null{
 const legacy:Record<string,{labels:string;map:(number|null)[];vcc:number;gnd:number;name:string;stages:string[];table:string[][]}>={
  '4026':{labels:'CK INH DEI DEO CO f g GND d a e b c Uc RESET VDD',map:Array.from({length:16},(_,i)=>i),vcc:16,gnd:8,name:pick('Contador decimal y decodificador de 7 segmentos','Decade counter and 7-segment decoder',language),stages:['CK / INH / RESET','0…9','7 SEG / DE'],table:[['RESET=1','0'],['↑CK; INH=0','+1 mod 10'],['DEI=0','a…g=0']]},
  '7493':{labels:'CKB R01 R02 NC VCC NC NC QC QB GND QD QA NC CKA',map:[1,2,3,null,null,null,null,6,5,null,7,4,null,0],vcc:5,gnd:10,name:pick('Contador binario de 4 bits','4-bit binary counter',language),stages:['CKA','÷2 / ÷8','QA / QB / QC / QD'],table:[['R01=R02=1','0000'],['↓CKA','QA ← ¬QA'],['↓CKB','QBQCQD +1 mod 8']]},
  '74191':{labels:'B QB QA /EN D/U QC QD GND D C /LOAD MAX/MIN /RCO CK A VCC',map:[1,9,8,7,5,10,11,null,3,2,6,null,13,4,0,null],vcc:16,gnd:8,name:pick('Contador binario ascendente/descendente','Binary up/down counter',language),stages:['/LOAD / /EN','0…15','QA … QD / C / R'],table:[['/LOAD=0','Q ← ABCD'],['/LOAD=1; ↑CK; /EN=0; D/U=0','+1 mod 16'],['/LOAD=1; ↑CK; /EN=0; D/U=1','−1 mod 16']]},
  '555':{labels:'GND TRIG OUT /RESET CTRL THRESH DISCH VCC',map:[7,1,5,6,4,2,0,3],vcc:8,gnd:1,name:pick('Temporizador 555','555 timer',language),stages:['3 × R / 2 × CMP','RS / RESET','OUT / DISCH'],table:[['/RESET=0','OUT=0'],['/RESET=1; TRIG < CTRL/2','SET'],['/RESET=1; TRIG ≥ CTRL/2; THRESH > CTRL','RESET']]}
 };
 const l=legacy[part];if(!l)return null;
 const outputs:Record<string,number[]>={'4026':[4,5,6,7,9,10,11,12,13,14],'7493':[8,9,11,12],'74191':[2,3,6,7,12,13],'555':[3,7]};
 const pins:InfoPin[]=l.labels.split(' ').map((name,i)=>({number:i+1,name,index:l.map[i],role:name==='NC'?'nc':i+1===l.vcc||i+1===l.gnd?'power':outputs[part].includes(i+1)?'output':'input'}));
 const notes:string[]=[];
 if(part==='7493'||part==='74191')notes.push(pick('Modelo lógico simplificado con alimentación implícita. Las patillas sin terminal expuesto no tienen una tensión medible.','Simplified logic model with implicit supply. Pins with no exposed terminal have no measurable voltage.',language));
 if(part==='74191')notes.push(pick('La salida C del modelo es terminal /C (complemento de MAX/MIN); no se asigna directamente a la patilla física 12.','Model output C is terminal /C (complement of MAX/MIN); it is not directly assigned to physical pin 12.',language));
 if(part==='555')notes.push(pick('Prioridad del modelo: RESET > TRIG > THRESH. La entrada RESET se activa por debajo de VSS + 0,7 V. Los potenciales TRIG, CTRL y THRESH de la tabla están referidos a VSS.','Model priority: RESET > TRIG > THRESH. RESET is asserted below VSS + 0.7 V. Table TRIG, CTRL and THRESH potentials are relative to VSS.',language));
 if(part==='555')notes.push(pick('NE555 físico: alimentación recomendada de 4,5 a 16 V. El modelo no impone estos límites. Las opciones de masa y RESET pueden ocultar terminales.','NE555 hardware: recommended supply 4.5 to 16 V. The model does not enforce these limits. Ground and RESET options can hide terminals.',language));
 return {part,name:l.name,family:part==='4026'?'CMOS':part==='555'?'Bipolar': 'TTL',physical:true,pins,blocks:[],stages:l.stages,vcc:l.vcc,gnd:l.gnd,model:part==='4026'?['3–18 V','CK: 0.3 / 0.7 × VDD']:[],notes,table:l.table,source:'https://www.ti.com/lit/ds/symlink/'+docs[part]+'.pdf',sourceName:docs[part].toUpperCase()};
}
export function electricalHardware(info:ICInfo):string[][]{
 // Only reference-specific, manufacturer-checked values belong in this table.
 if(info.part==='7408')return [['SN7408 · VCC','4.75–5.25 V; nominal 5 V'],['SN7408 · VIH','≥ 2 V'],['SN7408 · VIL','≤ 0.8 V']];
 if(['4081','4082'].includes(info.part))return [['CD'+info.part+'B · VDD','3–18 V']];
 if(info.part==='555')return [['NE555 · VCC','4.5–16 V']];
 return [];
}
export function pinLogicState(info:ICInfo,pin:InfoPin,volts:number[],drives?:Record<number,boolean|null>):string{
 if(pin.role==='nc')return 'NC';if(pin.index===null||pin.index>=volts.length)return '—';
 if(pin.role==='power')return '—';
 if(drives&&Object.prototype.hasOwnProperty.call(drives,pin.number))return drives[pin.number]===null?'Z':drives[pin.number]?'1':'0';
 if(!info.definition)return '—';
 const d=info.definition,ground=volts[d.gnd-1],supply=volts[d.vcc-1]-ground;
 if(!Number.isFinite(supply)||supply<(d.family==='TTL'?4.75:3)||supply>(d.family==='TTL'?5.25:18))return '—';
 const value=volts[pin.index]-ground;
 if(d.gates.some(g=>g.kind==='SCHMITT'&&g.inputs.includes(pin.number)))return '—';
 return value>(d.family==='TTL'?1.4:supply/2)?'1':'0';
}
