import assert from "node:assert/strict";
import {chromium} from "playwright";

const ORIGIN=process.env.TABS_URL||"http://127.0.0.1:8767/tabs-experimental.html";
const sample=(r,y=176)=>'<cir f="0" ts="0.00005" ic="125" cb="50" pb="50" vr="5" mts="5e-11"><r x="160 '+y+' 304 '+y+'" f="0" r="'+r+'"/></cir>';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1510,height:1000},acceptDownloads:true});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.addInitScript(()=>localStorage.setItem("labStartConfigured","1"));
 await page.goto(ORIGIN,{waitUntil:"domcontentloaded"});
 const list=()=>page.evaluate(()=>window.JGRTabsExperimental.list());
 const ready=async n=>page.waitForFunction(n=>window.JGRTabsExperimental.list().length===n&&
    window.JGRTabsExperimental.list().every(t=>t.ready),n,{timeout:90000});
 await ready(1);
 const accepted=await page.locator("#open-files").getAttribute("accept");
 assert.equal(accepted,".jgr,.txt,.circuitjs,.xml",
  "La extensión .jgr debe figurar primero en Abrir archivo...");
 assert.equal(await page.locator("#workspace iframe").count(),1);
 assert.equal(await page.locator("#tabs").count(),0);
 assert.equal(await page.frameLocator('iframe[data-tab-id="jgr-1"]').locator("#jgr-tab-strip").count(),1);
 assert.equal(await page.locator("header,footer,#duplicate-tab,#rename-tab,#download-tab").count(),0,
  "Las pestañas deben estar integradas, sin barra externa de acciones");

 const sim=(id,action,arg)=>page.evaluate(({id,action,arg})=>{
  const frame=document.querySelector('iframe[data-tab-id="'+id+'"]');
  const api=frame?.contentWindow.CircuitJS1;
  const app=frame?.contentWindow.__CircuitJGRExperimentalApp;
  if(!api||!app)throw Error("Falta el simulador "+id);
  if(action==="count")return app.elmList.length;
  if(action==="import"){api.importCircuit(arg,false);return app.elmList.length;}
  if(action==="export")return api.exportCircuit();
  if(action==="running")return api.isRunning();
  if(action==="start"){api.setSimRunning(true);return api.isRunning();}
  if(action==="modified")return app.isModified();
  if(action==="x")return app.elmList.map(el=>el.x);
  if(action==="menu"){app.commands.menuPerformed("file",arg);return true;}
  throw Error("Acción desconocida");
 },{id,action,arg});
 const stripOf=id=>page.frameLocator('iframe[data-tab-id="'+id+'"]').locator("#jgr-tab-strip");
 const switchTo=async id=>{
  const current=await page.evaluate(()=>window.JGRTabsExperimental.getActive());
  await stripOf(current).locator('.tab[data-tab-id="'+id+'"] .choose').click();
 };
 const closeTab=async id=>{
  const current=await page.evaluate(()=>window.JGRTabsExperimental.getActive());
  await stripOf(current).locator('.tab[data-tab-id="'+id+'"] .close').click();
 };
 const geometry=id=>page.evaluate(id=>{
  const frame=document.querySelector('iframe[data-tab-id="'+id+'"]');
  const doc=frame.contentDocument,app=frame.contentWindow.__CircuitJGRExperimentalApp;
  const strip=doc.getElementById("jgr-tab-strip").getBoundingClientRect();
  const menu=app.menus.menuBar.getBoundingClientRect();
  const toolbar=app.ui.toolbar.element.getBoundingClientRect();
  const canvas=app.ui.canvasWrapper.getBoundingClientRect();
  const panel=app.ui.verticalPanel.getBoundingClientRect();
  return {stripTop:strip.top,stripBottom:strip.bottom,menuBottom:menu.bottom,
   toolbarBottom:toolbar.bottom,toolbarRight:toolbar.right,
   toolbarVisible:app.menus.toolbarCheckItem.getState(),
   canvasTop:canvas.top,canvasHeight:canvas.height,canvasRight:canvas.right,
   canvasWidth:canvas.width,canvasLogicalHeight:app.ui.canvasHeight,
   canvasLogicalWidth:app.ui.canvasWidth,viewportWidth:frame.contentWindow.innerWidth,
   sidebarTop:panel.top,sidebarLeft:panel.left,sidebarRight:panel.right,
   sidebarWidth:panel.width,sidebarDisplay:getComputedStyle(app.ui.verticalPanel).display};
 },id);
 const canvasOf=id=>page.frameLocator('iframe[data-tab-id="'+id+'"]').locator('canvas').first();
 const focusCanvas=async id=>{
  const canvas=canvasOf(id);
  await canvas.waitFor({state:"visible",timeout:30000});
  await canvas.evaluate(el=>{el.tabIndex=0;el.focus();});
  return canvas;
 };
 const origin="jgr-1";
 const originalLayout=await geometry(origin);
 assert(originalLayout.stripTop>=originalLayout.menuBottom-1);
 if(originalLayout.toolbarVisible)
  assert(originalLayout.stripTop>=originalLayout.toolbarBottom-1);
 assert(Math.abs(originalLayout.canvasTop-originalLayout.stripBottom)<=1,
  "El lienzo debe comenzar debajo de las pestañas");
 assert(originalLayout.canvasHeight>150&&originalLayout.canvasLogicalHeight>150);
 assert.equal(originalLayout.sidebarDisplay,"block","El panel debe estar visible al iniciar");
 assert(originalLayout.sidebarWidth>=128,"El panel lateral debe conservar su ancho habitual");
 assert(Math.abs(originalLayout.sidebarTop-originalLayout.stripBottom)<=1,
  "La barra lateral debe empezar después de las pestañas");
 assert(Math.abs(originalLayout.canvasRight-originalLayout.sidebarLeft)<=1,
  "El panel lateral visible no debe tapar el circuito");
 if(originalLayout.toolbarVisible)
  assert(Math.abs(originalLayout.toolbarRight-originalLayout.viewportWidth)<=1,
   "La barra de herramientas debe extenderse por encima de la barra lateral");
 await page.evaluate(()=>document.querySelector('iframe[data-tab-id="jgr-1"]')
  .contentWindow.__CircuitJGRExperimentalApp.menus.toolbarCheckItem.toggle());
 const withoutToolbar=await geometry(origin);
 assert.equal(Math.abs(withoutToolbar.stripTop-originalLayout.stripTop),40);
 assert(Math.abs(withoutToolbar.canvasTop-withoutToolbar.stripBottom)<=1);
 assert(Math.abs(withoutToolbar.sidebarTop-withoutToolbar.stripBottom)<=1,
  "Sin barra de herramientas, el panel debe seguir debajo de las pestañas");
 await page.evaluate(()=>document.querySelector('iframe[data-tab-id="jgr-1"]')
  .contentWindow.__CircuitJGRExperimentalApp.menus.toolbarCheckItem.toggle());
 assert.equal((await geometry(origin)).stripTop,originalLayout.stripTop);
 assert(Math.abs((await geometry(origin)).sidebarTop-originalLayout.sidebarTop)<=1,
  "Al restaurar la barra de herramientas debe moverse también la barra lateral");
 const sidebarButton=stripOf(origin).locator("#jgr-sidebar-toggle");
 assert.equal(await sidebarButton.innerText(),"Ocultar panel lateral");
 await sidebarButton.click();
 const hiddenLayout=await geometry(origin);
 assert.equal(hiddenLayout.sidebarDisplay,"none");
 assert.equal(await sidebarButton.innerText(),"Mostrar panel lateral");
 assert(hiddenLayout.canvasWidth>originalLayout.canvasWidth+120,
  "Ocultar el panel debe recuperar el ancho del circuito");
 assert.equal(hiddenLayout.canvasLogicalWidth,Math.round(hiddenLayout.canvasWidth),
  "La escala interna del lienzo debe actualizarse al ocultar el panel");
 assert(Math.abs(hiddenLayout.canvasRight-hiddenLayout.viewportWidth)<=1,
  "El circuito debe ocupar todo el ancho sin la barra lateral");
 await sidebarButton.click();
 const restoredLayout=await geometry(origin);
 assert.equal(restoredLayout.sidebarDisplay,"block");
 assert.equal(await sidebarButton.innerText(),"Ocultar panel lateral");
 assert(Math.abs(restoredLayout.sidebarTop-restoredLayout.stripBottom)<=1);
 assert(Math.abs(restoredLayout.canvasWidth-originalLayout.canvasWidth)<=1,
  "Mostrar de nuevo el panel debe restaurar la anchura inicial del circuito");
 console.log("OK: panel lateral bajo las pestañas y barra de herramientas, ocultación/restauración y redimensionamiento");
 assert.equal(await sim(origin,"count"),0);
 assert.equal(await sim(origin,"import",sample(220)),1);
 assert.match(await sim(origin,"export"),/r="220"/);

 // El comando real del menú Archivo: nuevo circuito en blanco -> nueva pestaña.
 const fileMenu=page.frameLocator('iframe[data-tab-id="jgr-1"]').locator('td.gwt-MenuItem').first();
 await fileMenu.click();
 await fileMenu.locator(':scope > ul.menuDropdown > li.menuItem').first().click();
 await ready(2);
 const second="jgr-2";
 assert.equal(await sim(second,"count"),0);
 assert.equal(await sim(origin,"count"),1);
 assert(Math.abs((await geometry(second)).sidebarTop-(await geometry(second)).stripBottom)<=1,
  "El segundo circuito también debe colocar el panel debajo de las pestañas");
 await sim(origin,"start");
 await switchTo(origin);
 await switchTo(second);
 assert.equal(await sim(origin,"running"),false,"Las pestañas inactivas deben pausarse");
 console.log("OK: menú Archivo → Nuevo circuito en blanco abre pestaña y aísla el simulador");

 // Copia nativa seleccionada, pegado centrado bajo el cursor y confirmación por clic.
 await switchTo(origin);
 const sourceCanvas=await focusCanvas(origin);
 await sourceCanvas.press("Control+a");
 await sourceCanvas.press("Control+c");
 const clipboard=await page.evaluate(()=>localStorage.getItem("circuitClipboard"));
 assert(clipboard?.includes('r="220"'),"No se ha copiado mediante el portapapeles nativo");
 await switchTo(second);
 const targetCanvas=await focusCanvas(second);
 await targetCanvas.press("Control+v");
 assert.equal(await sim(second,"count"),1);
 const originalX=(await sim(second,"x"))[0];
 const canvasBox=await page.evaluate(()=>{
  const frame=document.querySelector('iframe[data-tab-id="jgr-2"]');
  const canvas=frame.contentWindow.__CircuitJGRExperimentalApp.ui.cv;
  const outer=frame.getBoundingClientRect(),inner=canvas.getBoundingClientRect();
  return {x:outer.x+inner.x,y:outer.y+inner.y,width:inner.width,height:inner.height};
 });
 assert(canvasBox?.width>280&&canvasBox.height>150,
  "No se encuentra el lienzo real de la simulación: "+JSON.stringify(canvasBox));
 await page.mouse.move(canvasBox.x+canvasBox.width*.67,canvasBox.y+canvasBox.height*.34);
 const movedX=(await sim(second,"x"))[0];
 assert.notEqual(movedX,originalX,"Los elementos pegados deben seguir al cursor");
 await page.mouse.click(canvasBox.x+canvasBox.width*.67,canvasBox.y+canvasBox.height*.34);
 const fixedX=(await sim(second,"x"))[0];
 await page.mouse.move(canvasBox.x+canvasBox.width*.32,canvasBox.y+canvasBox.height*.55);
 assert.equal((await sim(second,"x"))[0],fixedX,"El clic debe fijar la posición del pegado");
 assert.equal(await sim(origin,"count"),1,"Copiar no debe alterar la pestaña original");
 assert.equal(await sim(second,"modified"),true);
 await targetCanvas.press("Control+z");
 assert.equal(await sim(second,"count"),0,"Deshacer solo debe afectar a la pestaña de destino");
 console.log("OK: pegar centrado, seguir el ratón, fijar al pulsar y deshacer independientemente");

 // Abrir archivos desde el propio menú de CircuitJS, siempre en pestañas nuevas.
 const chooserPromise=page.waitForEvent("filechooser");
 await sim(second,"menu","importfromlocalfile");
 const chooser=await chooserPromise;
 await chooser.setFiles([
  {name:"red-100.jgr",mimeType:"text/plain",buffer:Buffer.from(sample(100))},
  {name:"red-470.txt",mimeType:"text/plain",buffer:Buffer.from(sample(470,256))}
 ]);
 await ready(4);
 const all=await list();
 assert.equal(all[2].name,"red-100.jgr");
 assert.equal(all[3].name,"red-470.txt");
 assert.match(await sim("jgr-3","export"),/r="100"/);
 assert.match(await sim("jgr-4","export"),/r="470"/);
 assert.equal(await sim(second,"count"),0,"Abrir archivos no debe sustituir la pestaña anterior");
 console.log("OK: menú Archivo → Abrir archivo... crea pestañas con sus nombres originales");

 // Guardar como... utiliza el cuadro nativo, cambia el nombre solo al confirmar.
 await sim("jgr-4","menu","exportaslocalfile");
 const dialog=page.frameLocator('iframe[data-tab-id="jgr-4"]').locator("dialog.circuitDialog").last();
 await dialog.waitFor({state:"visible",timeout:15000});
 const originalDialogStyle=await dialog.evaluate(el=>{
  const css=getComputedStyle(el);
  return {fontFamily:css.fontFamily,fontSize:css.fontSize,
   backgroundColor:css.backgroundColor,borderRadius:css.borderRadius,
   borderStyle:css.borderStyle,padding:css.padding};
 });
 assert.match(await dialog.locator('input[type="text"]').inputValue(),/\.jgr$/i,
  "Guardar como... debe proponer .jgr también para un archivo .txt");
 await dialog.locator('input[type="text"]').fill("esquema-guardado");
 const downloaded=page.waitForEvent("download");
 await dialog.getByRole("button",{name:/OK|Aceptar/i}).click();
 const download=await downloaded;
 assert.equal(download.suggestedFilename(),"esquema-guardado.jgr");
 await page.waitForFunction(()=>window.JGRTabsExperimental.list()[3].name==="esquema-guardado.jgr",null,{timeout:10000});
 assert.equal(await sim("jgr-4","modified"),false);
 console.log("OK: Guardar como... nativo actualiza el nombre de pestaña tras confirmar descarga");

 // Alterar otra pestaña, cerrar: No mantiene, Sí descarta y Guardar como... salva y cierra.
 await switchTo(second);
 await (await focusCanvas(second)).press("Control+v");
 assert.equal(await sim(second,"count"),1);
 await closeTab("jgr-2");
 const closeDialog=page.frameLocator('iframe[data-tab-id="jgr-2"]').locator("#jgr-close-dialog");
 await closeDialog.waitFor({state:"visible",timeout:10000});
 assert.equal(await closeDialog.locator("#jgr-close-question").innerText(),
  "¿Quieres guardar los cambios realizados en «Sin título 2»?");
 assert.equal(await closeDialog.locator("#jgr-close-title").innerText(),"Guardar cambios");
 assert.equal(await closeDialog.locator("#jgr-close-save").innerText(),"Guardar");
 assert.equal(await closeDialog.locator("#jgr-close-discard").innerText(),"No guardar");
 assert.equal(await closeDialog.locator("#jgr-close-cancel").innerText(),"Cancelar");
 const closeDialogStyle=await closeDialog.evaluate(el=>{
  const css=getComputedStyle(el);
  return {fontFamily:css.fontFamily,fontSize:css.fontSize,
   backgroundColor:css.backgroundColor,borderRadius:css.borderRadius,
   borderStyle:css.borderStyle,padding:css.padding};
 });
 assert.deepEqual(closeDialogStyle,originalDialogStyle,
  "El aviso de cambios debe usar el mismo estilo CSS que el diálogo Guardar como... nativo");
 assert.equal(await page.locator("#close-overlay").count(),0,
  "No debe mantenerse un cuadro externo con estilos ajenos al simulador");
 await closeDialog.locator("#jgr-close-cancel").click();
 assert.equal((await list()).length,4,"Cancelar debe conservar la pestaña");
 await closeTab("jgr-2");
 await closeDialog.locator("#jgr-close-save").click();
 const secondDialog=page.frameLocator('iframe[data-tab-id="jgr-2"]').locator("dialog.circuitDialog").last();
 await secondDialog.waitFor({state:"visible",timeout:15000});
 await secondDialog.getByRole("button",{name:/Cancel|Cancelar/i}).click();
 assert.equal((await list()).length,4,"Cancelar Guardar como... no debe cerrar");
 await closeTab("jgr-2");
 await closeDialog.locator("#jgr-close-save").click();
 await secondDialog.waitFor({state:"visible",timeout:15000});
 await secondDialog.locator('input[type="text"]').fill("guardar-antes-de-cerrar");
 const lastDownload=page.waitForEvent("download");
 await secondDialog.getByRole("button",{name:/OK|Aceptar/i}).click();
 assert.equal((await lastDownload).suggestedFilename(),"guardar-antes-de-cerrar.jgr");
 await page.waitForFunction(()=>window.JGRTabsExperimental.list().length===3,null,{timeout:10000});
 assert.equal(await sim(origin,"count"),1);
 assert.equal(await sim("jgr-3","count"),1);
 assert.equal(await sim("jgr-4","count"),1);
 console.log("OK: aviso nativo CircuitJS idéntico a Guardar como..., con Guardar/No guardar/Cancelar");

 // No guardar cierra sin descarga; los demás circuitos no se modifican.
 await switchTo("jgr-3");
 await (await focusCanvas("jgr-3")).press("Control+v");
 assert.equal(await sim("jgr-3","modified"),true);
 await closeTab("jgr-3");
 await page.frameLocator('iframe[data-tab-id="jgr-3"]').locator("#jgr-close-discard").click();
 await page.waitForFunction(()=>window.JGRTabsExperimental.list().length===2,null,{timeout:10000});
 assert.equal(await sim(origin,"count"),1);
 assert.equal(await sim("jgr-4","count"),1);
 console.log("OK: No guardar descarta únicamente la pestaña modificada");
 // El simulador principal usa el mismo formato predeterminado y conserva importaciones .txt.
 const main=await browser.newPage({locale:"es-ES",acceptDownloads:true});
 try{
  await main.addInitScript(()=>localStorage.setItem("labStartConfigured","1"));
  const mainURL=new URL("circuitjgr.html",ORIGIN).href;
  await main.goto(mainURL,{waitUntil:"domcontentloaded"});
  const nativeInput=main.locator("#LoadFileElement");
  await nativeInput.waitFor({state:"attached",timeout:90000});
  assert.equal(await nativeInput.getAttribute("accept"),".jgr,.txt,.circuitjs,.xml");
  await nativeInput.setInputFiles({
   name:"esquema-legado.txt",mimeType:"text/plain",buffer:Buffer.from(sample(390))
  });
  await main.waitForFunction(()=>window.CircuitJS1?.exportCircuit()?.includes('r="390"'),null,{timeout:30000});
  const nativeFileMenu=main.locator("td.gwt-MenuItem").first();
  await nativeFileMenu.click();
  const saveOption=nativeFileMenu.locator("li.menuItem").filter({hasText:/Guardar como|Save As/i}).first();
  await saveOption.click();
  const nativeSave=main.locator("dialog.circuitDialog").last();
  await nativeSave.waitFor({state:"visible",timeout:15000});
  assert.equal(await nativeSave.locator('input[type="text"]').inputValue(),"esquema-legado.jgr");
  await nativeSave.locator('input[type="text"]').fill("exportacion");
  const nativeDownload=main.waitForEvent("download");
  await nativeSave.getByRole("button",{name:/OK|Aceptar/i}).click();
  assert.equal((await nativeDownload).suggestedFilename(),"exportacion.jgr");
  console.log("OK: extensión .jgr por defecto en simulador principal, importación .txt y filtro prioritario");
 }finally{await main.close();}

 assert.deepEqual(errors,[],"Errores JS durante las pruebas de pestañas experimentales");
}finally{await browser.close();}
