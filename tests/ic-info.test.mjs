import assert from 'node:assert/strict';
import {digitalICParts,digitalICs,DigitalICState,inputPins,outputPins} from '../scripts/LabDigitalIC.ts';
import {numberedICInfo,electricalHardware,pinLogicState} from '../scripts/ICInfoData.ts';
import {icInfoDiagram,svgEscape} from '../scripts/ICInfoDiagram.ts';
import {icInfoTranslations,icInfoLabel} from '../scripts/ICInfoLabels.ts';
const parts=[...digitalICParts,'4026','7493','74191','555'];
for(const part of parts){
 const info=numberedICInfo(part,'es');assert(info,part+' card exists');
 assert.equal(info.pins.length%2,0);assert.equal(new Set(info.pins.map(p=>p.number)).size,info.pins.length);
 assert(info.pins.every(p=>p.number>=1&&p.number<=info.pins.length));
 assert(info.source?.startsWith('https://'));assert(info.table.length>0,part+' function table');
 assert.equal(info.pins.find(p=>p.number===info.vcc).role,'power');assert.equal(info.pins.find(p=>p.number===info.gnd).role,'power');
 const svg=icInfoDiagram(info,'Patillaje · <prueba>');
 assert.equal((svg.match(/ data-pin="/g)||[]).length,info.pins.length);
 const connected=new Set([...svg.matchAll(/data-internal-pin="(\d+)"/g)].map(m=>Number(m[1])));
 const expected=info.pins.filter(p=>!['nc','power'].includes(p.role)).map(p=>p.number);
 assert.deepEqual([...connected].sort((a,b)=>a-b),expected.sort((a,b)=>a-b),part+' all functional pins wired to internal blocks');
 if(info.definition){
  assert.equal(info.pins.filter(p=>['output','bidir'].includes(p.role)).length,outputPins(info.definition).length);
  const v=Array(info.pins.length).fill(0);v[info.vcc-1]=5;const drives=new DigitalICState().step(info.definition,v);
  for(const pin of info.pins.filter(p=>outputPins(info.definition).includes(p.number)))assert.equal(pinLogicState(info,pin,v,drives),drives[pin.number]===null?'Z':drives[pin.number]?'1':'0');
 }
}
const ttl=numberedICInfo('7408'),cmos=numberedICInfo('4081');assert.equal(ttl.pins[13].name,'Vcc');assert.equal(ttl.model[1],'1.4 V');assert.equal(cmos.model[1],'0.5 × VDD');
assert(electricalHardware(ttl).some(row=>row[0].includes('VIH')&&row[1].includes('2 V')));
assert(electricalHardware(cmos).every(row=>!row[0].includes('VIH')),'do not apply TTL levels to CMOS');
const jk=numberedICInfo('7476');assert.equal(jk.vcc,5);assert.equal(jk.gnd,13);assert.equal(jk.pins[1].name,'/1PRE');assert.equal(jk.pins[2].name,'/1CLR');
const legacy=numberedICInfo('74191');assert.equal(legacy.pins[11].index,null,'MAX/MIN hardware pin must not be assigned to inverted model C output');assert(legacy.notes.some(s=>s.includes('MAX/MIN')));
assert.equal(numberedICInfo('7475').gnd,12);assert.equal(numberedICInfo('555').pins[0].index,7);
assert.equal(numberedICInfo('74189').table[1][1],'RAM[A] ← D; Q=Z');
for(const [lang,labels]of Object.entries(icInfoTranslations)){
 assert.equal(labels.length,22,lang+' complete card labels');assert(labels.every(x=>x.trim()));assert(icInfoLabel('pinout',lang));
}
assert.equal(Object.keys(icInfoTranslations).length,22);
assert.equal(svgEscape('<img onerror="x">&'), '&lt;img onerror=&quot;x&quot;&gt;&amp;');
const attack={...ttl,part:'<script>alert(1)</script>',stages:['<img onerror=x>'],blocks:[],pins:ttl.pins.map(p=>({...p,name:p.number===1?'"/><script>x</script>':p.name}))};
const safe=icInfoDiagram(attack,'<unsafe>');assert(!safe.includes('<script>'));assert(safe.includes('&lt;script&gt;'));
assert.equal(numberedICInfo('unknown'),null);
console.log('OK IC information: 46 physical pinouts, complete internal wiring, function tables, supply/logic distinction, 22 languages and escaped SVG');

for(const language of ['es','en']){
 assert(numberedICInfo('74138',language).table[0][1].includes('/Y[CBA]=0; /Y[m≠CBA]=1'));
 assert(numberedICInfo('74147',language).table[1][0].includes('m>n'));
 assert(numberedICInfo('7447',language).table[3][1].includes('=0'));
 assert.deepEqual(numberedICInfo('74138',language).stages[0],'A / B / C');
}
assert.equal(numberedICInfo('74147','es').stages[1],'Prioridad');
assert.equal(numberedICInfo('74147','en').stages[1],'Priority');
