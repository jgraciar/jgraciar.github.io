import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {labLanguageCodes} from '../scripts/LabTranslations.ts';
import {workspaceTranslations,workspaceLabel} from '../scripts/CircuitJGRTabsLabels.ts';
for(const language of labLanguageCodes){assert.equal(workspaceTranslations[language]?.split('|').length,18);assert(workspaceLabel('question',language).includes('{name}'));}
const browser=await chromium.launch({headless:true});
const base='http://127.0.0.1:8767/';
const fixture='<cir f="0" ts="0.00005"><r x="160 160 256 160" f="0" r="1234.5"/><x x="160 240 160 240" f="0" si="14" te="Text de l’usuari: Guarda els canvis"/></cir>';
const errors=[];
async function open(language){
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1500,height:950}});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(language=>{localStorage.setItem('labStartConfigured','1');localStorage.setItem('labLanguageMode','manual');localStorage.setItem('language',language);},language);
 await page.goto(base+'circuitjgr-core.html?lang='+language+'&whiteBackground=true&jgr-tabs-prototype=locale-test');
 await page.waitForFunction(()=>window.CircuitJS1?.getLanguage&&window.__CircuitJGRExperimentalApp?.menus.jgrSetupListText);
 assert.equal(await page.evaluate(()=>window.CircuitJS1.getLanguage()),language);
 return page;
}
const snapshot=page=>page.evaluate(()=>{
 const app=window.__CircuitJGRExperimentalApp;
 function text(el){const copy=el.cloneNode(true);copy.querySelectorAll('ul,.checkMark,.submenuArrow').forEach(n=>n.remove());return copy.textContent.replace(/\s+/g,' ').trim();}
 const roots=[app.menus.menuBar,app.menus.mainMenuBar,app.menus.elmMenuBar];
 return {
  top:[...app.menus.menuBar.querySelectorAll('td.gwt-MenuItem')].map(el=>[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim()),
  menus:roots.map(root=>[...root.querySelectorAll('li.menuItem')].map(text)),
  classes:app.ui.mainMenuItems.map((item,i)=>[app.ui.mainMenuItemNames[i],item.getLabel(),item.getShortcut()]),
  tooltip:[...app.ui.toolbar.element.querySelectorAll('[title]')].map(el=>el.title)
 };
});
// TextElm recomputes its bounding-box endpoint on the first canvas paint.
// Retain the actual text position/content and every electrical element attribute.
const circuitState=frame=>frame.evaluate(()=>window.CircuitJS1.exportCircuit().split('\n').slice(1).join('\n')
 .replace(/(<x\b[^>]*\bx=")(-?\d+) (-?\d+) -?\d+ -?\d+("[^>]*>)/g,'$1$2 $3 $2 $3$4'));
const state=async page=>({...await page.evaluate(()=>({time:window.CircuitJS1.getTime(),running:window.CircuitJS1.isRunning(),name:window.__CircuitJGRExperimentalApp.ui.titleLabel.textContent})),xml:await circuitState(page)});
function differences(actual,expected,path='',result=[]){
 if(actual===expected)return result;
 if(actual&&expected&&typeof actual==='object'&&typeof expected==='object'){
  for(const key of new Set([...Object.keys(actual),...Object.keys(expected)]))differences(actual[key],expected[key],path+'.'+key,result);
 }else result.push({path,actual,expected});
 return result;
}
try{
 const page=await open('ca-es-valencia');
 await page.evaluate(xml=>{window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit(xml,false);window.__CircuitJGRExperimentalApp.setCircuitTitle('Circuit de l’usuari');window.localeOriginalApi=window.CircuitJS1;},fixture);
 const before=await state(page);
 // Reproduce the user's exact Settings interaction first.
 await page.locator('.lab-start-settings').click();await page.locator('#lab-start-language').selectOption('es');await page.locator('#lab-start-accept').click();
 await page.locator('#lab-start-modal').waitFor({state:'hidden'});
 const languages=['es',...labLanguageCodes.filter(l=>l!=='es'),'ca-es-valencia','es'];
 for(const language of languages){
  await page.evaluate(language=>window.CircuitJS1.applyInitialSettings({language,whiteBackground:true,digits:4,decimal:',',grouping:'.'}),language);
  const fresh=await open(language);
  assert.deepEqual(differences(await snapshot(page),await snapshot(fresh)),[],'Live menus differ from fresh '+language);
  assert.deepEqual(await state(page),before,'Changing '+language+' must preserve circuit, time, pause and user title');
  assert(await page.evaluate(()=>window.CircuitJS1===window.localeOriginalApi),'engine identity');
  await page.evaluate(()=>window.__CircuitJGRExperimentalApp.commands.menuPerformed('edit','search'));
  await page.locator('.command-palette-filter').selectOption('examples');await page.locator('.command-palette-input').fill('CD4026');
  assert(await page.locator('.command-palette-item').count()>0,'Example search preserved in '+language);
  await page.keyboard.press('Escape');await fresh.close();
  console.log('OK live/fresh menus, context menus, names, shortcuts, toolbar and example search:',language);
 }
 await page.close();

 const tabs=await browser.newPage({locale:'es-ES',viewport:{width:1500,height:950}});tabs.on('pageerror',e=>errors.push(e.message));
 await tabs.addInitScript(()=>{localStorage.setItem('labStartConfigured','1');localStorage.setItem('labLanguageMode','manual');localStorage.setItem('language','ca-es-valencia');});
 await tabs.goto(base+'circuitjgr.html');
 await tabs.waitForFunction(()=>window.JGRTabsExperimental?.list().length===1&&window.JGRTabsExperimental.list().every(t=>t.ready),null,{timeout:90000});
 await tabs.evaluate(()=>window.JGRTabsExperimental.newBlank());
 await tabs.waitForFunction(()=>window.JGRTabsExperimental.list().length===2&&window.JGRTabsExperimental.list().every(t=>t.ready),null,{timeout:90000});
 const frames=tabs.frames().filter(f=>f.url().includes('circuitjgr-core.html'));
 for(const frame of frames)await frame.evaluate(xml=>{window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit(xml,false);window.localeTabApi=window.CircuitJS1;},fixture);
 const original=await Promise.all(frames.map(circuitState));
 const active=tabs.frameLocator('iframe[data-tab-id="jgr-2"]');
 await active.locator('.lab-start-settings').click();await tabs.locator('#lab-start-language').selectOption('es');await tabs.locator('#lab-start-accept').click();
 await tabs.waitForFunction(()=>[...document.querySelectorAll('iframe')].every(f=>f.contentWindow.CircuitJS1?.getLanguage()==='es'));
 for(const [i,frame]of frames.entries()){
  assert.equal(await frame.locator('#jgr-sidebar-toggle').textContent(),workspaceLabel('hide','es'));
  assert.equal(await frame.locator('#add-tab').getAttribute('title'),workspaceLabel('new','es'));
  assert.equal(await frame.locator('#duplicate-tab').getAttribute('title'),workspaceLabel('duplicate','es'));
  assert.equal(await frame.locator('#arrange-tabs').getAttribute('title'),workspaceLabel('arrange','es'));
  assert.equal(await circuitState(frame),original[i]);
  assert(await frame.evaluate(()=>window.CircuitJS1===window.localeTabApi&&!window.CircuitJS1.isRunning()));
 }
 await active.locator('.lab-start-settings').click();assert.equal(await tabs.locator('#lab-start-language').inputValue(),'es');
 assert.deepEqual(errors,[]);
 console.log('OK: all 22 live locales match fresh loads; Valencian→Spanish via Settings; two open tabs synchronize without reload or circuit changes');
}finally{await browser.close();}
