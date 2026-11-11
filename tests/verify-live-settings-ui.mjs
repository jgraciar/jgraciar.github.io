import assert from 'node:assert/strict';
import {chromium}from'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'en-GB'});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/circuitjgr.html?lang=en&whiteBackground=false');
 await page.waitForFunction(()=>window.CircuitJS1?.applyInitialSettings);
 await page.locator('#lab-start-accept').click();
 await page.locator('#lab-start-modal').waitFor({state:'hidden'});
 await page.waitForFunction(()=>window.CircuitJS1.getTime()>.05);
 const before=await page.evaluate(()=>{
  window.CircuitJS1.setSimRunning(false);
  window.liveSettingsApi=window.CircuitJS1;
  return {circuit:window.CircuitJS1.exportCircuit().split('\n').slice(1).join('\n'),time:window.CircuitJS1.getTime()};
 });
 for(const [lang,light,format]of [['es',true,'eu'],['en',false,'uk']]){
  await page.locator('.lab-start-settings').click();
  await page.locator('#lab-start-language').selectOption(lang);
  await page.locator(`input[name="lab-start-background"][value="${light}"]`).check();
  await page.locator(`input[name="lab-start-format"][value="${format}"]`).check();
  assert(await page.locator(`input[name="lab-start-background"][value="${light}"]`).isChecked(),'Mantener fondo al cambiar otras opciones');
  await page.locator('#lab-start-plus').click();
  await page.locator('#lab-start-accept').click();
  await page.locator('#lab-start-modal').waitFor({state:'hidden'});
  await page.waitForFunction(light=>document.querySelector('.canvasWrapper > canvas').style.backgroundColor===(light?'rgb(255, 255, 255)':'rgb(0, 0, 0)'),light);
  const after=await page.evaluate(()=>({sameApi:window.liveSettingsApi===window.CircuitJS1,circuit:window.CircuitJS1.exportCircuit().split('\n').slice(1).join('\n'),time:window.CircuitJS1.getTime(),running:window.CircuitJS1.isRunning(),background:localStorage.getItem('whiteBackground'),digits:localStorage.getItem('decimalDigits'),decimal:localStorage.getItem('labDecimalSeparator')}));
  assert(after.sameApi,'No se ha recargado el motor');assert.equal(after.circuit,before.circuit);assert.equal(after.time,before.time);assert.equal(after.running,false);assert.equal(after.background,String(light));assert.equal(after.decimal,format==='eu'?',':'.');assert(Number(after.digits)>4);
  await page.waitForFunction(label=>document.querySelector('.gwt-MenuBar-horizontal > table > tbody > tr > td:nth-child(5)')?.firstChild?.textContent?.trim()===label,lang==='es'?'Opciones':'Options');
 }
 assert.deepEqual(errors,[]);console.log('OK: fondo, idioma y formato en vivo, mismo circuito, tiempo y estado de pausa.');
}finally{await browser.close();}
