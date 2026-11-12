import assert from "node:assert/strict";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1450,height:900},locale:"es-ES"}),errors=[];
 page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem("labStartConfigured","1"));
 await page.goto("http://127.0.0.1:8767/circuitjgr-core.html?lang=es&jgr-tabs-prototype=generic-editor-test");
 if(await page.locator("#lab-start-accept").count())await page.locator("#lab-start-accept").click({timeout:30000});
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements&&!!window.__CircuitJGRExperimentalApp?.commands);
 const result=await page.evaluate(()=>{
  const api=window.CircuitJS1,found=[];
  function check(test,description){if(!test)throw Error(description);}
  for(const [name,postCount,flags] of [
   ["DFlipFlop",4,0],["JKFlipFlop",5,0],["TFlipFlop",4,0],
   ["RSGeneric",4,0],["RSGeneric",5,2<<7],
   ["BinaryToBCD4",12,0],["SevenSegNumeric",7,0]
  ]){
   api.setSimRunning(false);
   const xml='<cir f="0" ts="0.00005" ic="125" cb="50" pb="50" vr="5" mts="5e-11"><'+name+' x="160 160 192 160" f="'+flags+'"/></cir>';
   api.importCircuit(xml,false);api.setSimRunning(false);
   const elements=Array.from(api.getElements());
   const chip=elements.find(e=>e.getType()===name+"Elm");
   check(!!chip,"Missing "+name);
   check(chip.getPostCount()===postCount,"Posts for "+name+": "+chip.getPostCount());
   const saved=api.exportCircuit();
   check(saved.includes("<"+name+" ")&&saved.includes('f="'),"XML for "+name);
   found.push({name,postCount});
  }
  return found;
 });
 assert.equal(result.length,7);
 for(const [tag,count,flags] of [['DFlipFlop',4,0],['TFlipFlop',4,0],['JKFlipFlop',5,0],['RSGeneric',5,4<<7]]){
  await page.evaluate(({tag,flags})=>{
   const api=window.CircuitJS1;api.setSimRunning(false);
   api.importCircuit(`<cir f="0" ts="0.00005"><${tag} x="160 160 192 160" f="${flags}"/></cir>`,false);
   window.__CircuitJGRExperimentalApp.commands.doEdit(window.__CircuitJGRExperimentalApp.elmList[0]);
  },{tag,flags});
  const dialog=page.locator('dialog.circuitDialog[open]');await dialog.waitFor({state:'visible'});
  assert.equal(await dialog.locator('select').count(),2,tag+': only mode and asynchronous selectors');
  assert.equal(await dialog.locator('input[type="checkbox"]').count(),0,tag+': redundant terminal/inversion checkboxes removed');
  const geometry=()=>page.evaluate(count=>{
   const c=window.__CircuitJGRExperimentalApp.elmList[0];
   return {body:[...c.rectPointsX,...c.rectPointsY],pins:c.pins.slice(0,count).map(p=>[p.post.x,p.post.y])};
  },count);
  const original=await geometry();
  for(const mode of [1,2,0]){
   await dialog.locator('select').last().selectOption({index:mode});
   assert.deepEqual(await geometry(),original,tag+': controls preserve body size and existing pin positions');
   const state=await page.evaluate(()=>{const c=window.__CircuitJGRExperimentalApp.elmList[0];return {mode:c.jgrAsyncMode(),count:c.getPostCount(),sizeX:c.sizeX,sizeY:c.sizeY};});
   assert.equal(state.mode,mode);assert.equal(state.count,count+(mode?2:0));assert.equal(state.sizeX,2);assert.equal(state.sizeY,3);
   assert.equal(await dialog.locator('input[type="checkbox"]').count(),0);
  }
  await dialog.press('Escape');
 }
 assert.deepEqual(errors,[]);
 console.log('OK: D/T/JK/RS fixed symbol polygons and existing pin coordinates through SET/RESET, PR/CLR and None; compact native editors');
 console.log("OK new digital models imported, exposed through public API and exported as XML",result);
}finally{await browser.close();}
