import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const out=process.env.CHECK_REPORT||'/tmp/project-checks';mkdirSync(out,{recursive:true});
const report={url:process.env.CIRCUIT_URL||'https://jgraciar.github.io/circuitjgr-core.html',cases:[]};
const browser=await chromium.launch({headless:true});
const omega=2*Math.PI*50;
function close(a,b,abs=.003,rel=.003){assert(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=abs+rel*Math.abs(b),`${a} != ${b} (abs ${abs}, rel ${rel})`);}
const head='<cir f="1" ts="0.00001" ic="125" cb="50" pb="50" vr="20" mts="5e-11">';
const wire=(x,y,a,b)=>`<w x="${x} ${y} ${a} ${b}" f="0"/>`;
const source=(f=50,phase=0)=>`<v x="80 448 80 160" f="0" wf="1" fr="${f}" maxv="14.142135623730951" phaseShift="${phase}"/><g x="80 448 80 480" f="0"/>`;
function stats(rows,vi,ii,f=50){
 let T=0,p=0,v2=0,i2=0,idc=0,vc=0,vs=0,ic=0,is=0;const hs=Array.from({length:15},()=>[0,0]);
 for(let n=1;n<rows.length;n++){
  const a=rows[n-1],b=rows[n],dt=b[0]-a[0];T+=dt;
  for(const z of [a,b]){const w=dt/2,v=z[vi],i=z[ii],ph=2*Math.PI*f*z[0];p+=w*v*i;v2+=w*v*v;i2+=w*i*i;idc+=w*i;vc+=2*w*v*Math.cos(ph);vs+=2*w*v*Math.sin(ph);ic+=2*w*i*Math.cos(ph);is+=2*w*i*Math.sin(ph);hs.forEach((h,k)=>{h[0]+=2*w*i*Math.cos((k+1)*ph);h[1]+=2*w*i*Math.sin((k+1)*ph);});}
 }
 const V=Math.sqrt(v2/T),I=Math.sqrt(i2/T),S=V*I,Q=(vc*is-vs*ic)/(2*T*T),P=p/T;
 const fundV=Math.hypot(vc,vs)/(Math.SQRT2*T),fundI=Math.hypot(ic,is)/(Math.SQRT2*T);
 const thd=Math.hypot(...hs.slice(1).map(h=>Math.hypot(...h)))/Math.hypot(...hs[0]);
 return {p:P,q:Q,s:S,v:V,i:I,dc:idc/T,pf:S?P/S:0,cos:fundV*fundI?(vc*ic+vs*is)/(2*T*T*fundV*fundI):0,thd,d:Math.sqrt(Math.max(0,S*S-P*P-Q*Q))};
}
try{
 const page=await browser.newPage({locale:'en-GB',viewport:{width:1400,height:950}});page.setDefaultTimeout(20000);
 await page.addInitScript(()=>{for(const[k,v]of Object.entries({labStartConfigured:'1',labLanguageMode:'manual',language:'en',labDecimalSeparator:'.',labGroupingSeparator:'',labDisplayUnitScale:'auto',decimalDigits:'6',decimalDigitsShort:'4'}))localStorage.setItem(k,v);});
 page.on('dialog',d=>d.dismiss());
 await page.goto(report.url,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>!!window.CircuitJS1?.getElements,null,{timeout:60000});
 async function test(name,fn){const r={name};report.cases.push(r);try{r.result=await fn();r.ok=true;console.log('PASS '+name+' '+JSON.stringify(r.result));}catch(e){r.ok=false;r.error=String(e);console.log('FAIL '+name+' '+e);}writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2));}
 async function load(xml){await page.evaluate(xml=>{const a=window.CircuitJS1;a.setSimRunning(false);a.ontimestep=null;a.importCircuit(xml,false);a.setMaxTimeStep(1e-5);},xml);}
 async function record(select,start=.2,end=.3){
  await page.evaluate(({select,start,end})=>{const a=window.CircuitJS1,es=Array.from(a.getElements());window.checkRows=[];window.checkDone=false;
   const picks=select.map(q=>({elm:es.filter(e=>e.getType()===q.type)[q.n||0],what:q.what||'i',pin:q.pin||0}));if(picks.some(p=>!p.elm))throw Error('Missing element '+JSON.stringify(es.map(e=>e.getType())));
   a.ontimestep=()=>{const t=a.getTime();if(t>=start-1e-12)window.checkRows.push([t,...picks.map(p=>p.what==='v'?p.elm.getVoltageDiff():p.what==='pin'?p.elm.getVoltage(p.pin):p.elm.getCurrent())]);if(t>=end-1e-12){a.setSimRunning(false);a.ontimestep=null;window.checkDone=true;}};a.setSimRunning(true);
  },{select,start,end});await page.waitForFunction(()=>window.checkDone,null,{timeout:90000});return page.evaluate(()=>window.checkRows);
 }
 const cases=[['R',10,0,0,50],['RL',8,6/omega,0,50],['RC',8,0,1/(omega*6),50],['RLC',8,.02,.0001,50],['L',0,.02,0,50],['C',0,0,.0001,50],['resonance',2,.01,1/(omega*omega*.01),50],['RL-60Hz',8,6/omega,0,60]];
 for(const[name,r,l,c,f]of cases)await test('Z-equivalent-'+name,async()=>{
  const native=[];if(r)native.push(['r','r',r,'ResistorElm']);if(l)native.push(['l','l',l,'InductorElm']);if(c)native.push(['c','c',c,'CapacitorElm']);
  const ns=native.map(([tag,attr,val],k)=>`<${tag} x="400 ${160+288*k/native.length} 400 ${160+288*(k+1)/native.length}" f="0" ${attr}="${val}"/>`).join('');
  const xml=head+source(f)+wire(80,160,240,160)+wire(240,160,400,160)+wire(80,448,240,448)+wire(240,448,400,448)+`<Impedance x="240 160 240 448" f="0" mode="2" displayMode="0" f0="50" r="${r}" l="${l}" c="${c}"/>`+ns+'</cir>';
  await load(xml);const rows=await record([{type:'VoltageElm',what:'v'},{type:'ImpedanceElm'},{type:native[0][3]}],.3,.3+5/f);
  let max=0;for(const z of rows){max=Math.max(max,Math.abs(z[2]-z[3]));close(z[2],z[3],1e-6,1e-5);}
  const a=stats(rows,1,2,f),x=2*Math.PI*f*l-(c?1/(2*Math.PI*f*c):0),expected=10/Math.hypot(r,x);
  // A pure ideal inductor retains its initial DC offset; compare its fundamental.
  if(r||!l)close(a.i,expected,.003,.004);
  const saved=await page.evaluate(()=>window.CircuitJS1.exportCircuit());await load(saved);const again=await record([{type:'VoltageElm',what:'v'},{type:'ImpedanceElm'},{type:native[0][3]}],.3,.3+5/f);for(const z of again)close(z[2],z[3],1e-6,1e-5);
  return {maxCurrentDifference:max,measured:a,expectedSinusoidalRms:expected,xmlRoundTrip:true};
 });
 function pvCircuit({kind,p,f=50,phase=0}){
  const r=kind==='R'?100:80,l=kind==='R'?0:60/(2*Math.PI*f),c=kind==='RLC'?.6/(2*Math.PI*f*100):0;
  return head+source(f,phase)+wire(80,160,240,160)+wire(240,160,400,160)+wire(80,448,240,448)+wire(240,448,400,448)+
   `<r x="240 160 240 ${l?304:448}" f="0" r="${r}"/>`+(l?`<l x="240 304 240 448" f="0" l="${l}"/>`:'')+
   `<PVInverter x="400 448 400 160" f="0" pvP="${p}" pvQ="0" pvV="10" pvF="50" pvPhase="0"/>`+
   (c?wire(240,160,320,160)+`<c x="320 160 320 448" f="0" c="${c}"/>`+wire(240,448,320,448):'')+'</cir>';
 }
 for(const kind of ['R','RL','RLC'])for(const multiplier of [0,.5,1,1.5])await test('PV-'+kind+'-'+multiplier,async()=>{
  const pl=kind==='R'?1:.8,p=multiplier*pl;await load(pvCircuit({kind,p}));const select=[{type:'VoltageElm',what:'v'},{type:'VoltageElm'},{type:'PVInverterElm'},{type:'ResistorElm'}];if(kind==='RLC')select.push({type:'CapacitorElm'});
  const rows=await record(select);let maxKcl=0;for(const z of rows){const residual=z[2]+z[3]-z[4]-(kind==='RLC'?z[5]:0);maxKcl=Math.max(maxKcl,Math.abs(residual));close(residual,0,2e-6,0);}
  const grid=stats(rows,1,2),pv=stats(rows,1,3),loadPower=stats(rows,1,4),capacitor=kind==='RLC'?stats(rows,1,5):{p:0,q:0};
  close(loadPower.p,pl);close(pv.p,p);close(pv.q,0);close(grid.p,pl-p);close(grid.q,kind==='RL'?.6:0);close(grid.p+pv.p,loadPower.p+capacitor.p,.0001,.0001);
  const saved=await page.evaluate(()=>window.CircuitJS1.exportCircuit());await page.evaluate(s=>window.CircuitJS1.importCircuit(s,false),saved);assert.equal(await page.evaluate(()=>Array.from(window.CircuitJS1.getElements()).filter(e=>e.getType()==='PVInverterElm').length),1);
  return {grid,pv,load:loadPower,capacitor,maxKcl,xmlRoundTrip:true};
 });
 await test('PV-follows-grid-60Hz-phase',async()=>{await load(pvCircuit({kind:'RL',p:.4,f:60,phase:.7}));const rows=await record([{type:'VoltageElm',what:'v'},{type:'VoltageElm'},{type:'PVInverterElm'}],.3,.3+5/60),pv=stats(rows,1,3,60),grid=stats(rows,1,2,60);close(pv.p,.4);close(pv.q,0);close(grid.p,.4);close(grid.q,.6);return {pv,grid};});
 await test('PV-three-phase-phase-selection-and-export',async()=>{
  const ps=[.25,.75,1.5],phases=[0,-2*Math.PI/3,2*Math.PI/3],parts=[];
  for(let k=0;k<3;k++){
   const sx=80+160*k,y=160+160*k,rx=560+80*k,px=880+80*k;
   parts.push(`<v x="${sx} 640 ${sx} ${y}" f="0" wf="1" fr="50" maxv="14.142135623730951" phaseShift="${phases[k]}"/>`,wire(sx,y,rx,y),wire(rx,y,px,y),`<r x="${rx} ${y} ${rx} 640" f="0" r="100"/>`,`<PVInverter x="${px} 640 ${px} ${y}" f="0" pvP="${ps[k]}" pvQ="0" pvV="10" pvF="50"/>`);
  }
  const neutral=[80,240,400,560,640,720,880,960,1040];for(let k=1;k<neutral.length;k++)parts.push(wire(neutral[k-1],640,neutral[k],640));parts.push('<g x="80 640 80 672" f="0"/>');
  await load(head+parts.join('')+'</cir>');const select=[];for(let k=0;k<3;k++)select.push({type:'VoltageElm',n:k,what:'v'},{type:'VoltageElm',n:k},{type:'PVInverterElm',n:k},{type:'ResistorElm',n:k});
  const rows=await record(select),result=[];for(let k=0;k<3;k++){const v=1+4*k,grid=stats(rows,v,v+1),pv=stats(rows,v,v+2),loadPower=stats(rows,v,v+3);close(pv.p,ps[k]);close(pv.q,0);close(loadPower.p,1);close(grid.p,1-ps[k]);close(grid.q,0);result.push({phase:k+1,grid,pv,load:loadPower});}
  close(result.reduce((s,r)=>s+r.grid.p,0),.5);return {phases:result,totalGridPower:result.reduce((s,r)=>s+r.grid.p,0)};
 });
 await test('wattmeter-nonlinear-grid-Fourier',async()=>{
  const xml=head+source()+wire(80,160,160,160)+`<WattmeterTrue x="160 160 272 160" f="0" w="32" meter="1" labPowerMask="7" labShowCosPhi="1" labShowPowerFactor="1" labShowTHDU="1" labShowTHDI="1" labShowDistortion="1"/>`+
   wire(272,160,352,160)+wire(160,192,80,192)+wire(80,192,80,160)+wire(272,192,272,448)+wire(272,448,80,448)+
   `<FilteredBridge x="352 160 352 448" f="0" r="200" c="0.002" rs="1"/>`+wire(352,448,80,448)+
   `<PVInverter x="480 448 480 160" f="0" pvP="0.2" pvQ="0" pvV="10" pvF="50"/>`+wire(480,160,352,160)+wire(480,448,352,448)+'</cir>';
  await load(xml);const rows=await record([{type:'VoltageElm',what:'v'},{type:'VoltageElm'},{type:'PVInverterElm'},{type:'FilteredBridgeElm'}],1.6,1.8);
  const grid=stats(rows,1,2),pv=stats(rows,1,3),loadPower=stats(rows,1,4);close(pv.p,.2);close(grid.p+pv.p,loadPower.p,.0001,.001);assert(grid.thd>.1);assert(Math.abs(grid.pf-grid.cos)>.03);
  const info=await page.evaluate(()=>Array.from(window.CircuitJS1.getElements()).find(e=>e.getType()==='WattmeterTrueElm').getInfo());
  const read=prefix=>{const row=info.find(s=>s.startsWith(prefix));assert(row,'Missing '+prefix+' '+JSON.stringify(info));const m=row.slice(prefix.length).trim().match(/^([-+\d.eE]+)\s*([mkµu]?)/);assert(m,row);return Number(m[1])*({m:1e-3,k:1e3,µ:1e-6,u:1e-6}[m[2]]??1);};
  close(read('P = '),grid.p,.005,.03);close(read('Q (fundamental) = '),grid.q,.005,.05);close(read('S = '),grid.s,.005,.03);close(read('cos φ (fundamental) = '),grid.cos,.02,.02);close(read('f.d.p. real (P/S) = '),grid.pf,.02,.02);close(read('THD corriente = ')/100,grid.thd,.04,.05);close(read('D* residual no fundamental = '),grid.d,.01,.05);
  const saved=await page.evaluate(()=>window.CircuitJS1.exportCircuit());await load(saved);const flags=await page.evaluate(()=>{const d=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml'),e=d.querySelector('WattmeterTrue');return ['labPowerMask','labShowCosPhi','labShowPowerFactor','labShowTHDU','labShowTHDI','labShowDistortion'].map(k=>[k,e.getAttribute(k)]);});assert.deepEqual(flags.map(p=>p[1]),['7','1','1','1','1','1']);return {grid,pv,load:loadPower,info,flags};
 });
 await test('import-Wulflemm-Aron-round-trip',async()=>{
  const text=readFileSync(new URL('./fixtures/sistema-iii-n-startup.xml',import.meta.url),'utf8');await load(text);const before=await page.evaluate(()=>Array.from(window.CircuitJS1.getElements()).map(e=>[e.getType(),e.getPostCount()]));assert.equal(before.filter(e=>e[0]==='WattmeterTrueElm').length,2);const saved=await page.evaluate(()=>window.CircuitJS1.exportCircuit());await load(saved);assert.deepEqual(await page.evaluate(()=>Array.from(window.CircuitJS1.getElements()).map(e=>[e.getType(),e.getPostCount()])),before);return {elements:before.length,wattmeters:2};
 });
 if(process.env.FALSTAD_EXAMPLES)for(const name of ['resistors','lrc','fullrectf','mosfetamp','jkff','counter'])await test('import-Falstad-TXT-'+name,async()=>{const text=readFileSync(join(process.env.FALSTAD_EXAMPLES,name+'.txt'),'utf8');await load(text);const before=await page.evaluate(()=>Array.from(window.CircuitJS1.getElements()).map(e=>[e.getType(),e.getPostCount()]));assert(before.length>2);const saved=await page.evaluate(()=>window.CircuitJS1.exportCircuit());await load(saved);assert.deepEqual(await page.evaluate(()=>Array.from(window.CircuitJS1.getElements()).map(e=>[e.getType(),e.getPostCount()])),before);return {elements:before.length};});
 for(const [name,text]of [
  ['unknown-XML','<cir f="0"><r x="0 0 80 0" f="0" r="123"/><UnknownJGRTest x="80 0 160 0" f="0"/></cir>'],
  ['unknown-TXT','$ 1 0.00001 10 50 5 50\nr 0 0 80 0 0 123\n999999 80 0 160 0 0'],
  ['malformed-XML','<cir><r x="0 0 80 0" r="123"></cir>']
 ])await test('reject-'+name+'-preserves-open-circuit',async()=>{
  await load(pvCircuit({kind:'RL',p:.4}));const before=await page.evaluate(()=>window.CircuitJS1.exportCircuit());let error=null;
  try{await page.evaluate(text=>window.CircuitJS1.importCircuit(text,false),text);}catch(e){error=String(e);}
  const after=await page.evaluate(()=>window.CircuitJS1.exportCircuit());assert.equal(after,before,'Unsupported or malformed input must not partially replace the open circuit');return {preserved:true,error};
 });
 report.ok=report.cases.every(c=>c.ok);console.log('RESULT '+JSON.stringify({passed:report.cases.filter(c=>c.ok).length,total:report.cases.length,ok:report.ok}));assert(report.ok,'Pending checks found failures; see results.json');
}finally{writeFileSync(join(out,'results.json'),JSON.stringify(report,null,2));await browser.close();}
