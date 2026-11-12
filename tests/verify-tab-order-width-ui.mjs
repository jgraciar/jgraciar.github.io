import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
const sample=r=>`<cir f="0" ts="0.00005"><r x="160 160 256 160" f="0" r="${r}"/></cir>`;
const setup=page=>page.addInitScript(()=>{localStorage.setItem('labStartConfigured','1');localStorage.setItem('labLanguageMode','manual');localStorage.setItem('language','es');});
const ready=async(page,n)=>{
 try{await page.waitForFunction(n=>window.JGRTabsExperimental?.list().length===n&&window.JGRTabsExperimental.list().every(t=>t.ready),n,{timeout:45000});}
 catch(error){console.log('Tab readiness diagnostic',JSON.stringify(await page.evaluate(()=>({tabs:window.JGRTabsExperimental?.list(),notice:document.querySelector('#notice')?.textContent,frames:[...document.querySelectorAll('iframe')].map(f=>({id:f.dataset.tabId,api:!!f.contentWindow.CircuitJS1}))}))));throw error;}
};
const order=page=>page.evaluate(()=>window.JGRTabsExperimental.list().map(t=>t.id));
const active=page=>page.evaluate(()=>window.JGRTabsExperimental.getActive());
const strip=async page=>page.frameLocator(`iframe[data-tab-id="${await active(page)}"]`).locator('#jgr-tab-strip');
async function snapshot(page){return page.evaluate(()=>[...document.querySelectorAll('#workspace iframe')].map(f=>{
 const api=f.contentWindow.CircuitJS1;api.setSimRunning(false);
 return {id:f.dataset.tabId,xml:api.exportCircuit(),time:api.getTime()};
}).sort((a,b)=>a.id.localeCompare(b.id)));}
async function geometry(page){return (await strip(page)).evaluate(el=>{
 const box=node=>{const r=node.getBoundingClientRect();return {left:r.left,right:r.right,width:r.width};};
 const list=el.querySelector('.jgr-tab-list');
 return {width:innerWidth,strip:box(el),list:box(list),scroll:list.scrollWidth,visible:list.clientWidth,
  plus:box(el.querySelector('#add-tab')),side:box(el.querySelector('#jgr-sidebar-toggle')),
  tabs:[...list.querySelectorAll('.tab')].map(box),enabled:!el.querySelector('#add-tab').disabled};
 });}
