import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const circuit=r=>`<cir f="0" ts="0.00005"><r x="160 160 304 160" f="0" r="${r}"/></cir>`;
const ready=(page,n)=>page.waitForFunction(n=>window.JGRTabsExperimental?.list().length===n&&window.JGRTabsExperimental.list().every(t=>t.ready),n,{timeout:60000});
const active=page=>page.evaluate(()=>window.JGRTabsExperimental.getActive());
const bar=async page=>page.frameLocator(`iframe[data-tab-id="${await active(page)}"]`).locator('#jgr-tab-strip');
const info=(page,id)=>page.evaluate(id=>{
 const f=document.querySelector(`iframe[data-tab-id="${id}"]`),api=f.contentWindow.CircuitJS1;
 const root=new DOMParser().parseFromString(api.exportCircuit(),'text/xml').documentElement;
 return {count:[...api.getElements()].length,children:[...root.children].map(e=>e.outerHTML),running:api.isRunning(),time:api.getTime(),modified:window.JGRTabsExperimental.list().find(t=>t.id===id).modified};
},id);
try{
 for(const mobile of [false,true]){
  const page=await browser.newPage({locale:'es-ES',viewport:mobile?{width:320,height:760}:{width:1450,height:900},hasTouch:mobile,isMobile:mobile});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('labStartConfigured','1');localStorage.setItem('labLanguageMode','manual');localStorage.setItem('language','es');});
  await page.goto('http://127.0.0.1:8767/circuitjgr.html?cct='+encodeURIComponent(circuit(77)));
  await ready(page,1);
  const press=async selector=>{const b=(await bar(page)).locator(selector);if(mobile)await b.tap();else await b.click();};
  await press('#add-tab');await ready(page,2);await page.waitForTimeout(500);
  assert.equal((await info(page,'jgr-2')).count,0,'+ opens an empty circuit despite the circuit in the URL');
  assert.equal((await info(page,'jgr-2')).modified,false,'A blank tab starts clean');
  await page.evaluate(xml=>{const api=document.querySelector('iframe[data-tab-id="jgr-2"]').contentWindow.CircuitJS1;api.importCircuit(xml,false);api.setSimRunning(false);window.sourceApi=api;},circuit(1234));
  const original=await info(page,'jgr-2');
  const geometry=await (await bar(page)).evaluate(el=>{
   const d=el.querySelector('#duplicate-tab'),s=el.querySelector('#jgr-sidebar-toggle');
   return {next:d.nextElementSibling===s,duplicate:d.getBoundingClientRect().right,side:s.getBoundingClientRect().left,width:innerWidth,title:d.title};
  });
  assert(geometry.next&&geometry.duplicate<=geometry.side&&geometry.side<geometry.width);
  assert.equal(geometry.title,'Duplicar pestaña activa');
  await press('#duplicate-tab');await ready(page,3);
  assert.equal(await active(page),'jgr-3');
  assert.equal(await page.evaluate(()=>window.JGRTabsExperimental.list().at(-1).name),'Sin título 2 (copia)');
  const copy=await info(page,'jgr-3');
  assert.equal(copy.count,1);assert.deepEqual(copy.children,original.children,'Duplicate keeps the active circuit');
  assert.equal(copy.running,false,'Duplicate keeps a paused source paused');assert(copy.modified,'A copy must be saved as a new circuit');
  assert.deepEqual(await info(page,'jgr-2'),original,'Duplication preserves the source and its simulation clock');
  assert(await page.evaluate(()=>document.querySelector('iframe[data-tab-id="jgr-2"]').contentWindow.CircuitJS1===window.sourceApi));
  await page.evaluate(xml=>document.querySelector('iframe[data-tab-id="jgr-3"]').contentWindow.CircuitJS1.importCircuit(xml,false),circuit(999));
  assert.deepEqual(await info(page,'jgr-2'),original,'Editing a copy cannot change the source');
  await press('#add-tab');await ready(page,4);await page.waitForTimeout(500);
  assert.equal((await info(page,'jgr-4')).count,0,'+ stays blank after duplicating');
  assert.deepEqual(errors,[]);
  console.log(`OK ${mobile?'mobile':'desktop'}: blank +, independent active-tab copy, paused state, source preservation and duplicate button before side-panel control`);
  await page.close();
 }
}finally{await browser.close();}
