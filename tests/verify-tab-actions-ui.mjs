import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const circuit=r=>`<cir f="0" ts="0.00005"><r x="160 160 304 160" f="0" r="${r}"/></cir>`;
const ready=(page,n)=>page.waitForFunction(n=>window.JGRTabsExperimental?.list().length===n&&window.JGRTabsExperimental.list().every(t=>t.ready),n,{timeout:60000});
const active=page=>page.evaluate(()=>window.JGRTabsExperimental.getActive());
const bar=async page=>page.frameLocator(`iframe[data-tab-id="${await active(page)}"]`).locator('.jgr-toolbar-actions');
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
  await page.goto('http://127.0.0.1:8767/circuitjgr.html?cct='+encodeURIComponent(circuit(77))+'&running=false');
  await ready(page,1);
  assert.equal(await page.locator('link[rel="icon"]').getAttribute('href'),'./favicon.ico');
  const iconResponse=await page.request.get(new URL('./favicon.ico',page.url()).href);
  assert.equal(iconResponse.status(),200);
  const iconBytes=await iconResponse.body();
  assert.equal(iconBytes.readUInt32LE(0),0x00010000);
  const run=page.frameLocator('iframe[data-tab-id="jgr-1"]').locator('.jgr-toolbar-actions [data-jgr-icon="runstop"]');
  assert.equal(await run.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(220, 38, 38)');
  if(mobile)await run.tap();else await run.click();
  assert.equal(await run.getAttribute('aria-pressed'),'true');
  assert.equal(await run.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(22, 163, 74)');
  if(!mobile){await run.hover();assert.equal(await run.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(22, 163, 74)');}
  if(mobile)await run.tap();else await run.click();
  assert.equal(await run.getAttribute('aria-pressed'),'false');
  assert.equal(await run.evaluate(el=>el.style.getPropertyPriority('background')),'important');
  // Exercise a native DOM refresh that bypasses the wrapper's run/stop hook.
  await page.evaluate(()=>{
   const app=document.querySelector('iframe[data-tab-id="jgr-1"]').contentWindow.__CircuitJGRExperimentalApp;
   app.simRunning=true;app.ui.runStopButton.className='topButton';
  });
  await page.waitForFunction(()=>document.querySelector('iframe').contentDocument.querySelector('[data-jgr-icon="runstop"]').getAttribute('aria-pressed')==='true');
  assert.equal(await run.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(22, 163, 74)');
  await page.evaluate(()=>{
   const app=document.querySelector('iframe[data-tab-id="jgr-1"]').contentWindow.__CircuitJGRExperimentalApp;
   app.simRunning=false;app.ui.runStopButton.className='topButton-red';
  });
  await page.waitForFunction(()=>document.querySelector('iframe').contentDocument.querySelector('[data-jgr-icon="runstop"]').getAttribute('aria-pressed')==='false');
  if(!mobile)await run.hover();

  assert.equal(await run.evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(220, 38, 38)');

  assert.equal((await info(page,'jgr-1')).running,false,'Initial URL pause is preserved');
  const press=async selector=>{const b=(await bar(page)).locator(selector);if(mobile)await b.tap();else await b.click();};
  await press('#add-tab');
  // La interfaz nativa no debe hacerse visible antes de terminar de adaptar la nueva pestaña.
  const boot=await page.locator('.session[data-tab-id="jgr-2"]').evaluate(el=>({
   ready:el.classList.contains('ready'),visibility:getComputedStyle(el.querySelector('iframe')).visibility
  }));
  if(!boot.ready)assert.equal(boot.visibility,'hidden','The new iframe must stay hidden during initialization');
  await ready(page,2);
  await page.waitForFunction(()=>document.querySelector('.session[data-tab-id="jgr-2"]').classList.contains('ready'));
  assert.equal(await page.locator('.session[data-tab-id="jgr-2"] iframe').evaluate(el=>getComputedStyle(el).visibility),'visible');
  await page.waitForTimeout(500);
  assert.equal((await info(page,'jgr-2')).count,0,'+ opens an empty circuit despite the circuit in the URL');
  assert.equal((await info(page,'jgr-2')).modified,false,'A blank tab starts clean');
  await page.evaluate(xml=>{const api=document.querySelector('iframe[data-tab-id="jgr-2"]').contentWindow.CircuitJS1;api.importCircuit(xml,false);api.setSimRunning(false);window.sourceApi=api;},circuit(1234));
  const original=await info(page,'jgr-2');
  const geometry=await (await bar(page)).evaluate(el=>{
   const d=el.querySelector('#duplicate-tab'),s=el.querySelector('#jgr-sidebar-toggle');
   const bounds=el.getBoundingClientRect();
   return {next:d.nextElementSibling?.id==='arrange-tabs'&&d.nextElementSibling.nextElementSibling===s,
    duplicate:d.getBoundingClientRect().right,side:s.getBoundingClientRect().left,
    left:bounds.left,right:bounds.right,width:innerWidth,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,title:d.title};
  });
  assert(geometry.next&&geometry.duplicate<=geometry.side,'Tab controls must retain their order');
  assert(geometry.left>=-1&&geometry.right<=geometry.width+1,'Toolbar action group must remain within the viewport');
  assert(geometry.scrollWidth>=geometry.clientWidth,'Narrow toolbars must support horizontal scrolling');
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
  await page.evaluate(xml=>{const api=document.querySelector('iframe[data-tab-id="jgr-4"]').contentWindow.CircuitJS1;api.importCircuit(xml,false);api.setSimRunning(true);},circuit(456));
  await press('#duplicate-tab');await ready(page,5);
  assert.equal((await info(page,'jgr-5')).running,true,'Duplicate keeps a running source running');
  assert.equal((await info(page,'jgr-4')).running,false,'Inactive source is paused');
  await page.evaluate(()=>window.JGRTabsExperimental.activate('jgr-4'));
  assert.equal((await info(page,'jgr-4')).running,true,'Source resumes when reactivated');
  assert.deepEqual(errors,[]);
  console.log(`OK ${mobile?'mobile':'desktop'}: blank +, independent active-tab copy, paused state, source preservation and duplicate button before side-panel control`);
  await page.close();
 }
}finally{await browser.close();}