function accessible(g){assert(g.strip.left>=0&&g.strip.right<=g.width+1);assert(g.plus.left>=0&&g.plus.right<=g.width);assert(g.side.right<=g.width);assert(g.list.right<=g.plus.left+1);assert(g.plus.right<=g.side.left+1);assert(g.enabled);}
function adjacent(g){
 accessible(g);
 assert(Math.abs(g.plus.left-g.tabs.at(-1).right-4)<2,'The + button follows the last tab without unused space');
}
async function drag(page,id,target,fraction=.2,hold=false,cancel=false){
 const nav=await strip(page),source=await nav.locator(`.tab[data-tab-id="${id}"] .choose`).boundingBox();
 const destination=await nav.locator(`.tab[data-tab-id="${target}"]`).boundingBox();
 assert(source&&destination);
 await page.mouse.move(source.x+source.width/2,source.y+source.height/2);await page.mouse.down();
 if(hold){
  await page.evaluate(()=>document.querySelector('iframe[data-tab-id="jgr-1"]').contentWindow.__CircuitJGRExperimentalApp.unsavedChanges=true);
  await page.waitForTimeout(1100);
 }
 await page.mouse.move(destination.x+destination.width*fraction,destination.y+destination.height/2,{steps:12});
 await page.waitForTimeout(60);if(cancel)await page.keyboard.press('Escape');await page.mouse.up();
}
try{
 const errors=[],page=await browser.newPage({locale:'es-ES',viewport:{width:1500,height:950}});
 page.on('pageerror',e=>errors.push(e.message));await setup(page);await page.goto('http://127.0.0.1:8767/circuitjgr.html');await ready(page,1);
 adjacent(await geometry(page));
 await page.evaluate(xml=>{const api=document.querySelector('iframe').contentWindow.CircuitJS1;api.setSimRunning(false);api.importCircuit(xml,false);},sample(91));
 await page.locator('#open-files').setInputFiles(Array.from({length:4},(_,i)=>({name:`Circuito_${i+2}_con_un_nombre_largo_para_comprobar_el_ajuste.jgr`,mimeType:'text/plain',buffer:Buffer.from(sample(200+i))})));
 await ready(page,5);
 adjacent(await geometry(page));
 const before=await snapshot(page);
 await page.evaluate(()=>window.tabApiRefs=Object.fromEntries([...document.querySelectorAll('iframe')].map(f=>[f.dataset.tabId,f.contentWindow.CircuitJS1])));
 assert.equal(await active(page),'jgr-5');
 await drag(page,'jgr-1','jgr-4',.2,true);
 assert.deepEqual(await order(page),['jgr-2','jgr-3','jgr-1','jgr-4','jgr-5']);assert.equal(await active(page),'jgr-5');
 await drag(page,'jgr-1','jgr-2',.1);
 assert.deepEqual(await order(page),['jgr-1','jgr-2','jgr-3','jgr-4','jgr-5']);
 let nav=await strip(page);const keyboardTab=nav.locator('.tab[data-tab-id="jgr-3"] .choose');
 await keyboardTab.focus();await keyboardTab.press('Alt+Shift+ArrowLeft');
 assert.deepEqual(await order(page),['jgr-1','jgr-3','jgr-2','jgr-4','jgr-5']);
 await nav.locator('.tab[data-tab-id="jgr-3"] .choose').press('Alt+Shift+ArrowRight');
 const originalOrder=await order(page);await drag(page,'jgr-2','jgr-4',.8,false,true);assert.deepEqual(await order(page),originalOrder,'Escape cancels reordering');
 assert.deepEqual(await snapshot(page),before,'Dragging and keyboard order preserve circuit XML and clocks');
 assert(await page.evaluate(()=>[...document.querySelectorAll('iframe')].every(f=>window.tabApiRefs[f.dataset.tabId]===f.contentWindow.CircuitJS1)),'No engines reloaded');
 const copies=await page.evaluate(()=>[...document.querySelectorAll('iframe')].map(f=>[...f.contentDocument.querySelectorAll('#jgr-tab-strip .tab')].map(t=>t.dataset.tabId)));
 for(const copy of copies)assert.deepEqual(copy,originalOrder,'All tab bars keep the same order');
 for(let n=6;n<=10;n++){
  await (await strip(page)).locator('#add-tab').click();await ready(page,n);await snapshot(page);
 }
 const wide=await geometry(page);adjacent(wide);assert(wide.scroll<=wide.visible+1,'Ten tabs fit at desktop width');
 assert(Math.max(...wide.tabs.map(t=>t.width))-Math.min(...wide.tabs.map(t=>t.width))<2,'Widths distributed evenly');
 await page.setViewportSize({width:1000,height:800});await page.waitForTimeout(100);const medium=await geometry(page);accessible(medium);assert(medium.tabs[0].width<wide.tabs[0].width);
 for(const width of [560,320]){await page.setViewportSize({width,height:760});await page.waitForTimeout(100);accessible(await geometry(page));}
 await (await strip(page)).locator('#add-tab').click();await ready(page,11);await snapshot(page);accessible(await geometry(page));
 const last=await (await strip(page)).locator('.tab[data-tab-id="jgr-11"]').boundingBox();const small=await geometry(page);
 assert(last.x>=small.list.left-1&&last.x+last.width<=small.list.right+1,'New active tab is revealed automatically');
 await (await strip(page)).locator('.tab[data-tab-id="jgr-11"] .close').click();await ready(page,10);
 console.log('OK desktop: two-way drag, queued state refresh, keyboard, Escape, stable engines/XML/time, ten tabs, 320–1500px widths, adjacent and accessible + and closing after resize');

 const mobile=await browser.newPage({locale:'es-ES',viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 mobile.on('pageerror',e=>errors.push(e.message));await setup(mobile);await mobile.goto('http://127.0.0.1:8767/circuitjgr.html');await ready(mobile,1);
 adjacent(await geometry(mobile));
 for(let n=2;n<=3;n++){await (await strip(mobile)).locator('#add-tab').tap();await ready(mobile,n);}
 await snapshot(mobile);const touch=await mobile.context().newCDPSession(mobile);
 async function swipe(id,target,hold){
  const bar=await strip(mobile),a=await bar.locator(`.tab[data-tab-id="${id}"] .choose`).boundingBox();
  const b=target?await bar.locator(`.tab[data-tab-id="${target}"]`).boundingBox():null;
  const x=a.x+a.width/2,y=a.y+a.height/2,end=b?b.x+b.width*.2:x+65;
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  if(hold)await mobile.waitForTimeout(350);
  for(let i=1;i<=8;i++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(end-x)*i/8,y,id:0}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 }
 await swipe('jgr-1','jgr-3',true);assert.deepEqual(await order(mobile),['jgr-2','jgr-1','jgr-3']);assert.equal(await active(mobile),'jgr-3');
 for(let n=4;n<=7;n++){await (await strip(mobile)).locator('#add-tab').tap();console.log('Mobile + tap',n,await order(mobile));await ready(mobile,n);}
 const mobileOrder=await order(mobile),beforeScroll=await (await strip(mobile)).locator('.jgr-tab-list').evaluate(el=>el.scrollLeft);
 assert(beforeScroll>0);await swipe('jgr-6',null,false);
 assert.deepEqual(await order(mobile),mobileOrder,'A short swipe scrolls without reordering');
 assert((await (await strip(mobile)).locator('.jgr-tab-list').evaluate(el=>el.scrollLeft))<beforeScroll);
 accessible(await geometry(mobile));assert.deepEqual(errors,[]);
 console.log('OK mobile: long-press touch reordering, horizontal swipe scrolling and always accessible fixed controls');
}finally{await browser.close();}
