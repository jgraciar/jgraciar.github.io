import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

const server=spawn('python3',['-m','http.server','8765','--bind','127.0.0.1'],{stdio:'ignore'});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
  await new Promise(resolve=>setTimeout(resolve,800));
  await page.goto('http://127.0.0.1:8765/wormhoff/',{waitUntil:'domcontentloaded'});
  const selector=page.locator('#exerciseSelect');
  // Comparación visual: el tipo 5 conserva el mismo bastidor, escala y controles que el tipo 4.
  const visualSnapshot=()=>page.evaluate(()=>{
    const svg=document.querySelector('#circuit');
    const nodes=[...svg.querySelectorAll('.nod')].map(n=>[Number(n.getAttribute('cx')),Number(n.getAttribute('cy'))]);
    const wires=[...svg.querySelectorAll('#sixSymbols .wire')].map(n=>n.getAttribute('data-wire-branch'));
    const ids=['circuitCard','equationsCard','phaseCard','stagebar','boardActions'].filter(id=>document.getElementById(id));
    const rects=Object.fromEntries(ids.map(id=>{const el=document.getElementById(id);const r=el.getBoundingClientRect();return [id,[r.x,r.width].map(v=>Math.round(v))]}));
    return {viewBox:svg.getAttribute('viewBox'),nodes,wires,rects};
  });
  await selector.selectOption('r76');
  assert.equal(await page.locator('#boardTitle').textContent(),'Tipo 4','Type 4 failed to initialize: '+JSON.stringify(errors));
  const type4Visual=await visualSnapshot();
  await selector.selectOption('type5-3m5r3u');
  assert.equal(await page.locator('#boardTitle').textContent(),'Tipo 5','Type 5 failed to initialize: '+JSON.stringify(errors));
  const type5Visual=await visualSnapshot();
  assert.deepEqual(type5Visual,type4Visual,'Type 5 must preserve Type 4 circuit geometry, node positions and UI layout');
  await page.screenshot({path:'/tmp/wormhoff-type5-desktop.png',fullPage:true});
  await page.setViewportSize({width:390,height:844});
  const type5Mobile=await visualSnapshot();
  await selector.selectOption('r76');
  const type4Mobile=await visualSnapshot();
  assert.deepEqual(type5Mobile,type4Mobile,'Type 5 must preserve Type 4 layout on mobile');
  await page.setViewportSize({width:1280,height:900});
  await selector.selectOption('type5-3m5r3u');
  const titleAfterSelection=await page.locator('#boardTitle').textContent();
  assert.equal(titleAfterSelection,'Tipo 5','Type 5 selection must update title; actual title: '+JSON.stringify(titleAfterSelection)+'; page errors: '+JSON.stringify(errors));
  assert.equal(await page.locator('#stagebar').isVisible(),true,'Main phase navigation must be visible');
  const phaseState=await page.locator('#advancedPhase').evaluate(el=>({
    active:!el.classList.contains('hide'),
    ancestors:[el,...function*(n){while(n=n.parentElement)yield n}(el)].map(n=>({id:n.id,classes:n.className,display:getComputedStyle(n).display,visibility:getComputedStyle(n).visibility}))
  }));
  assert.equal(phaseState.active,true,'Type 5 must activate main advanced game: '+JSON.stringify({phaseState,errors}));
  const phaseGeometry=await page.locator('#advancedPhase').evaluate(el=>({rect:el.getBoundingClientRect().toJSON(),clientRects:el.getClientRects().length,children:[...el.children].slice(0,5).map(n=>({id:n.id,rect:n.getBoundingClientRect().toJSON(),display:getComputedStyle(n).display}))}));
  assert.equal(phaseState.active,true,'Type 5 phase must be activated: '+JSON.stringify({phaseState,phaseGeometry,errors}));
  assert.equal(await page.locator('#boardBadge').textContent().then(s=>s.includes('4 nudos')),true);
  assert.equal(await page.locator('#sixSymbols .component-resistor').count(),5);
  assert.equal(await page.locator('#sixSymbols .component-source').count(),3);
  assert.equal(await page.locator('#circuit .nod').count(),4);
  await page.locator('#randomizeValues').evaluate(el=>el.click());
  await page.locator('#solveDirect').evaluate(el=>el.click());
  await page.waitForFunction(()=>!document.querySelector('#advResultPanel').classList.contains('hide'),{timeout:10000});
  assert.equal(await page.locator('#advResults strong').count(),6,'Six branch currents required');
  assert.match(await page.locator('#advResultCheck').textContent(),/Verificado/);
  await selector.selectOption('r76');
  assert.equal(await page.locator('#boardTitle').textContent(),'Tipo 4');
  await selector.selectOption('type5-3m5r3u');
  assert.equal(await page.locator('#boardTitle').textContent(),'Tipo 5');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('#stagebar').isVisible(),true);
  assert.deepEqual(errors,[],'No uncaught browser errors');
  console.log('Type 5 main-game browser integration smoke test passed');
}finally{
  await browser.close();
  server.kill();
}
