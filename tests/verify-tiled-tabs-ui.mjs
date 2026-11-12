import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const sample=r=>`<cir f="0" ts="0.00005"><r x="160 160 304 160" f="0" r="${r}"/><v x="160 160 304 160" f="0" wf="0" maxv="5"/></cir>`;
const ready=(page,n)=>page.waitForFunction(n=>window.JGRTabsExperimental?.list().length===n&&window.JGRTabsExperimental.list().every(t=>t.ready),n,{timeout:60000});
const frame=(page,id)=>page.frameLocator(`iframe[data-tab-id="${id}"]`);
const chrome=async page=>(await page.evaluate(()=>window.JGRTabsExperimental.getLayout()))==='single'?frame(page,await current(page)):page;
const current=page=>page.evaluate(()=>window.JGRTabsExperimental.getActive());
async function chooseLayout(page,mode,keyboard=false){
 const f=await chrome(page);
 await f.locator('#arrange-tabs').click();
 const menu=f.locator('#jgr-layout-menu');await menu.waitFor({state:'visible'});
 assert.equal(await f.locator('#arrange-tabs').getAttribute('aria-expanded'),'true');
 if(keyboard){await menu.locator('[aria-checked="true"]').press('Home');await page.keyboard.press('ArrowDown');if(mode==='vertical')await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');}
 else await menu.locator(`[data-layout="${mode}"]`).click();
 await page.waitForFunction(mode=>document.querySelector('#workspace').dataset.layout===mode&&window.JGRTabsExperimental.getLayout()===mode,mode);
 await page.waitForTimeout(200);
}
const snapshot=page=>page.evaluate(()=>[...document.querySelectorAll('#workspace iframe')].map(f=>{
 const a=f.contentWindow.CircuitJS1;return {id:f.dataset.tabId,xml:a.exportCircuit(),time:a.getTime()};
}));
const sizes=page=>page.evaluate(()=>[...document.querySelectorAll('.session')].map(s=>{
 const b=s.getBoundingClientRect(),f=s.querySelector('iframe'),app=f.contentWindow.__CircuitJGRExperimentalApp;
 return {id:s.dataset.tabId,x:b.x,y:b.y,width:b.width,height:b.height,hidden:s.getAttribute('aria-hidden'),visible:getComputedStyle(s).visibility,
 canvasWidth:app.ui.canvasWidth,canvasHeight:app.ui.canvasHeight,innerWidth:f.contentWindow.innerWidth,
 mode:window.JGRTabsExperimental.getLayout()};
}));
const clocks=page=>page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('iframe')].map(f=>[f.dataset.tabId,{time:f.contentWindow.CircuitJS1.getTime(),running:f.contentWindow.CircuitJS1.isRunning()}])));
try{
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1680,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('labStartConfigured','1');localStorage.setItem('labLanguageMode','manual');localStorage.setItem('language','es');});
 await page.goto('http://127.0.0.1:8767/circuitjgr.html?running=false');await ready(page,1);
 await page.locator('#open-files').setInputFiles([1,2].map((r,i)=>({name:`Circuito ${i+2}.jgr`,mimeType:'text/plain',buffer:Buffer.from(sample(500+r))})));
 await ready(page,3);
 await page.evaluate(xml=>{
  for(const f of document.querySelectorAll('iframe')){window.JGRTabsExperimental.activate(f.dataset.tabId);f.contentWindow.CircuitJS1.setSimRunning(false);}
  document.querySelector('iframe').contentWindow.CircuitJS1.importCircuit(xml,false);
  window.engines=Object.fromEntries([...document.querySelectorAll('iframe')].map(f=>[f.dataset.tabId,f.contentWindow.CircuitJS1]));
 },sample(100));
 const before=await snapshot(page);
 await chooseLayout(page,'vertical',true);
 let boxes=await sizes(page);
 assert(boxes.every(b=>b.hidden==='false'&&b.visible==='visible'&&b.mode==='vertical'));
 assert(boxes.every(b=>Math.abs(b.y-boxes[0].y)<1&&Math.abs(b.width-boxes[0].width)<2));
 assert(boxes[1].x>=boxes[0].x+boxes[0].width&&boxes[2].x>=boxes[1].x+boxes[1].width,'Horizontal tiles are side by side');
 assert(boxes.every(b=>b.canvasWidth>100&&b.canvasHeight>100&&Math.abs(b.width-b.innerWidth)<2));
 assert.equal(await page.locator('#shared-chrome > nav').count(),1);
 assert.equal(await page.locator('#shared-chrome .mainToolbar').count(),1);
 assert.deepEqual(await snapshot(page),before,'Layout changes preserve paused circuits and simulation clocks');
 // Focus in a circuit selects that session without hiding its neighbours.
 await frame(page,'jgr-2').locator('.canvasWrapper > canvas').click({position:{x:20,y:20}});
 assert.equal(await current(page),'jgr-2');
 assert.equal(await page.locator('#shared-chrome > nav').count(),1);
 await page.locator('#shared-chrome td.gwt-MenuItem').first().click();
 assert.equal(await page.locator('#shared-chrome td.gwt-MenuItem.open').count(),1);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#shared-chrome td.gwt-MenuItem.open').count(),0);
 const toolbarKey=await page.evaluate(()=>{
  const app=document.querySelector('iframe[data-tab-id="jgr-2"]').contentWindow.__CircuitJGRExperimentalApp;
  const [key,button]=[...app.ui.toolbar.highlightableButtons.entries()].find(([key])=>key.includes('Resistor'));
  button.dataset.sharedTest='component';return key;
 });
 await page.locator('[data-shared-test="component"]').click();
 assert.equal(await page.evaluate(()=>document.querySelector('iframe[data-tab-id="jgr-2"]').contentWindow.__CircuitJGRExperimentalApp.ui.mouseModeStr),toolbarKey);
