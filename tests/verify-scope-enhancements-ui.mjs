import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1450,height:960}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('labStartConfigured','1'));
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html?lang=es&jgr-tabs-prototype=test');
 await page.waitForFunction(()=>window.__CircuitJGRExperimentalApp?.scopeManager?.scopeCount>0
   && document.querySelector('.verticalPanel .lab-start-settings'));
 const baseline=await page.evaluate(()=>{
  const app=window.__CircuitJGRExperimentalApp, panel=app.ui.verticalPanel;
  const settings=panel.querySelector('.lab-start-settings'),reset=app.ui.resetButton;
  const run=app.ui.runStopButton;
  const panelRect=panel.getBoundingClientRect(),settingsRect=settings.getBoundingClientRect();
  const resetStyle=getComputedStyle(reset),settingsStyle=getComputedStyle(settings);
  return {panelBackground:getComputedStyle(panel).backgroundColor,
   buttonIsInPanel:settings.parentElement===panel,
   leftOffset:settingsRect.left-panelRect.left,
   bottomGap:panelRect.bottom-settingsRect.bottom,
   resetParent:reset.parentElement===app.ui.buttonPanel,
   runParent:run.parentElement===app.ui.buttonPanel,
   sameBorder:settingsStyle.borderRadius===resetStyle.borderRadius,
   sameFont:settingsStyle.fontSize===resetStyle.fontSize,
   brightnessActive:!app.ui.powerLabel.classList.contains('disabled'),
   hasSeparateStatus:!!panel.querySelector('#jgr-saved-state'),
   hasSeparateDetails:!!panel.querySelector('#jgr-component-info'),
   detailsSpacing:getComputedStyle(panel.querySelector('#jgr-component-info')).marginTop};
 });
 assert.equal(baseline.panelBackground,'rgb(232, 232, 232)','La barra debe tener el gris de las pestañas');
 assert(baseline.buttonIsInPanel,'Configuración debe estar integrada en la barra lateral');
 assert(baseline.leftOffset>=0 && baseline.leftOffset<18,'Configuración debe alinearse a la izquierda');
 assert(baseline.bottomGap>=-2 && baseline.bottomGap<55,'Configuración debe estar abajo');
 assert(baseline.resetParent&&baseline.runParent,'Reiniciar e Iniciar/Detener no deben desplazarse');
 assert(baseline.sameBorder&&baseline.sameFont,'Configuración debe compartir estilo con Reiniciar');
 assert(baseline.brightnessActive,'El regulador de brillo debe estar habilitado');
 assert(baseline.hasSeparateStatus&&baseline.hasSeparateDetails
  && parseFloat(baseline.detailsSpacing)>=12,
  'Estado guardado e información del componente deben estar separados');

 await page.evaluate(()=>{
  const app=window.__CircuitJGRExperimentalApp;
  app.savedFlag=true;app.mouse.mousePost=-1;app.mouse.setMouseElm(app.elmList[0]);app.ui.repaint();
 });
 await page.waitForFunction(()=>document.querySelector('#jgr-saved-state')?.textContent?.includes('(saved)')
  && document.querySelector('#jgr-component-info')?.textContent?.length>1);
 const statusPosition=await page.evaluate(()=>{
  const save=document.querySelector('#jgr-saved-state').getBoundingClientRect();
  const details=document.querySelector('#jgr-component-info').getBoundingClientRect();
  return {saveBottom:save.bottom,detailsTop:details.top};
 });
 assert(statusPosition.detailsTop>=statusPosition.saveBottom+10,'El componente no puede tapar (saved)');
 await page.evaluate(()=>{
  const app=window.__CircuitJGRExperimentalApp;
  app.savedFlag=false;app.mouse.setMouseElm(null);
 });

 const settings=page.locator('.verticalPanel .lab-start-settings');
 await settings.click();
 const modal=page.locator('#lab-start-modal');
 await modal.waitFor({state:'visible'});
 assert.equal(await modal.evaluate(e=>e.tagName),'DIALOG','Configuración debe ser un diálogo nativo');
 assert(await modal.evaluate(e=>e.classList.contains('circuitDialog')),
   'La configuración debe utilizar el mismo estilo que los diálogos del simulador');
 await modal.locator('#lab-start-accept').click();
 await modal.waitFor({state:'hidden'});

 const scopeInfo=await page.evaluate(()=>{
  const app=window.__CircuitJGRExperimentalApp;
  const scope=app.scopeManager.scopes[0];scope.setText(null);
  return {count:app.scopeManager.scopeCount,label:scope.getScopeLabelOrText(true),
   width:scope.traceWidth};
 });
 assert(scopeInfo.count>0);
 assert.match(scopeInfo.label,/E\d+/,'Sin título el osciloscopio debe identificar la fuente');
 assert.equal(scopeInfo.width,1,'Grosor inicial de 1 px');

 await page.evaluate(()=>window.__CircuitJGRExperimentalApp.scopeManager.scopes[0].showProperties());
 const lineWidth=page.locator('#jgr-trace-width');
 await lineWidth.waitFor({state:'visible'});
 await lineWidth.selectOption('3');
 assert.equal(await page.evaluate(()=>window.__CircuitJGRExperimentalApp.scopeManager.scopes[0].traceWidth),3);
 await page.locator('dialog.circuitDialog').last().getByRole('button',{name:/OK|Aceptar/i}).click();
 const xml=await page.evaluate(()=>window.CircuitJS1.exportCircuit());
 assert.match(xml,/\blw="3"/,'El grosor debe conservarse al guardar');
 await page.evaluate(xml=>window.CircuitJS1.importCircuit(xml,false),xml);
 assert(await page.evaluate(()=>window.__CircuitJGRExperimentalApp.scopeManager.scopes
   .slice(0,window.__CircuitJGRExperimentalApp.scopeManager.scopeCount).some(s=>s?.traceWidth===3)),
   'El grosor debe recuperarse tras abrir el circuito');

 await page.evaluate(()=>{
  window.jgrScopeMarkerHits=[];
  const original=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,...args){
   if(/^E\d+$/.test(String(text)))window.jgrScopeMarkerHits.push(String(text));
   return original.call(this,text,...args);
  };
 });
 const hover=await page.evaluate(()=>{
  const app=window.__CircuitJGRExperimentalApp,s=app.scopeManager.scopes[0];
  const r=app.ui.cv.getBoundingClientRect();
  return {x:r.x+s.rect.x+Math.min(20,s.rect.width/2),y:r.y+s.rect.y+Math.min(20,s.rect.height/2)};
 });
 await page.mouse.move(hover.x,hover.y);
 await page.waitForFunction(()=>window.jgrScopeMarkerHits.length>0,null,{timeout:10000});
 assert.deepEqual(errors,[],'No deben producirse errores JavaScript');
 console.log('OK: barra gris, Configuración a la izquierda, botones nativos intactos, brillo, (saved), diálogo nativo, grosor por osciloscopio y localización E#');
}finally{
 await browser.close();
}
