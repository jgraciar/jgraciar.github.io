import assert from "node:assert/strict";
import {chromium} from "playwright";

const ORIGIN=process.env.TABS_URL||"http://127.0.0.1:8767/tabs-experimental.html";
const sample=(r,y=176)=>'<cir f="0" ts="0.00005" ic="125" cb="50" pb="50" vr="5" mts="5e-11"><r x="160 '+y+' 304 '+y+'" f="0" r="'+r+'"/></cir>';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1510,height:1000},acceptDownloads:true});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.addInitScript(()=>{try{localStorage.setItem("labStartConfigured","1");}catch{}});
 await page.goto(ORIGIN,{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>window.JGRTabsExperimental?.list().length===1&&
  window.JGRTabsExperimental.list()[0].ready,null,{timeout:90000});
 assert.equal(await page.locator("#workspace iframe").count(),1);
 const evalApi=(id,fn,arg)=>page.evaluate(({id,fn,arg})=>{
  const frame=document.querySelector('iframe[data-tab-id="'+id+'"]');
  const api=frame?.contentWindow.CircuitJS1;
  if(!api)throw Error("No CircuitJS1 API in "+id);
  if(fn==="count")return api.getElements().length;
  if(fn==="running")return api.isRunning();
  if(fn==="import"){api.importCircuit(arg,false);return api.getElements().length;}
  if(fn==="export")return api.exportCircuit();
  if(fn==="start"){api.setSimRunning(true);return api.isRunning();}
  if(fn==="stop"){api.setSimRunning(false);return api.isRunning();}
  throw Error("Unsupported operation");
 },{id,fn,arg});
 const first="jgr-1";
 assert.equal(await evalApi(first,"count"),0,"New tab should start with an empty circuit");
 assert.equal(await evalApi(first,"import",sample(220)),1);
 assert.match(await evalApi(first,"export"),/r="220"/);

 await page.locator("#new-tab").click();
 const second="jgr-2";
 await page.waitForFunction(()=>window.JGRTabsExperimental.list().length===2&&
   window.JGRTabsExperimental.list().every(t=>t.ready),null,{timeout:90000});
 assert.equal(await evalApi(second,"count"),0);
 assert.equal(await evalApi(first,"count"),1,"Opening new tab must not replace the source circuit");
 await evalApi(first,"start");
 await page.locator('.tab[data-tab-id="jgr-1"] .choose').click();
 assert.equal(await evalApi(second,"running"),false,"Inactive simulation must stay paused");
 await page.locator('.tab[data-tab-id="jgr-2"] .choose').click();
 assert.equal(await evalApi(first,"running"),false,"Switching tabs pauses the old simulator");

 // The underlying editor writes a model-aware XML selection to localStorage.circuitClipboard.
 // Trigger real keyboard shortcuts in the source iframe; use that unchanged clipboard
 // in the destination iframe (not a synthetic XML transfer).
 const focusCanvas=async id=>{
  const frame=page.frameLocator('iframe[data-tab-id="'+id+'"]');
  const canvas=frame.locator('canvas').first();
  await canvas.waitFor({state:"visible",timeout:30000});
  await canvas.evaluate(el=>{el.tabIndex=0;el.focus();});
  return canvas;
 };
 await page.locator('.tab[data-tab-id="jgr-1"] .choose').click();
 const sourceCanvas=await focusCanvas(first);
 await sourceCanvas.press("Control+a");
 await sourceCanvas.press("Control+c");
 const clipboard=await page.evaluate(()=>localStorage.getItem("circuitClipboard"));
 assert(clipboard&&clipboard.includes('r="220"'),
  "Native Ctrl+C must save selected circuit elements in shared clipboard");
 await page.locator('.tab[data-tab-id="jgr-2"] .choose').click();
 const targetCanvas=await focusCanvas(second);
 await targetCanvas.press("Control+v");
 await page.waitForFunction(()=>document.querySelector('iframe[data-tab-id="jgr-2"]')
  ?.contentWindow.CircuitJS1.getElements().length===1,null,{timeout:30000});
 assert.match(await evalApi(second,"export"),/r="220"/);
 assert.equal(await evalApi(first,"count"),1,"Native paste must leave source unchanged");
 await targetCanvas.press("Control+z");
 await page.waitForFunction(()=>document.querySelector('iframe[data-tab-id="jgr-2"]')
  ?.contentWindow.CircuitJS1.getElements().length===0,null,{timeout:30000});
 assert.equal(await evalApi(first,"count"),1,"Undo in destination may not affect source");
 console.log("OK: two isolated Circuit JGR instances, native Ctrl+C / Ctrl+V and independent Undo");

 // Open multiple files in a single picker operation.
 await page.locator("#open-files").setInputFiles([
  {name:"red-100.circuitjs",mimeType:"application/xml",buffer:Buffer.from(sample(100))},
  {name:"red-470.circuitjs",mimeType:"application/xml",buffer:Buffer.from(sample(470,256))}
 ]);
 await page.waitForFunction(()=>window.JGRTabsExperimental.list().length===4&&
  window.JGRTabsExperimental.list().every(t=>t.ready),null,{timeout:90000});
 assert.match(await evalApi("jgr-3","export"),/r="100"/);
 assert.match(await evalApi("jgr-4","export"),/r="470"/);
 assert.equal(await evalApi(first,"count"),1);
 assert.equal(await evalApi(second,"count"),0);
 assert((await page.locator('.tab').allTextContents()).some(x=>x.includes("red-100.circuitjs")));
 console.log("OK: batch opening two different circuit files preserves the other tabs");

 // Save current tab with its own name/content, then duplicate without replacing it.
 const downloadPromise=page.waitForEvent("download");
 await page.locator("#download-tab").click();
 const download=await downloadPromise;
 assert.equal(download.suggestedFilename(),"red-470.circuitjs");
 await page.locator("#duplicate-tab").click();
 await page.waitForFunction(()=>window.JGRTabsExperimental.list().length===5&&
  window.JGRTabsExperimental.list().every(t=>t.ready),null,{timeout:90000});
 assert.match(await evalApi("jgr-5","export"),/r="470"/);
 const dialogPromise=new Promise(resolve=>page.once("dialog",async dialog=>{
  assert.equal(dialog.type(),"confirm");await dialog.accept();resolve();
 }));
 await page.locator('.tab[data-tab-id="jgr-5"] .close').click();
 await dialogPromise;
 await page.waitForFunction(()=>window.JGRTabsExperimental.list().length===4);
 assert.match(await evalApi("jgr-4","export"),/r="470"/);
 assert.deepEqual(errors,[],"No browser runtime errors in parent or child Circuit JGR sessions");
 console.log("OK: export, duplicate tab, close with warning, independent states and no runtime errors");
}finally{await browser.close();}