assert((await sizes(page)).every(b=>b.hidden==='false'));
 // Menu keyboard navigation and Escape leave the chosen mode intact.
 await page.locator('#arrange-tabs').click();
 await page.keyboard.press('Escape');assert.equal(await page.locator('#jgr-layout-menu').count(),0);
 assert.equal(await page.evaluate(()=>window.JGRTabsExperimental.getLayout()),'vertical');
 await chooseLayout(page,'horizontal');boxes=await sizes(page);
 assert(boxes.every(b=>Math.abs(b.x-boxes[0].x)<1&&Math.abs(b.height-boxes[0].height)<2&&b.mode==='horizontal'));
 assert(boxes[1].y>=boxes[0].y+boxes[0].height&&boxes[2].y>=boxes[1].y+boxes[1].height,'Vertical tiles are stacked');
 assert.deepEqual(await snapshot(page),before);
 // Visual order follows tab order without recreating any simulator.
 await page.locator('.tab[data-tab-id="jgr-3"] .choose').press('Alt+Shift+ArrowLeft');
 assert.deepEqual(await page.evaluate(()=>window.JGRTabsExperimental.list().map(t=>t.id)),['jgr-1','jgr-3','jgr-2']);
 boxes=await sizes(page);assert(boxes.find(b=>b.id==='jgr-3').y<boxes.find(b=>b.id==='jgr-2').y);
 assert(await page.evaluate(()=>[...document.querySelectorAll('iframe')].every(f=>window.engines[f.dataset.tabId]===f.contentWindow.CircuitJS1)));
 // Every visible simulation runs independently, including after focus changes.
 await page.evaluate(()=>{for(const f of document.querySelectorAll('iframe'))f.contentWindow.CircuitJS1.setSimRunning(true);});
 let start=await clocks(page);await page.waitForTimeout(350);let end=await clocks(page);
 for(const id of Object.keys(start))assert(end[id].time>start[id].time&&end[id].running,'Visible engine advances: '+id);
 await page.evaluate(()=>document.querySelector('iframe[data-tab-id="jgr-2"]').contentWindow.CircuitJS1.setSimRunning(false));
 await page.evaluate(()=>window.JGRTabsExperimental.activate('jgr-1'));
 start=await clocks(page);await page.waitForTimeout(250);end=await clocks(page);
 assert.equal(end['jgr-2'].time,start['jgr-2'].time);assert(end['jgr-3'].time>start['jgr-3'].time);
 await chooseLayout(page,'single');boxes=await sizes(page);
 assert.equal(boxes.filter(b=>b.hidden==='false').length,1);assert.equal(boxes.find(b=>b.hidden==='false').id,'jgr-1');
 start=await clocks(page);await page.waitForTimeout(250);end=await clocks(page);
 assert.equal(end['jgr-3'].time,start['jgr-3'].time);assert.equal(end['jgr-3'].running,false);
 await chooseLayout(page,'vertical');end=await clocks(page);
 assert.equal(end['jgr-2'].running,false);assert.equal(end['jgr-3'].running,true,'Previously running visible sessions resume');
 await page.locator('#add-tab').click();await ready(page,4);
 assert.equal(await page.evaluate(()=>[...document.querySelector('iframe[data-tab-id="jgr-4"]').contentWindow.CircuitJS1.getElements()].length),0);
 assert((await sizes(page)).every(b=>b.hidden==='false'));
 await page.locator('.tab[data-tab-id="jgr-4"] .close').click();await ready(page,3);
 assert.equal(await page.evaluate(()=>window.JGRTabsExperimental.getLayout()),'vertical');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);boxes=await sizes(page);
 assert(boxes.every(b=>b.width>=320&&b.canvasWidth>100));
 await chooseLayout(page,'horizontal');boxes=await sizes(page);
 assert(boxes.every(b=>b.width>=320&&b.width<=390&&b.height>=280));
 for(const b of boxes){
  const controls=await page.locator('#jgr-tab-strip').evaluate(el=>['add-tab','duplicate-tab','arrange-tabs','jgr-sidebar-toggle'].map(id=>{const r=el.querySelector('#'+id).getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;}));
  assert(controls.every(Boolean),'All controls remain accessible on narrow tiles');
 }
 assert.deepEqual(errors,[]);
 console.log('OK tiled tabs: horizontal and vertical layouts, menu keyboard/Escape, simultaneous independent engines, pause/resume, edit focus, tab ordering, opening/closing, narrow screens and no reloads');
}finally{await browser.close();}
