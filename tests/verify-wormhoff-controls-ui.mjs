import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const gameSource=readFileSync(new URL('../wormhoff/index.html',import.meta.url),'utf8');
const algebraContext={names:['I₁','I₂','I₃'],escapeHtml:s=>String(s),formatNumber:n=>Number(n.toFixed(5)).toLocaleString('es-ES'),fmt:n=>(n<0?'−':'')+Number(Math.abs(n).toFixed(5)).toLocaleString('es-ES')};
vm.createContext(algebraContext);
vm.runInContext(gameSource.slice(gameSource.indexOf('  function algebraIsolation('),gameSource.indexOf('  function algebraStepsHTML('))+';globalThis.render=algebraTable;',algebraContext);
const isolationCases=[{label:'Resultado',row:[0,6,0],b:24},{label:'Sustitución',row:[0,4,0],b:6}];
const isolationMarkup=algebraContext.render(isolationCases);
assert(isolationMarkup.includes('I₂ = 4 A'));assert(isolationMarkup.includes('I₂ = 1,5 A'));
const browser=await chromium.launch({headless:true});
let animationReference=null;
try{
for(const [mobile,reducedMotion] of [[false,'no-preference'],[true,'no-preference'],[false,'reduce'],[true,'reduce']]){
 const context=await browser.newContext({viewport:mobile?{width:430,height:932}:{width:1440,height:1100},hasTouch:mobile,isMobile:mobile,reducedMotion});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/wormhoff/');
 const circuitCard=await page.locator('#circuitCard').boundingBox(),equationsCard=await page.locator('#equationsCard').boundingBox();
 if(mobile)assert(equationsCard.y>=circuitCard.y+circuitCard.height-1,'Ecuaciones debajo en móvil');
 else assert(equationsCard.x>=circuitCard.x+circuitCard.width-1,'Ecuaciones a la derecha en escritorio');
 for(const [button,matrix] of [['fillMatrix','matrixInputs'],['advFill','advMatInputs']]){
  assert(await page.locator('#'+button).evaluate((el,matrix)=>!el.closest('#boardActions')&&!!(document.getElementById(matrix).compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING),matrix),'Rellenar se mantiene bajo su matriz');
 }
 const checkAction=async id=>{
  await page.locator('#'+id).waitFor({state:'visible'});
  assert(await page.locator('#'+id).evaluate(el=>!!el.closest('#boardActions')),'Acción bajo el circuito: '+id);
  const diagram=await page.locator('#circuit').boundingBox(),actions=await page.locator('#boardActions').boundingBox();
  assert(actions.y>=diagram.y+diagram.height-1,'Acciones debajo del esquema');
  assert(Math.abs(actions.x+actions.width/2-diagram.x-diagram.width/2)<2,'Acciones centradas');
 };
 await page.evaluate(markup=>{const probe=document.createElement('div');probe.id='algebraProbe';probe.innerHTML=markup;document.body.append(probe)},isolationMarkup);
 const values=await page.locator('#algebraProbe .algebra-isolated-value:visible').allTextContents();
 assert.deepEqual(values,['I₂ = 4 A','I₂ = 1,5 A']);
 assert.equal(await page.locator('#algebraProbe .algebra-isolated-value:visible').first().evaluate(el=>getComputedStyle(el).color),'rgb(183, 247, 92)');
 await page.locator('#algebraProbe').evaluate(el=>el.remove());
 const tap=async(x,y)=>{
  await page.locator('#circuit').scrollIntoViewIfNeeded();
  const p=await page.locator('#circuit').evaluate((svg,[x,y])=>{const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y}},[x,y]);
  if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
 };
 const arrow=async s=>page.locator(s+' .direction').getAttribute('d');
 await page.selectOption('#exerciseSelect','c71');
 await page.locator('[data-reduce="2"]').fill('12');await page.click('#checkReductions');await page.click('#confirmDirs');
 await page.locator('[data-kcl="0"]').selectOption('1');
 const term=page.locator('#nodeChallenge .kcl-live-term').first();
 const blink=await term.evaluate(el=>{const s=getComputedStyle(el);return {name:s.animationName,duration:s.animationDuration,count:s.animationIterationCount}});
 assert.equal(blink.name,'kclTermBlink');assert.equal(blink.count,'3');
 await page.waitForFunction(()=>!document.querySelector('#nodeChallenge .blink-three'));
 assert.equal(await term.evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.selectOption('#exerciseSelect','base');
 assert.equal(await page.locator('#dirButtons,#advDirections,#loopButtons,#advLoopButtons,#cw,#ccw,#advCw,#advCcw').count(),0);
 for(const [i,x,y] of [[0,249,74],[1,345,103],[2,454,74]]){
  const sel='#currentArrow'+i,before=await arrow(sel);await tap(x,y);assert.notEqual(await arrow(sel),before,'Invertir corriente '+i);await tap(x,y);assert.equal(await arrow(sel),before);
 }
 await checkAction('confirmDirs');await page.click('#confirmDirs');await checkAction('goLoops');await page.click('#goLoops');await checkAction('advance');assert(await page.locator('#equationsCard #nodeEqPanel [data-equation="E1"]').isVisible());
 await tap(490,290);assert.equal(await page.locator('#loopHighlight').getAttribute('x'),'355');
 await tap(445,164);assert.match(await page.locator('#boardState').textContent(),/antihorario/);
 await tap(490,290);assert.match(await page.locator('#boardState').textContent(),/antihorario/,'Pulsar la malla activa conserva el progreso');
 await page.locator('[data-mesh-turn="1"]').focus();await page.locator('[data-mesh-turn="1"]').press('Space');
 assert.match(await page.locator('#boardState').textContent(),/horario/);assert.equal(await page.locator('#advance').isEnabled(),true,'Espacio cambia el giro sin iniciar el recorrido');
 await tap(210,290);assert.equal(await page.locator('#loopHighlight').getAttribute('x'),'156');
 await page.click('#advance');await tap(490,290);assert.equal(await page.locator('#loopHighlight').getAttribute('x'),'156','No cambiar malla durante el recorrido');
 await page.waitForFunction(()=>document.querySelector('#hero').classList.contains('hero-happy'));
 assert(await page.locator('#equationsCard #boardEquations [data-equation="E2"]').isVisible());
 const reaction=await page.evaluate(()=>{
  const style=sel=>{const s=getComputedStyle(document.querySelector(sel));return {name:s.animationName,duration:s.animationDuration,transition:s.transitionDuration}};
  return {face:style('.hero-face'),mouth:style('.hero-open-smile'),eyes:style('.hero-eyes'),term:style('.flash-term'),arrow:style('.flash-arrow')};
 });
 assert.equal(reaction.face.name,'heroJoy');assert.equal(reaction.mouth.name,'heroLaugh');assert.equal(reaction.term.name,'termBlink');assert.equal(reaction.arrow.name,'arrowBlink');
 const signature={blink,reaction};if(animationReference)assert.deepEqual(signature,animationReference,'Parpadeos y gestos idénticos en móvil/escritorio y movimiento reducido');else animationReference=signature;
 await page.selectOption('#exerciseSelect','r76');
 for(const [i,x,y] of [[0,174,74],[1,350,111],[2,395,74],[3,159,225],[4,379,225],[5,199,355]]){
  const sel='#sixCurrentArrow'+i,before=await arrow(sel);await tap(x,y);assert.notEqual(await arrow(sel),before,'Invertir corriente avanzada '+i);await tap(x,y);assert.equal(await arrow(sel),before);
 }
 await checkAction('advStart');await page.click('#advStart');
 let verifiedNodes=0;
 for(const eq of ['I1=I2+I3','I2+I4=I5','I1+I4+I6=0']){
  await page.locator('#sixNodeChallenge .kcl-answer').fill(eq);await page.click('#sixNodeChallenge .kcl-check');verifiedNodes++;assert.equal(await page.locator('#equationsCard #advKCL [data-equation]').count(),verifiedNodes);
 }
 await tap(460,290);assert.match(await page.locator('#advLap').textContent(),/Malla 3/);
 await tap(352,294);assert.match(await page.locator('#sixLoops [data-mesh-turn="2"]').textContent(),/↺/);
 await tap(460,290);assert.match(await page.locator('#sixLoops [data-mesh-turn="2"]').textContent(),/↺/);
 await tap(477,130);assert.match(await page.locator('#advLap').textContent(),/Malla 2/);assert.match(await page.locator('#sixLoops [data-mesh-turn="1"]').textContent(),/↺/);
 await checkAction('advNext');await page.click('#advNext');await tap(300,190);assert.match(await page.locator('#advLap').textContent(),/Malla 2/,'No cambiar malla avanzada durante el recorrido');
 await page.locator('#sixTermChallenge .term-answer').waitFor({state:'visible'});
 await page.locator('#sixTermChallenge .term-answer').fill('5I5');await page.click('#sixTermChallenge .term-check');
 await page.locator('#equationsCard #advBoardEquations [data-equation="E5"]').waitFor({state:'visible'});
 assert.match(await page.locator('#equationsCard #advBoardEquations [data-equation="E5"]').textContent(),/E5:/);
 assert.deepEqual(errors,[]);await context.close();console.log('OK: despejes resaltados, acciones centradas, controles, parpadeos y expresiones; '+(mobile?'móvil':'escritorio')+'; movimiento '+reducedMotion);
}
}finally{await browser.close()}
