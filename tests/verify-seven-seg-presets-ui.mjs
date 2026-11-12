import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try {
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1500,height:950}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html?jgr-tabs-prototype=display-test');
 await page.locator('#lab-start-accept').click({timeout:30000});
 await page.waitForFunction(()=>!!window.__CircuitJGRExperimentalApp&&!!window.CircuitJS1?.getElements);
 const labels=['Display de 7 segmentos (Digital, sin terminal común)','Display de 7 segmentos (Cátodo común)','Display de 7 segmentos (Ánodo común)'];
 for(const [index,label] of labels.entries()) {
  await page.evaluate(()=>{
   window.CircuitJS1.importCircuit('<cir f="0" ts="0.00005" ic="125" cb="50" pb="50" vr="5" mts="5e-11"/>',false);
   window.CircuitJS1.setSimRunning(false);
  });
  await page.locator('td.gwt-MenuItem').filter({hasText:/^Dibujar$/}).click();
  await page.locator('td.gwt-MenuItem.open > ul > li.hasSubmenu').filter({hasText:/Circuitos integrados digitales/}).hover();
  await page.locator('td.gwt-MenuItem.open li.hasSubmenu.open > ul > li.hasSubmenu').filter({hasText:/Otros componentes digitales/}).hover();
  const submenu=page.locator('td.gwt-MenuItem.open li.hasSubmenu.open li.hasSubmenu.open > ul');
  const actual=await submenu.locator(':scope > li .itemLabel').allTextContents();
  const first=actual.indexOf(labels[0]);
  assert.deepEqual(actual.slice(first,first+3),labels,'Three consecutive display presets');
  await submenu.locator('.itemLabel').filter({hasText:label}).click();
  await page.mouse.move(400,240);await page.mouse.down();await page.mouse.move(496,240,{steps:8});await page.mouse.up();
  const saved=await page.evaluate(()=>window.CircuitJS1.exportCircuit());
  const di=[0,1,-1][index];
  assert(saved.includes('<ssd ')&&saved.includes(`di="${di}"`),label+' saves as original ssd');
  await page.evaluate(xml=>window.CircuitJS1.importCircuit(xml,false),saved);
  const state=await page.evaluate(()=>{
   const elm=window.__CircuitJGRExperimentalApp.elmList[0];
   return {direction:elm.diodeDirection,pins:elm.getPostCount(),common:elm.commonPin,base:elm.getDumpClass().name};
  });
  assert.deepEqual(state,{direction:di,pins:index===0?7:8,common:index===0?-1:7,base:'SevenSegElm'});
 }
 // The existing palette must also expose the new presets and numbered ICs.
 await page.keyboard.press('/');
 const input=page.locator('.command-palette-input');await input.waitFor({state:'visible'});
 await input.fill('segmentos');await input.press('s');await input.press('Backspace');
 for(const label of labels)assert((await page.locator('.command-palette-item-label').allTextContents()).some(s=>s.includes(label)));
 await input.fill('4026');await input.press('x');await input.press('Backspace');
 assert((await page.locator('.command-palette-item-label').allTextContents()).some(s=>/4026/.test(s)));
 await page.keyboard.press('Escape');await input.waitFor({state:'hidden'});
 assert.deepEqual(errors,[]);
 console.log('OK: consecutive display presets, real menu placement, 7/8 pins, unchanged XML, reload and existing search');
} finally {await browser.close();}
