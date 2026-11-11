import {chromium} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const [examples,out='/tmp/falstad-audit']=process.argv.slice(2);
mkdirSync(out,{recursive:true});
const names=['resistors','res-series','res-par','voltdivide','currentsrcelm','capac','induct','inductac','lrc','diodeclip','diodecurve','diodelimit','diodevar','rectify','fullrect','fullrectf','zenerref','zeneriv','npn','pnp','transswitch','mosfetamp','mosswitch','mosfollower','moscurrentsrc','jfetamp','jfetcurrentsrc','transformer','transformerdown','amp-invert','amp-noninvert','amp-follower','amp-sum','mux','dac','halfadd','fulladd','jkff','nandff','counter','sipo-sr','piso-sr','relay','scr','555square','555monostable','555schmitt'];
const browser=await chromium.launch({headless:true});
const report={urls:['https://www.falstad.com/circuit/circuitjs.html','https://jgraciar.github.io/circuitjgr-core.html'],tolerance:{absolute:1e-7,relative:1e-6},cases:[],editors:[]};
try{
 const pages=[];
 for(const url of report.urls){
  const context=await browser.newContext({viewport:{width:1500,height:950},locale:'en-US',serviceWorkers:'block'});
  await context.addInitScript(()=>{
   for(const [k,v]of Object.entries({language:'en',labLanguageMode:'manual',labStartConfigured:'1',labRegionalFormat:'uk',labDecimalSeparator:'.',labGroupingSeparator:'',labDisplayUnitScale:'auto',decimalDigits:'3',decimalDigitsShort:'1',showPropsOnClick:'false',showOhm:'false'}))localStorage.setItem(k,v);
   const fill=CanvasRenderingContext2D.prototype.fillText;
   CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){const q=window.auditRequest;if(q&&text===q.text&&this.canvas.matches('.canvasWrapper > canvas')){const m=this.getTransform(),r=this.canvas.getBoundingClientRect();window.auditPoint={x:r.left+(m.a*q.x+m.c*q.y+m.e)*r.width/this.canvas.width,y:r.top+(m.b*q.x+m.d*q.y+m.f)*r.height/this.canvas.height};}return fill.call(this,text,x,y,...rest);};
  });
  const page=await context.newPage();await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForFunction(()=>!!window.CircuitJS1?.getElements,null,{timeout:60000});await page.evaluate(()=>window.CircuitJS1.setSimRunning(false));pages.push(page);
  console.log('Loaded '+url);
 }
 async function run(page,text){
  await page.bringToFront();await page.evaluate(text=>{const a=window.CircuitJS1;a.setSimRunning(false);a.ontimestep=null;a.importCircuit(text,false);a.setMaxTimeStep(.000005);},text);
  const initial=await page.evaluate(()=>{
   const doc=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');
   const nodes=Array.from(doc.documentElement.children);
   // En el XML real de CircuitJS los osciloscopios se guardan como <o>,
   // los avisos como <h> y los ajustes como <adj>. El comparador anterior
   // excluía nombres largos inexistentes y confundía los indicadores de
   // visualización de los osciloscopios con diferencias eléctricas.
   // Conservamos en la comparación los modelos y todos los elementos
   // eléctricos, sin alterar la exportación ni las preferencias de JGR.
   const metadata=new Set(['o','h','adj','scope','hint','adjustable']);
   const elements=nodes.filter(e=>!metadata.has(e.tagName))
    .map(e=>[e.tagName,Array.from(e.attributes).map(a=>[a.name,a.value]).sort()]);
   // Comprobar también que los osciloscopios siguen conectados a los
   // mismos elementos; se omiten únicamente sus parámetros visuales.
   const scopeConnections=nodes.filter(e=>e.tagName==='o')
    .map(e=>e.getAttribute('en'));
   return {elements,scopeConnections};
  });
  const samples=[];
  for(const target of [.000137,.001173,.003137]){
   await page.evaluate(target=>{const a=window.CircuitJS1;window.auditDone=false;a.setMaxTimeStep(Math.min(5e-6,target-a.getTime()));a.ontimestep=()=>{const left=target-a.getTime();if(left<1e-12){a.setSimRunning(false);a.ontimestep=null;window.auditDone=true;}else if(left<a.getMaxTimeStep())a.setMaxTimeStep(left);};a.setSimRunning(true);},target);
   await page.waitForFunction(()=>window.auditDone,null,{timeout:20000});
   samples.push(await page.evaluate(()=>{const a=window.CircuitJS1;return {t:a.getTime(),elements:Array.from(a.getElements()).map(e=>({type:e.getType(),v:Array.from({length:e.getPostCount()},(_,i)=>e.getVoltage(i)),i:e.getCurrent()}))};}));
  }
  return {initial,samples};
 }
 function compare(a,b,path,errors){
  if(typeof a==='number'&&typeof b==='number'){
   if(!Number.isFinite(a)||!Number.isFinite(b)||Math.abs(a-b)>1e-7+1e-6*Math.max(Math.abs(a),Math.abs(b)))errors.push({path,a,b});return;
  }
  if(Array.isArray(a)&&Array.isArray(b)){if(a.length!==b.length){errors.push({path,lengths:[a.length,b.length]});return;}a.forEach((v,i)=>compare(v,b[i],path+'.'+i,errors));return;}
  if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of Object.keys(a))compare(a[k],b[k],path+'.'+k,errors);return;}
  if(a!==b)errors.push({path,a,b});
 }
 for(const name of names){
  const record={name};report.cases.push(record);
  try{const text=readFileSync(join(examples,name+'.txt'),'utf8'),a=await run(pages[0],text),b=await run(pages[1],text),errors=[];compare(a,b,name,errors);record.elements=a.samples[0].elements.length;record.samples=3;record.errors=errors;record.ok=!errors.length;record.reference=a;record.actual=b;console.log((record.ok?'PASS ':'FAIL ')+name+' '+record.elements+' elements'+(errors.length?' '+JSON.stringify(errors.slice(0,3)):''));}
  catch(e){record.ok=false;record.error=String(e);console.log('ERROR '+name+' '+e);}
  writeFileSync(join(out,'live.json'),JSON.stringify(report,null,2));
 }
 for(const [tag,label,x,y]of [['DFlipFlop','D',512,170],['Timer','dis',512,170]]){
  const snapshots=[];
  for(const page of pages){
   await page.bringToFront();await page.evaluate(({tag,label,x,y})=>{const a=window.CircuitJS1;a.setSimRunning(false);window.auditPoint=null;window.auditRequest={text:label,x,y};a.importCircuit(`<cir f="0" ts="0.00001" ic="125" cb="50" pb="50" vr="5" mts="5e-11"><${tag} x="480 160 624 160" f="${tag==='Timer'?7:1}"/></cir>`,false);},{tag,label,x,y});
   await page.waitForFunction(()=>!!window.auditPoint,null,{timeout:15000});const point=await page.evaluate(()=>window.auditPoint);await page.mouse.dblclick(point.x,point.y);
   const editor=page.locator('dialog.circuitDialog[open]').filter({has:page.locator('h3')});await editor.locator('input').first().waitFor({state:'visible'});
   snapshots.push(await editor.locator('input,select').evaluateAll(es=>es.map(e=>({tag:e.tagName,type:e.type,value:e.value,checked:e.checked??null,options:e.options?.length??null}))));
   assert.equal(await page.locator('#ic-info-dialog').count(),0);await page.keyboard.press('Escape');await editor.waitFor({state:'detached'});
  }
  const errors=[];compare(snapshots[0],snapshots[1],tag,errors);report.editors.push({tag,ok:!errors.length,errors,snapshots});console.log((errors.length?'FAIL ':'PASS ')+'native double-click '+tag+' '+JSON.stringify(errors));
 }
 report.ok=report.cases.every(c=>c.ok)&&report.editors.every(c=>c.ok);
 writeFileSync(join(out,'live.json'),JSON.stringify(report,null,2));
 console.log('RESULT '+JSON.stringify({ok:report.ok,circuits:report.cases.length,passed:report.cases.filter(c=>c.ok).length,editors:report.editors.length}));
 assert(report.ok,'Live comparison found differences; inspect live.json before classifying them');
}finally{writeFileSync(join(out,'live.json'),JSON.stringify(report,null,2));await browser.close();}
