import './verify-wormhoff-nodes-math.mjs';
import './verify-wormhoff-three-mesh-photo.mjs';
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
const meshElements={};
algebraContext.$=id=>meshElements[id]??={innerHTML:''};
algebraContext.S={phase:2,loops:[{cw:true},null],loop:0,cw:true,pass:'sources'};
algebraContext.A6={stage:'loops',done:[null,{cw:true},null],loop:1,cw:true,pass:'U'};
algebraContext.drawSelectedMesh=()=>{};algebraContext.drawMeshTargets=()=>{};algebraContext.bindMeshTurns=()=>{};algebraContext.meshTurnIcon=()=>'';
vm.runInContext(
 gameSource.slice(gameSource.indexOf('  function meshCompleteMark('),gameSource.indexOf('  function setTransportState('))+
 gameSource.slice(gameSource.indexOf('  function updateLoopsArrows('),gameSource.indexOf('  const fmt='))+
 gameSource.slice(gameSource.indexOf('  function sixMeshArrows('),gameSource.indexOf('  function sixText('))+
 ';updateLoopsArrows();sixMeshArrows();',algebraContext);
const completedMarkup=meshElements.loopArrows.innerHTML+meshElements.sixLoops.innerHTML;
assert(completedMarkup.includes('data-mesh-complete="0"'));assert(completedMarkup.includes('data-mesh-complete="1"'));
assert(completedMarkup.includes('--paint-8df09c,#8df09c'));assert(!/FINALIZADA|HECHA/.test(completedMarkup));
assert(isolationMarkup.includes('I₂ = 4 A'));assert(isolationMarkup.includes('I₂ = 1,5 A'));
const simplifyContext={normalizeCurrentToken:s=>String(s).replace(/[₀₁₂₃₄₅₆₇₈₉]/g,d=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d))).toLowerCase()};
vm.createContext(simplifyContext);
vm.runInContext(gameSource.slice(gameSource.indexOf('  function simplifiedEquationVector('),gameSource.indexOf('  function openSimplification(')),simplifyContext);
for(const eq of ['2I7-3I12=12','I7-1,5I12=6','-2I7+3I12=-12'])assert(simplifyContext.isSimplifiedEquation(eq,[2,-3,0],12,['I₇','I₁₂','I₃']),eq);
for(const eq of ['I7+I7-3I12=12','2I7-3I12=18-6','2I7+3I12=12','0I7+0I12=0'])assert(!simplifyContext.isSimplifiedEquation(eq,[2,-3,0],12,['I₇','I₁₂','I₃']),eq);
const completeSimplification=async page=>{
 assert(await page.locator('#simplificationPhase').isVisible(),'Paso de simplificación entre mallas y matriz');
 assert.equal(await page.locator('#continueSimplification').isVisible(),false,'La matriz espera a comprobar la simplificación');
 await page.click('#checkSimplification');assert.equal(await page.locator('#continueSimplification').count(),0);
 assert.equal(await page.locator('#simplificationPhase').isVisible(),false);
 assert(await page.locator('#solveAfterSimplification').isVisible());
 assert.equal(await page.locator('#resolveMatrixChoice').isVisible(),false);
 await page.click('#solveAfterSimplification');
 assert(await page.locator('#resolveAlgebraChoice').isVisible());assert(await page.locator('#resolveMatrixChoice').isVisible());
 await page.click('#resolveMatrixChoice');
};
const enterNodeEquation=async(page,id,equation)=>{
 assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);
 await page.locator('#nodeTargets [data-node="'+id+'"]').click();
 if(!await page.locator('#nodeEquationDialog').isVisible()){assert.match(await page.locator('#boardNodeSelectionCounter').textContent(),/1 de 1/);await page.locator('#startNodeEquations:visible,#advStartNodeEquations:visible').click();}
 assert(await page.locator('#nodeEquationDialog').isVisible(),'Ventana del nudo '+id);
 assert.match(await page.locator('#nodeEquationTitle').textContent(),new RegExp('Nudo '+id));
 assert.deepEqual(await page.locator('#nodeTargets [data-node-blinking="true"]').evaluateAll(nodes=>nodes.map(el=>el.dataset.node)),[id],'Solo parpadea el nudo cuya ecuación se pide');
 assert.equal(await page.locator('#nodeTargets [data-node="'+id+'"] circle').evaluate(el=>getComputedStyle(el).animationName),'nodeRingBlink');
 if(await page.locator('#nodeEquationChallenge .kcl-drag-token').count()){
  const [left='',right='']=equation.replace(/\\s/g,'').split('=');
  const tokens=page.locator('#nodeEquationChallenge .kcl-drag-token');
  for(let i=0;i<await tokens.count();i++){
   const label=await tokens.nth(i).textContent();
   const plain=v=>v.replace(/[₀₁₂₃₄₅₆₇₈₉]/g,d=>String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d))).toUpperCase();
   const side=[left,right].findIndex(part=>plain(part).includes(plain(label)));
   if(side>=0){await tokens.nth(i).click();await page.locator('#nodeEquationChallenge .kcl-drop-side').nth(side).click();}
  }
 }else await page.locator('#nodeEquationChallenge .kcl-answer').fill(equation);
 await page.locator('#nodeEquationDialog [data-context-help="nodeEquation"]').focus();await page.keyboard.press('Enter');assert(await page.locator('#phaseHelpDialog').isVisible());assert.match(await page.locator('#phaseHelpBody').textContent(),/Σ I que entran/);
 await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});assert(await page.locator('#nodeEquationDialog').isVisible());if(await page.locator('#nodeEquationChallenge .kcl-answer').count())assert.equal(await page.locator('#nodeEquationChallenge .kcl-answer').inputValue(),equation,'La ayuda conserva la ecuación escrita');else assert(await page.locator('#nodeEquationChallenge .kcl-live-term').count()>0,'La ayuda conserva las intensidades colocadas');
 assert.equal(await page.locator('#nodeEquationSummary').isVisible(),false,'Explicaciones del diálogo solo en ayuda');
 await page.click('#nodeEquationChallenge .kcl-check');
 assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false,'Ecuación validada en '+id);
};
const assertStageChecks=async(page,indices)=>{
 const actual=await page.locator('#stagebar .phase-complete:visible').evaluateAll(nodes=>nodes.map(el=>Number(el.closest('[data-stage]').dataset.stage)));
 assert.deepEqual(actual,indices,'Checks verdes solo en fases superadas');
 assert.equal(await page.locator('#stagebar [data-reset-phase]').count(),0,'Los títulos no incluyen reinicio');
 const reset=page.locator('#activePhaseReset');assert(await reset.isVisible(),'Reinicio dentro de la fase activa');
 const current=Number(await page.locator('#stagebar [aria-current="step"]').getAttribute('data-phase'));assert.equal(await reset.getAttribute('data-reset-phase'),String(current));
 const activeBackground=await page.locator('#stagebar .stage.active').evaluate(el=>({color:getComputedStyle(el).backgroundColor,theme:document.documentElement.dataset.theme}));
 assert.equal(activeBackground.color,activeBackground.theme==='light'?'rgb(216, 240, 244)':'rgb(255, 224, 102)','La fase activa respeta el color de su tema');
};
const browser=await chromium.launch({headless:true});
let animationReference=null,meshShadeReference=null;
try{
const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.stack)});
await page.addInitScript(()=>{
 const now=performance.now.bind(performance),raf=window.requestAnimationFrame.bind(window);
 performance.now=()=>now()*80;window.requestAnimationFrame=callback=>raf(time=>callback(time*80));
});
await page.goto('http://127.0.0.1:8767/wormhoff/');
await page.locator('[data-current-branch="0"]').dispatchEvent('click');
assert.equal(await page.locator('#currentArrow0 .dirlabel').textContent(),'I₁','Numeración automática en demo');
assert.equal(await page.locator('#currentNameDialog').isVisible(),false,'Sin diálogo en demo');
await page.click('#toggleDemo');
assert.equal(await page.locator('#toggleDemo').getAttribute('aria-pressed'),'false','Modo jugable activado para pruebas manuales');
for(const [i,x] of [146,345,544].entries()){
 await page.locator(`[data-current-branch="${i}"]`).dispatchEvent('click');
 await page.locator('#currentNumber').fill(String(i+1));await page.click('#currentNameForm button[type="submit"]');
}
// La prueba del recorrido de mallas usa el modo demo, que no exige retos jugables.
await page.click('#toggleDemo');
assert.equal(await page.locator('#toggleDemo').getAttribute('aria-pressed'),'true');
for(let i=0;i<3;i++)await page.locator(`[data-current-branch="${i}"]`).dispatchEvent('click');
await page.click('#confirmDirs');assert.equal(await page.locator('#hero').isVisible(),false);assert.equal(await page.locator('#goLoops').isVisible(),false);assert.match(await page.locator('#nodeEquationCount').textContent(),/2 − 1 = 1/);await enterNodeEquation(page,'B','I1=I2+I3');assert.equal(await page.locator('#selectedNodeLabel').textContent(),'Nudo B');await assertStageChecks(page,[0]);await page.click('#goLoops');assert(await page.locator('#hero').isVisible());await page.click('#confirmMeshDirections');
for(let mesh=0;mesh<2;mesh++){
 await page.locator(`#meshTargets [data-mesh="${mesh}"]`).dispatchEvent('click');
 for(let turn=0;turn<250;turn++){
  if(await page.locator('#advance').getAttribute('data-state')==='complete')break;
  const state=await page.locator('#advance').getAttribute('data-state');
  if(['ready','waiting'].includes(state))await page.click('#advance');
  await page.waitForTimeout(35);
 }
 assert.equal(await page.locator('#advance').getAttribute('data-state'),'complete','Malla terminada');
}
await assertStageChecks(page,[0]);
assert(await page.locator('[data-mesh-summary]').evaluateAll(groups=>groups.every(group=>group.querySelector('[data-mesh-complete]').getBoundingClientRect().bottom<group.querySelector('.mesh-turn-hit').getBoundingClientRect().top)),'Check encima del símbolo de giro');
await page.click('#goMatrix');await completeSimplification(page);
assert.equal(await page.locator('#phase3>.desc').count(),0);await page.click('#phaseSectionHelp');assert(await page.locator('#phaseHelpDialog').isVisible());assert.equal(await page.locator('#phaseHelpBody li').count(),5);assert.match(await page.locator('#phaseHelpBody').textContent(),/coeficientes|coeficiente/);await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});
await page.click('#fillMatrix');await assertStageChecks(page,[0,2]);await page.click('#verifyMatrix');await assertStageChecks(page,[0,2]);
const testedCoefficient=page.locator('#matrixInputs input').first(),correctCoefficient=await testedCoefficient.inputValue();await testedCoefficient.fill('999');await assertStageChecks(page,[0,2]);assert.equal(await page.locator('#resolveAlgebraChoice').isVisible(),true,'La matriz es opcional y no bloquea la resolución');await testedCoefficient.fill(correctCoefficient);await page.click('#verifyMatrix');await assertStageChecks(page,[0,2]);await page.click('#resolveAlgebraChoice');
await page.click('#nextStep');
assert.equal(await page.locator('#phase4>.desc,#solutionSteps .step-description').count(),0);await page.click('#phaseSectionHelp');assert.equal(await page.locator('#phaseHelpBody li').count(),5);await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});
await page.locator('#solutionSteps [data-step-help]').first().click();assert.match(await page.locator('#phaseHelpBody').textContent(),/Partimos de/);await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});
await page.locator('#currentArrow1').focus();await page.locator('#currentArrow1').press('F2');
assert.equal(await page.locator('#currentNumber').inputValue(),'2');await page.locator('#currentNumber').fill('22');await page.click('#currentNameForm button[type="submit"]');
assert.match(await page.locator('#matrixVariableOrder').textContent(),/I₂₂/);assert(!/I₂(?!₂)/.test(await page.locator('#solutionSteps').textContent()),'Resolución con la referencia nueva');
await page.click('#nextStep');assert.match(await page.locator('#solutionSteps').textContent(),/I₂₂/,'Los siguientes pasos conservan el número nuevo');

while(!await page.locator('#nextStep').isDisabled())await page.click('#nextStep');
assert(await page.locator('#resultPanel').isVisible());assert(await page.locator('#hero').evaluate(el=>el.classList.contains('hero-victory')),'Gafas y brazos cruzados al completar');assert.equal(await page.locator('#hero .hero-victory-pose').first().evaluate(el=>getComputedStyle(el).display),'block');await assertStageChecks(page,[0,2,4]);
const before={result:await page.locator('#results strong').allTextContents(),matrix:await page.locator('#matrixInputs input').evaluateAll(els=>els.map(el=>({col:Number(el.dataset.col),value:Number(el.value.replace('−','-').replace(',','.'))}))),working:await page.locator('#solutionSteps').textContent(),score:await page.locator('#score').textContent()};
await page.locator('#currentArrow0').focus();await page.locator('#currentArrow0').press('Enter');
const numeric=s=>Number(s.replace('−','-').replace(',','.').replace(' A',''));
const after=await page.locator('#results strong').allTextContents();
assert.deepEqual(after.map(numeric),before.result.map((v,i)=>i===0?-numeric(v):numeric(v)),'Solo cambia de signo la referencia invertida');
assert.notEqual(await page.locator('#solutionSteps').textContent(),before.working,'Recalcula todos los pasos algebraicos');
assert.deepEqual(await page.locator('#matrixInputs input').evaluateAll(els=>els.map(el=>Number(el.value.replace('−','-').replace(',','.')))),before.matrix.map(cell=>cell.col===0?(-cell.value||0):cell.value),'Invierte la columna correspondiente de la matriz');
assert.equal(await page.locator('#resultPanel .message.good').count(),1,'El nuevo sistema sigue verificado');assert.equal(await page.locator('#score').textContent(),before.score,'No duplica puntos');
await page.locator('#currentArrow0').press('Enter');assert.deepEqual(await page.locator('#results strong').allTextContents(),before.result,'Reversible');
await page.click('[data-reset-phase="4"]');await assertStageChecks(page,[0,2]);
assert.equal(await page.locator('#resultPanel').isVisible(),false);assert.equal(await page.locator('#hero').evaluate(el=>el.classList.contains('hero-victory')),false,'Reiniciar retira la pose final');
await page.click('[data-phase="2"]');
assert(await page.locator('#matrixInputs input').evaluateAll(nodes=>nodes.every(el=>el.value!=='')),'Volver a matriz conserva sus valores');
assert.equal(await page.locator('#equationsCard [data-equation]:visible').count(),3,'Conserva las ecuaciones previas');
await page.click('[data-phase="2"]');assert.equal(await page.locator('#loopArrows [data-mesh-complete]').count(),2);
await page.click('[data-reset-phase="2"]');await assertStageChecks(page,[0]);assert.equal(await page.locator('#loopArrows [data-mesh-complete]').count(),0);
await page.click('#confirmMeshDirections');await page.click('#advance');await page.waitForFunction(()=>document.getElementById('advance').dataset.state==='running');
await page.click('[data-phase="0"]');const position=await page.locator('#hero').getAttribute('transform');await page.waitForTimeout(100);
assert.equal(await page.locator('#hero').getAttribute('transform'),position,'Retroceder cancela la animación');
assert.equal(await page.locator('#dirGraphics .dirlabel').count(),3);
await page.click('#confirmDirs');assert.equal(await page.locator('[data-phase="0"]').getAttribute('aria-current'),'step');
assert(await page.locator('#phase0,#phase1').evaluateAll(nodes=>nodes.every(el=>!el.classList.contains('hide'))),'Corrientes y nudos comparten fase');assert(await page.locator('#editCurrentReferences').isVisible());assert.equal(await page.locator('#nodeTargets [data-node]').count(),2);
await page.click('[data-reset-phase="0"]');await assertStageChecks(page,[]);assert.equal(await page.locator('#dirGraphics .dirlabel').count(),0);

await page.route('**/wormhoff/',async route=>{
 const response=await route.fetch(),html=await response.text();
 await route.fulfill({response,body:html.replace('  newGame();syncBoardActions();','  globalThis.wormhoffTest={A6,S,sixStartSolve,sixRefArrow,sixRenderRows,sixKCLRows,NAMES6,openSimplification,sixEq};\n  newGame();syncBoardActions();')});
});
await page.reload();await page.selectOption('#exerciseSelect','r76');
// El tipo 4 debe admitir flechas en los tramos R2–C y R5–D.
for(const [branch,x,y] of [[1,350,190],[4,548,225]]){
 const target=page.locator('[data-current-branch="'+branch+'"]');
 await target.evaluate((el,{x,y})=>{
  const svg=document.getElementById('circuit'),p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());
  el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:p.x,clientY:p.y}));
 },{x,y});
 const arrow=page.locator('#sixCurrentArrow'+branch);
 assert.equal(await arrow.getAttribute('data-current-index'),String(branch),'Se crea la referencia de corriente '+branch);
 assert.notEqual(await arrow.getAttribute('data-placement-unavailable'),'true','Flecha disponible entre resistencia y nudo');
 assert.equal(await arrow.isVisible(),true,'Flecha visible en el tramo solicitado');
 const point=await arrow.evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
 if(branch===1)assert(point.x>=338&&point.x<=362&&point.y>166&&point.y<225,'Flecha entre R2 y C');
 else assert(point.x>535&&point.x<570&&point.y>=212&&point.y<=238,'Flecha entre R5 y D');
}
await page.reload();await page.selectOption('#exerciseSelect','r76');
await page.evaluate(()=>{
 const {A6,S,sixStartSolve,sixRefArrow,sixRenderRows,sixKCLRows,NAMES6}=wormhoffTest;
 A6.currentNumbers=[1,2,3,4,5,6];NAMES6.splice(0,6,'I₁','I₂','I₃','I₄','I₅','I₆');A6.signs=[1,1,1,1,1,1];
 // Canonical CW rows from the original six branches, R=[4,3,2,2,5,3].
 const rows=[[4,3,0,-2,0,0],[0,-3,2,0,-5,0],[0,0,0,2,5,-3]],b=[16,-16,8];
 A6.done=rows.map((row,i)=>({row,b:b[i],cw:true}));A6.rowsR=rows.map(row=>row.flatMap((v,i)=>v?[{i,v}]:[]));A6.rowsU=b.map(v=>[{i:0,v}]);A6.nodeCount=3;A6.nodeIds=['D','B','C'];
 document.getElementById('advKCLtext').innerHTML=sixKCLRows();sixRenderRows();sixRefArrow();sixStartSolve();
 A6.step=A6.steps.length;A6.finalVerified=true;A6.completedScore=true;
});
// Complete verification using the existing renderer without awarding more points.
await page.evaluate(()=>{wormhoffTest.sixStartSolve(true);});
assert(await page.locator('#advResultPanel').isVisible());assert(await page.locator('#hero').evaluate(el=>el.classList.contains('hero-victory')),'Pose final también con seis ramas');
await page.click('#phaseSectionHelp');assert.equal(await page.locator('#phaseHelpBody li').count(),5);assert((await page.locator('#phaseHelpBody .help-step').count())>3);await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});
 await page.evaluate(()=>{const {A6,openSimplification}=wormhoffTest;A6.stage='loops';A6.simplified=false;A6.completedScore=false;openSimplification(true);});
 assert.equal(await page.locator('.simplification-answer').count(),0,'No se piden ecuaciones que ya están simplificadas');
 assert.equal(await page.locator('#continueSimplification').count(),0,'El botón anterior está retirado');
 await page.locator('#solveAfterSimplification').evaluate(button=>button.click());
 assert(await page.locator('#resolveMatrixChoice').isVisible());
 await page.locator('#resolveMatrixChoice').evaluate(button=>button.click());
await page.evaluate(()=>{const {A6,sixStartSolve}=wormhoffTest;sixStartSolve();A6.step=A6.steps.length;A6.finalVerified=true;A6.completedScore=true;sixStartSolve(true);});
const sixBefore=await page.locator('#advResults strong').allTextContents();
for(let i=0;i<6;i++){
 const working=await page.locator('#advSolveSteps').textContent();
 await page.locator('#sixCurrentArrow'+i).focus();await page.locator('#sixCurrentArrow'+i).press('Enter');
 const results=await page.locator('#advResults strong').allTextContents();
 assert.deepEqual(results.map(numeric),sixBefore.map((v,j)=>i===j?-numeric(v):numeric(v)),'Referencia avanzada '+i);
 assert.notEqual(await page.locator('#advSolveSteps').textContent(),working);
 assert.equal(await page.locator('#advResultCheck').getAttribute('class'),'message good');
 if(!await page.locator('#sixCurrentArrow'+i).isVisible())console.log('PLACEMENT DIAGNOSTIC',JSON.stringify(await page.locator('#circuit').evaluate(svg=>{
  const inverse=svg.getScreenCTM().inverse(),box=el=>{const r=el.getBoundingClientRect(),a=new DOMPoint(r.left,r.top).matrixTransform(inverse),b=new DOMPoint(r.right,r.bottom).matrixTransform(inverse);return {x:a.x,y:a.y,w:b.x-a.x,h:b.y-a.y};};
  return [...svg.querySelectorAll('#staticCircuit .symbol,#staticCircuit .source-halo,#staticCircuit .component-value,#staticCircuit .resistor-name,#staticCircuit .txt,#staticCircuit .txtsm,#staticCircuit .nod,#loopArrows .mesh-label,#loopArrows .mesh-complete,#sixRefArrows .dirlabel,#sixRefArrows .dir-result,#sixRefArrows .direction')].filter(el=>el.getClientRects().length).map(el=>({text:el.textContent,cls:el.getAttribute('class'),box:box(el)}));
 })));
 assert(await page.locator('#sixCurrentArrow'+i).isVisible(),'Referencia visible después de cambiar el signo: '+i);await page.locator('#sixCurrentArrow'+i).press('Enter');assert.deepEqual(await page.locator('#advResults strong').allTextContents(),sixBefore);
}
assert.deepEqual(errors,[]);await context.close();console.log('OK: retroceso y reinicio en las cuatro fases, matriz y cancelación del recorrido');
for(const [mobile,reducedMotion] of [[false,'no-preference'],[true,'no-preference'],[false,'reduce'],[true,'reduce']]){
 const context=await browser.newContext({viewport:mobile?{width:430,height:932}:{width:1440,height:1100},hasTouch:mobile,isMobile:mobile,reducedMotion});
 const page=await context.newPage(),errors=[];page.on('console',m=>{if(m.type()==='warning')console.log(m.text())});page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.stack)});
 await page.goto('http://127.0.0.1:8767/wormhoff/');
 const selectSymbol=async value=>{await page.click('#openSettings');await page.selectOption('#symbolStandard',value);await page.keyboard.press('Escape');await page.locator('#settingsDialog').waitFor({state:'hidden'});};
 assert.equal(await page.locator('#themeSetting').inputValue(),'system','Tema del sistema por defecto');
 await page.emulateMedia({colorScheme:'light'});
 await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');
 assert.equal(await page.locator('html').getAttribute('data-theme'),'light','El tema inicial sigue el sistema en modo claro');
 await assertStageChecks(page,[]);
 const phaseRects=await page.locator('#stagebar .stage:visible').evaluateAll(nodes=>nodes.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};}));
 assert.equal(phaseRects.length,3,'Tres fases visibles: corrientes y nudos, mallas y resolución');
 assert(phaseRects.every(r=>r.w>0&&r.h>0),'Todas las fases visibles tienen dimensiones');
 assert(phaseRects.every((r,i)=>i===0||r.y>phaseRects[i-1].y-1||(Math.abs(r.y-phaseRects[i-1].y)<1&&r.x>phaseRects[i-1].x)),'Fases ordenadas en filas, sin exigir una sola fila horizontal');

 assert.equal(await page.locator('#exerciseStatus,#exerciseHint,#difficultyInfo,.top .sub,.exercisebar').count(),0,'Cabecera sin estado, observaciones ni subtítulo');
 assert(await page.locator('#exerciseSelect').evaluate(el=>!!el.closest('.brand-exercise')),'Selector junto al nombre');
 const headerBoxes=await page.locator('.brand-exercise').evaluate(el=>{const a=el.querySelector('.logo').getBoundingClientRect(),b=el.querySelector('#exerciseSelect').getBoundingClientRect();return {beside:b.left>=a.right,sameRow:Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2)<3}});assert(mobile?(headerBoxes.beside||!headerBoxes.sameRow):(headerBoxes.beside&&headerBoxes.sameRow),'Selector de topologías junto al título en escritorio y visible en disposición adaptable en móvil');
 assert.equal(await page.locator('#symbolStandard').isVisible(),false,'Simbología dentro de configuración');
 await page.click('#openSettings');assert(await page.locator('#settingsDialog').isVisible());
 await page.selectOption('#themeSetting','light');
 const contrast=await page.evaluate(()=>{
  const rgb=s=>s.match(/[\d.]+/g).slice(0,3).map(Number),lum=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  const ratio=(a,b)=>{const x=lum(rgb(a)),y=lum(rgb(b));return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const style=sel=>getComputedStyle(document.querySelector(sel));
  return {text:ratio(style('body').color,style('.card').backgroundColor),wire:ratio(style('.wire').stroke,style('.board').backgroundColor),worm:ratio(style('.hero-eye').fill,style('#heroBody').fill),edge:ratio(style('#heroBody').stroke,style('.board').backgroundColor)};
 });
 assert(Object.values(contrast).every(r=>r>=7),'Contraste alto en textos, circuito y muñeco: '+JSON.stringify(contrast));
 await page.selectOption('#themeSetting','system');await page.emulateMedia({colorScheme:'light'});assert.equal(await page.locator('html').getAttribute('data-theme'),'light');
 await page.emulateMedia({colorScheme:'dark'});await page.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
 await page.selectOption('#themeSetting','dark');
 await page.locator('#speedSetting').evaluate(el=>{el.value='75';el.dispatchEvent(new Event('input',{bubbles:true}))});assert.equal(await page.locator('#speedValue').textContent(),'75%');
 await page.selectOption('#languageSetting','en');assert.equal(await page.locator('#settingsTitle').textContent(),'Settings');assert.equal(await page.locator('[data-phase="0"] span').textContent(),'Currents and nodes');
 await page.selectOption('#languageSetting','es');assert.equal(await page.locator('#settingsTitle').textContent(),'Configuración');
 await page.keyboard.press('Escape');await page.locator('#settingsDialog').waitFor({state:'hidden'});await page.reload();
 assert.equal(await page.locator('#speedSetting').inputValue(),'75','Conserva la configuración');
 await page.click('#openSettings');await page.locator('#speedSetting').evaluate(el=>{el.value='100';el.dispatchEvent(new Event('input',{bubbles:true}))});await page.keyboard.press('Escape');await page.locator('#settingsDialog').waitFor({state:'hidden'});

 assert.equal(await page.locator('#hero').isVisible(),false,'Gusano oculto al numerar intensidades');
 assert.equal(await page.locator('#gameLayout .law-guide,#gameLayout .desc,#gameLayout .helper,#gameLayout .notes').count(),0,'Texto explicativo fuera de la vista general');
 assert.equal(await page.locator('#boardState').isVisible(),false);
 await page.click('#equationsCard [data-context-help="laws"]');assert(await page.locator('#phaseHelpDialog').isVisible());assert.match(await page.locator('#phaseHelpBody').textContent(),/Ley de los nudos/);assert.match(await page.locator('#phaseHelpBody').textContent(),/Ley de las mallas/);assert((await page.locator('#phaseHelpBody .law-formula').count())>=3);await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});
 await page.click('#phaseSectionHelp');assert.match(await page.locator('#phaseHelpBody').textContent(),/numerar|numera/);await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});
 assert.equal(await page.locator('#currentNumber').getAttribute('maxlength'),'2');
 assert.equal(await page.locator('#currentNameDialog h3,#currentBranchDescription,#currentNumberError').count(),0,'Conserva el diálogo compacto con I');
 if(!mobile){await page.setViewportSize({width:1920,height:1100});assert((await page.locator('.shell').boundingBox()).width>1900,'Utiliza todo el ancho disponible');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.setViewportSize({width:1440,height:1100});}
 if(mobile){
  const sizes=await page.evaluate(()=>Object.fromEntries(['body','#exerciseSelect','#boardTitle','#stagebar .stage','#phaseHead'].map(selector=>[selector,parseFloat(getComputedStyle(document.querySelector(selector)).fontSize)])));
  assert(sizes.body>=17&&sizes['#exerciseSelect']>=16&&sizes['#boardTitle']>=17&&sizes['#stagebar .stage']>=15&&sizes['#phaseHead']>=17,'Texto móvil más legible: '+JSON.stringify(sizes));
  assert.equal(await page.locator('#circuit .component-value').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),16,'El texto del circuito conserva su tamaño');
 }
 const textControls=page.locator('#circuitCard [data-text-controls="circuit"]'),equationControls=page.locator('#equationsCard [data-text-controls="equations"]');
 const sourceText=page.locator('#circuit .component-value').first(),equationText=page.locator('#equationsCard .cardhead strong').first();
 const circuitBaseWidth=(await page.locator('#circuit').boundingBox()).width,headerFont=await page.locator('#boardTitle').evaluate(el=>getComputedStyle(el).fontSize);
 const originalSizes=await Promise.all([sourceText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),equationText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))]);
 await textControls.locator('[data-text-change="1"]').click();
 assert.equal(await sourceText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),originalSizes[0],'Conserva el tamaño nativo del texto SVG');
 assert((await page.locator('#circuit').boundingBox()).width>circuitBaseWidth*1.08,'Amplía el circuito completo');
 assert.equal(await page.locator('#boardTitle').evaluate(el=>getComputedStyle(el).fontSize),headerFont,'No amplía los rótulos del panel');
 assert(await page.locator('.board').evaluate(el=>el.scrollWidth>el.clientWidth),'Permite desplazar el circuito ampliado dentro de su panel');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'El zoom no desborda la página');
 assert.equal(await equationText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),originalSizes[1],'Escalas independientes');
 await textControls.locator('[data-text-change="-1"]').click();
 await equationControls.locator('[data-text-change="1"]').click();
 assert((await equationText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)))>originalSizes[1]+1,'Amplía texto de la columna derecha');
 await equationControls.locator('[data-text-change="-1"]').click();
 const circuitCard=await page.locator('#circuitCard').boundingBox(),equationsCard=await page.locator('#equationsCard').boundingBox();
 if(mobile){
  assert(await page.locator('#equationsCard').evaluate(el=>el.previousElementSibling?.id==='boardActions'),'Ecuaciones situadas después de los controles del circuito en móvil');
  assert(await page.locator('#equationsCard').evaluate(el=>el.parentElement.id==='circuitCard'));
 }
 else assert(equationsCard.x>=circuitCard.x+circuitCard.width-1,'Ecuaciones a la derecha en escritorio');
 const svgWidth=await page.locator('#circuit').boundingBox();
 const circuitInterior=await page.locator('#circuitCard').evaluate(el=>el.clientWidth);assert(Math.abs(svgWidth.width-circuitInterior)<=3,'El circuito ocupa el ancho interior disponible, descontando la barra de desplazamiento');
 const divider=page.locator('#columnDivider');
 if(mobile)assert.equal(await divider.isVisible(),false);
 else{
  const beforeLeft=circuitCard.width,beforeRight=equationsCard.width,d=await divider.boundingBox(),dragY=Math.max(10,Math.min(100,d.height/2));
  await page.mouse.move(d.x+d.width/2,d.y+dragY);await page.mouse.down();await page.mouse.move(d.x+d.width/2+160,d.y+dragY,{steps:6});await page.mouse.up();
  const larger=await page.locator('#circuitCard').boundingBox(),smaller=await page.locator('#equationsCard').boundingBox();
  assert(larger.width>beforeLeft+100,'Arrastrar ensancha el circuito');assert(smaller.width<beforeRight-100,'Arrastrar estrecha las ecuaciones');
  assert.equal(await page.locator('body').evaluate(el=>el.classList.contains('is-resizing')),false);
  assert(Number(await page.evaluate(()=>localStorage.getItem('wormhoff-column-ratio')))>0);
  await divider.focus();await divider.press('End');
  await page.evaluate(markup=>{const p=document.createElement('div');p.id='columnProbe';p.innerHTML=markup;document.querySelector('#phaseCard .body').append(p)},isolationMarkup);
  assert.equal(await page.locator('#columnProbe .algebra-desktop').isVisible(),false,'La tabla se adapta al ancho de la columna');
  assert.equal(await page.locator('#columnProbe .algebra-mobile').isVisible(),true);
  assert(await page.locator('#phaseCard').evaluate(el=>el.scrollWidth<=el.clientWidth+1),'Sin desbordamiento lateral');
  await page.locator('#columnProbe').evaluate(el=>el.remove());
  await divider.press('Home');const minimum=await page.locator('#circuitCard').boundingBox();assert(minimum.width>=279);
  await divider.press('ArrowRight');assert((await page.locator('#circuitCard').boundingBox()).width>minimum.width+5);
  await divider.dblclick();assert(Math.abs((await page.locator('#circuitCard').boundingBox()).width-beforeLeft)<3,'Doble clic restablece el reparto');
 }
 for(const [button,matrix] of [['fillMatrix','matrixInputs'],['advFill','advMatInputs']]){
  assert(await page.locator('#'+button).evaluate((el,matrix)=>!el.closest('#boardActions')&&!!(document.getElementById(matrix).compareDocumentPosition(el)&Node.DOCUMENT_POSITION_FOLLOWING),matrix),'Rellenar se mantiene bajo su matriz');
 }
 const checkAction=async id=>{
  await page.locator('#'+id).waitFor({state:'visible'});
  const transport=['resetLoop','advance','advNext'].includes(id),container=transport?'circuitTransport':'boardActions';
  assert(await page.locator('#'+id).evaluate((el,parent)=>!!el.closest('#'+parent),container),'Acción en su barra: '+id);
  const diagram=await page.locator('#circuit').boundingBox(),actions=await page.locator('#'+container).boundingBox();
  if(transport)assert(Math.abs(actions.y-diagram.y-diagram.height)<3,'Reproducción inmediatamente debajo del circuito');
  else assert(await page.locator('#'+container).evaluate(el=>el.previousElementSibling?.id==='circuitTransport'),'Navegación en su fila independiente');
  if(transport)assert(Math.abs(actions.x+actions.width/2-diagram.x-diagram.width/2)<2,'Reproducción centrada');
  else assert(await page.locator('#'+container).evaluate(el=>getComputedStyle(el).justifyContent==='flex-end'),'Navegación a la derecha');
 };
 await page.evaluate(markup=>{const probe=document.createElement('div');probe.id='algebraProbe';probe.innerHTML=markup;document.body.append(probe)},isolationMarkup);
 const values=await page.locator('#algebraProbe .algebra-isolated-value:visible').allTextContents();
 assert.deepEqual(values,['I₂ = 4 A','I₂ = 1,5 A']);
 assert.equal(await page.locator('#algebraProbe .algebra-isolated-value:visible').first().evaluate(el=>getComputedStyle(el).color),'rgb(183, 247, 92)');
 await page.locator('#algebraProbe').evaluate(el=>el.remove());
 const assertNoCurrentOverlap=async()=>{
  const problems=await page.locator('#circuit').evaluate(svg=>{
   const visible=el=>el.getClientRects().length&&getComputedStyle(el).visibility!=='hidden';
   const rect=el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
   const overlap=(a,b)=>{
    if(a.radius!==undefined&&b.radius!==undefined)return Math.hypot(a.x-b.x,a.y-b.y)<a.radius+b.radius-.25;
    if(b.radius!==undefined)return overlap(b,a);
    if(a.radius!==undefined)return Math.hypot(Math.max(b.x-a.x,0,a.x-b.x-b.w),Math.max(b.y-a.y,0,a.y-b.y-b.h))<Math.max(0,a.radius-.25);
    return a.x<b.x+b.w-.5&&a.x+a.w>b.x+.5&&a.y<b.y+b.h-.5&&a.y+a.h>b.y+.5;
   };
   const regions=el=>{if(!el.matches('.direction'))return [rect(el)];const m=el.getScreenCTM(),length=el.getTotalLength(),radius=parseFloat(getComputedStyle(el).strokeWidth)*Math.hypot(m.a,m.b)/2,out=[];for(let at=0;at<=length;at+=.75){const p=el.getPointAtLength(at).matrixTransform(m);out.push({x:p.x,y:p.y,radius});}return out;};
   const fixed=[...svg.querySelectorAll('#staticCircuit .symbol,#staticCircuit .source-halo,#staticCircuit .component-value,#staticCircuit .resistor-name,#staticCircuit .txt,#staticCircuit .txtsm,#staticCircuit .nod,#loopArrows .mesh-label,#loopArrows .mesh-complete')].filter(visible).map(rect);
   const current=[...svg.querySelectorAll('#dirGraphics .dirlabel,#dirGraphics .dir-result,#dirGraphics .direction,#sixRefArrows .dirlabel,#sixRefArrows .dir-result,#sixRefArrows .direction')].filter(visible);
   const geometry=current.map(regions);
   return current.flatMap((el,i)=>{
    const bad=geometry[i].some(r=>fixed.some(b=>overlap(r,b))||geometry.slice(0,i).some(other=>other.some(b=>overlap(r,b))));
    return bad?[{id:el.parentElement.id,text:el.textContent,rect:rect(el)}]:[];
   });
  });assert.deepEqual(problems,[],'Flechas y textos sin solaparse con componentes ni otras corrientes');
 };
 const assertBranchPlacement=async six=>{
  const branches=six?[
   [[130,225],[130,74],[350,74]],[[350,74],[350,225]],[[350,74],[570,74],[570,225]],
   [[130,225],[350,225]],[[350,225],[570,225]],[[130,225],[130,355],[570,355],[570,225]]
  ]:[[[345,360],[146,360],[146,74],[345,74]],[[345,360],[345,74]],[[345,360],[544,360],[544,74],[345,74]]];
  const details=await page.locator(six?'#sixRefArrows [data-current-index]':'#dirGraphics [data-current-index]').evaluateAll((groups,branches)=>groups.map(el=>{
   const x=Number(el.dataset.arrowX),y=Number(el.dataset.arrowY),points=branches[Number(el.dataset.currentIndex)];
   const onBranch=points.some((b,i)=>{if(!i)return false;const a=points[i-1];return Math.abs((b[0]-a[0])*(y-a[1])-(b[1]-a[1])*(x-a[0]))<.01&&x>=Math.min(a[0],b[0])-.01&&x<=Math.max(a[0],b[0])+.01&&y>=Math.min(a[1],b[1])-.01&&y<=Math.max(a[1],b[1])+.01;});
   const label=el.querySelector('.dirlabel').getBBox(),distance=Math.hypot(Math.max(label.x-x,0,x-label.x-label.width),Math.max(label.y-y,0,y-label.y-label.height));
   return {onBranch,near:distance<30,display:getComputedStyle(el).display};
  }),branches);
  assert(details.every(d=>d.onBranch&&d.near&&d.display!=='none'),JSON.stringify(details));
  assert.equal(await page.locator('.current-label-leader').count(),0,'Sin etiquetas alejadas ni líneas de enlace');
  const sizes=await page.locator('#circuit').evaluate(svg=>{
   const base=parseFloat(getComputedStyle(svg.querySelector('.component-value')).fontSize);
   return [...svg.querySelectorAll('[data-current-index]')].filter(el=>getComputedStyle(el).display!=='none').map(group=>{
    const path=group.querySelector('.direction'),box=path.getBBox(),stem=path.getAttribute('d').match(/^M([^ ]+) ([^ ]+) L([^ ]+) ([^ ]+)/);
    return {matching:[...group.querySelectorAll('.dirlabel,.dir-result')].every(text=>Math.abs(parseFloat(getComputedStyle(text).fontSize)-base)<.05&&!text.hasAttribute('textLength')),shaft:Math.hypot(Number(stem[3])-Number(stem[1]),Number(stem[4])-Number(stem[2])),length:Math.max(box.width,box.height),stroke:parseFloat(getComputedStyle(path).strokeWidth)};
   });
  });
  assert(sizes.every(s=>s.matching&&Math.abs(s.shaft-(six?18:24))<.01&&s.length>=(six?17.9:23.9)&&s.stroke>=2.5),JSON.stringify(sizes));
 };
 assert.equal(await page.locator('#stagebar .phase-reset svg').count(),0);assert.equal(await page.locator('#stagebar .phase-complete svg').count(),4);assert.equal(await page.locator('#activePhaseReset svg').count(),1);
 assert.equal(await page.locator('[data-phase="1"]').count(),0);assert.equal(await page.locator('[data-phase="2"]').isDisabled(),true);assert.match(await page.locator('[data-phase="0"]').textContent(),/Corrientes y nudos/);
 await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='scrollProbe';spacer.style.height='1500px';document.body.append(spacer);window.scrollTo(0,500);});
 assert(Math.abs((await page.locator('#stagebar').boundingBox()).y)<2,'Fases fijas al desplazarse');
 await page.evaluate(()=>{document.getElementById('scrollProbe').remove();window.scrollTo(0,0);});
 const tap=async(x,y)=>{
  await page.locator('#circuit').scrollIntoViewIfNeeded();
  const p=await page.locator('#circuit').evaluate((svg,[x,y])=>{const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y}},[x,y]);
  if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
 };
 const tapMeshTurn=async index=>{
  const point=await page.locator(`[data-mesh-turn="${index}"] .mesh-turn-hit`).evaluate(el=>{const b=el.getBBox();return {x:b.x+b.width/2,y:b.y+b.height/2};});await tap(point.x,point.y);
 };
 const checkMeshSelection=async(index,clockwise)=>{
  assert.equal(await page.locator('#meshSelection').getAttribute('data-selected-mesh'),String(index));
  assert.equal(await page.locator('#meshSelection').getAttribute('data-turn'),clockwise?'clockwise':'counterclockwise');
  assert.equal(await page.locator('#meshSelection .mesh-selection-contour').count(),4,'Cabezas de flecha en los cuatro lados');
  for(const path of await page.locator('#meshSelection .mesh-selection-contour').all()){
   assert.equal(await path.getAttribute('marker-end'),'url(#meshContourArrow)');
   assert(await path.evaluate((el,cw)=>{
    const n=el.getTotalLength(),a=el.getPointAtLength(n-1),b=el.getPointAtLength(n),edge=el.dataset.edge;
    return edge==='top'?(cw?b.x>a.x:b.x<a.x):edge==='bottom'?(cw?b.x<a.x:b.x>a.x):edge==='left'?(cw?b.y<a.y:b.y>a.y):(cw?b.y>a.y:b.y<a.y);
   },clockwise),'Las puntas siguen el giro elegido');
  }
  const summaries=await page.locator('[data-mesh-summary]').evaluateAll(groups=>groups.map(group=>{
   const status=group.querySelector('[data-mesh-pending],[data-mesh-complete]'),turn=group.querySelector('.mesh-turn-hit'),name=group.querySelector('[data-mesh-name]');
   const a=status.getBoundingClientRect(),b=turn.getBoundingClientRect(),c=name.getBoundingClientRect();return {statusBottom:a.bottom,turnTop:b.top,nameBottom:c.bottom,statusTop:a.top};
  }));
  assert(summaries.every(p=>p.turnTop>=p.statusBottom+1&&p.statusTop>p.nameBottom),JSON.stringify(summaries));
  const styles=await page.locator('#meshSelection .mesh-selection-fill').evaluate(el=>{const s=getComputedStyle(el);return {fill:s.fill,opacity:s.fillOpacity}});
  if(meshShadeReference)assert.deepEqual(styles,meshShadeReference,'Mismo sombreado en escritorio y móvil');else meshShadeReference=styles;
  assert(Number(styles.opacity)>=.3);
 };
 const checkVisibleMeshShade=async(x,y)=>{
  const pixels=await page.locator('#circuit').evaluate(async(svg,{x,y})=>{
   const clone=svg.cloneNode(true),from=[svg,...svg.querySelectorAll('*')],to=[clone,...clone.querySelectorAll('*')];
   const properties=['fill','fill-opacity','stroke','stroke-width','stroke-opacity','stroke-dasharray','opacity','display','visibility','font-size','font-family','font-weight','text-anchor','dominant-baseline','vector-effect'];
   from.forEach((el,i)=>{const style=getComputedStyle(el);for(const prop of properties)to[i].style.setProperty(prop,style.getPropertyValue(prop));});
   const box=svg.viewBox.baseVal;clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width',box.width);clone.setAttribute('height',box.height);clone.style.width=box.width+'px';clone.style.height=box.height+'px';
   const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(clone));});
   const canvas=document.createElement('canvas');canvas.width=box.width;canvas.height=box.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
   return {inside:[...ctx.getImageData(Math.round(x-box.x),Math.round(y-box.y),1,1).data],outside:[...ctx.getImageData(580-box.x,110-box.y,1,1).data]};
  },{x,y});
  assert(pixels.inside[3]>=80&&pixels.inside[3]<=95&&pixels.outside[3]<20&&[117,105,168].every((n,i)=>Math.abs(pixels.inside[i]-n)<=4),'Mismo sombreado violeta visible en la imagen del circuito: '+JSON.stringify(pixels));
 };
 const openNumberEditor=async(selector,gesture=mobile?'long':'double')=>{
  await page.locator('#circuit').scrollIntoViewIfNeeded();
  const point=await page.locator(selector+' .dirlabel').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
  const pose=await page.locator(selector).evaluate(el=>({x:el.dataset.arrowX,y:el.dataset.arrowY,d:el.querySelector('.direction').getAttribute('d')}));
  if(mobile){
   const session=await context.newCDPSession(page);
   const start=()=>session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:point.x,y:point.y,id:41,radiusX:1,radiusY:1}]});
   const end=()=>session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await start();await page.waitForTimeout(gesture==='long'?650:60);await end();
   if(gesture==='double'){await page.waitForTimeout(80);await start();await page.waitForTimeout(50);await end();}
   await session.detach();
  }else if(gesture==='double')await page.mouse.dblclick(point.x,point.y,{delay:80});
  else{await page.mouse.move(point.x,point.y);await page.mouse.down();await page.waitForTimeout(650);await page.mouse.up();}
  await page.locator('#currentNameDialog').waitFor({state:'visible'});
  assert(await page.locator('#currentNumber').evaluate(el=>el.selectionStart===0&&el.selectionEnd===el.value.length),'Número actual seleccionado');
  const dialog=await page.locator('#currentNameDialog').boundingBox();assert(dialog.width<250&&dialog.height<100,'Editor compacto');
  const entered=await page.locator('#currentNumber').inputValue();await page.click('#currentNameDialog [data-context-help="currentName"]');assert(await page.locator('#phaseHelpDialog').isVisible());await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});assert(await page.locator('#currentNameDialog').isVisible());assert.equal(await page.locator('#currentNumber').inputValue(),entered,'La ayuda conserva el número');
  const current=await page.locator(selector).evaluate(el=>({x:el.dataset.arrowX,y:el.dataset.arrowY,d:el.querySelector('.direction').getAttribute('d')}));
  assert.deepEqual(current,pose,'Abrir el editor no mueve ni invierte la flecha');return pose;
 };
 const saveNumber=async(selector,number,pose)=>{
  await page.locator('#currentNumber').fill(String(number));await page.click('#currentNameForm button[type="submit"]');
  assert.equal(await page.locator('#currentNameDialog').isVisible(),false,'Guarda el número editado');
  assert.deepEqual(await page.locator(selector).evaluate(el=>({x:el.dataset.arrowX,y:el.dataset.arrowY,d:el.querySelector('.direction').getAttribute('d')})),pose,'Cambiar el número conserva posición y sentido');
 };
 const dragCurrent=async(selector,x,y,byLabel=false)=>{
  await page.locator('#circuit').scrollIntoViewIfNeeded();
  const points=await page.locator(selector).evaluate((group,{x,y,byLabel})=>{
   const svg=document.getElementById('circuit'),matrix=svg.getScreenCTM(),arrow=new DOMPoint(Number(group.dataset.arrowX),Number(group.dataset.arrowY)).matrixTransform(matrix);
   const label=group.querySelector('.dirlabel').getBoundingClientRect(),start=byLabel?{x:byLabel==='padding'?label.x-8:label.x+label.width/2,y:label.y+label.height/2}:{x:arrow.x,y:arrow.y};
   const target=new DOMPoint(x,y).matrixTransform(matrix);
   return {start,end:{x:target.x+start.x-arrow.x,y:target.y+start.y-arrow.y}};
  },{x,y,byLabel});
  const scrollBefore=await page.evaluate(()=>scrollY);
  if(mobile){
   const session=await context.newCDPSession(page);
   const touch=(type,x,y)=>session.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:9,radiusX:1,radiusY:1}]});
   await touch('touchStart',points.start.x,points.start.y);
   for(let step=1;step<=7;step++)await touch('touchMove',points.start.x+(points.end.x-points.start.x)*step/7,points.start.y+(points.end.y-points.start.y)*step/7);
   await touch('touchEnd',points.end.x,points.end.y);await session.detach();
  }else{
   await page.mouse.move(points.start.x,points.start.y);await page.mouse.down();await page.mouse.move(points.end.x,points.end.y,{steps:7});await page.mouse.up();
  }
  assert.equal(await page.locator('#circuit').evaluate(el=>el.classList.contains('dragging-current')),false,'Arrastre finalizado');
  assert(Math.abs((await page.evaluate(()=>scrollY))-scrollBefore)<2,'Arrastrar una corriente no desplaza la página: '+JSON.stringify({before:scrollBefore,after:await page.evaluate(()=>scrollY),points,position:await page.locator(selector).evaluate(el=>({x:el.dataset.arrowX,y:el.dataset.arrowY}))}));
  return page.locator(selector).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
 };
 const pauseResume=async id=>{
  const button=page.locator('#'+id);
  await page.waitForFunction(id=>document.getElementById(id).dataset.state==='running',id);
  await page.waitForTimeout(80);
  await page.click('#circuitCard [data-context-help="circuit"]');assert.equal(await button.getAttribute('data-state'),'paused');const helpPosition=await page.locator('#hero').getAttribute('transform');await page.waitForTimeout(100);assert.equal(await page.locator('#hero').getAttribute('transform'),helpPosition,'La ayuda detiene el recorrido');await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});await page.waitForFunction(id=>document.getElementById(id).dataset.state==='running',id);await page.waitForTimeout(50);
  assert.equal(await page.locator('.mesh-status-moving').count(),1,'Rótulo de operación parpadea al moverse');
  assert.match(await page.locator('.mesh-status-moving').textContent(),/Σ I·R|Σ U/);
  const runningColor=await button.evaluate(el=>getComputedStyle(el).backgroundColor);
  await button.click();assert.equal(await button.getAttribute('data-state'),'paused');
  assert(await button.locator('.transport-play').isVisible());assert.equal(await button.locator('.transport-stop').isVisible(),false);
  assert.equal(await page.locator('.mesh-status-moving').count(),0,'Rótulo quieto con pausa');
  const position=await page.locator('#hero').getAttribute('transform');
  await selectSymbol('ansi');assert.equal(await button.getAttribute('data-state'),'paused');assert.equal(await page.locator('#hero').getAttribute('transform'),position);
  await selectSymbol('iec');
  await page.locator('#hero').dispatchEvent('pointerdown',{pointerId:71,isPrimary:true,pointerType:'touch',button:0});
  assert.equal(await page.locator('#heroBody').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  assert.equal(await page.locator('#heroTail').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  assert(await page.locator('#hero .hero-segment').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).visibility==='hidden')));
  await page.locator('body').dispatchEvent('pointerup',{pointerId:71,isPrimary:true,pointerType:'touch',button:0});
  assert.equal(await page.locator('#heroBody').evaluate(el=>getComputedStyle(el).visibility),'visible');
  assert.equal(await page.locator('#heroTail').evaluate(el=>getComputedStyle(el).visibility),'visible');assert.match(await page.locator('#heroShape').getAttribute('transform'),/^rotate\(/,'La cabeza gira con el recorrido');assert.equal(await page.locator('#heroFaceOrientation').getAttribute('transform'),null,'La cara no contragira respecto a la cabeza');
  const dots=await page.locator('.fx-current-dot').evaluateAll(nodes=>nodes.map(n=>[n.getAttribute('cx'),n.getAttribute('cy')]));
  await page.waitForTimeout(220);
  assert.equal(await page.locator('#hero').getAttribute('transform'),position,'El gusano se detiene');
  assert.deepEqual(await page.locator('.fx-current-dot').evaluateAll(nodes=>nodes.map(n=>[n.getAttribute('cx'),n.getAttribute('cy')])),dots,'Las partículas se detienen');
  assert.notEqual(await button.evaluate(el=>getComputedStyle(el).backgroundColor),runningColor,'Color diferente en parada');
  await button.click();assert.equal(await button.getAttribute('data-state'),'running');assert(await button.locator('.transport-stop').isVisible());
  await page.waitForFunction(position=>document.getElementById('hero').getAttribute('transform')!==position,position);
 };
 const assignNumbers=async numbers=>{
  const coords=numbers.length===6?[[235,74],[350,150],[465,74],[209,225],[510,225],[466,355]]:[[146,235],[345,235],[544,235]];
  for(let i=0;i<numbers.length;i++){await tap(...coords[i]);await page.locator('#currentNumber').fill(String(numbers[i]));await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,'Rama '+(i+1)+': '+await page.locator('#currentNumber').getAttribute('aria-invalid'));}
 };
 await page.selectOption('#exerciseSelect','base');
  if(await page.locator('#toggleDemo').getAttribute('aria-pressed')==='true')await page.click('#toggleDemo');
  assert.equal(await page.locator('#toggleDemo').getAttribute('aria-pressed'),'false','Editor manual en modo jugable');
 assert.equal(await page.locator('#confirmDirs').isDisabled(),true);
 const circuitScale=()=>page.locator('#circuit').evaluate(el=>({width:el.getBoundingClientRect().width,scale:el.getScreenCTM().a,zoom:el.style.getPropertyValue('--circuit-zoom'),viewport:visualViewport?.scale||1}));
 const beforeNumbering=await circuitScale(),originalViewport=await page.locator('meta[name=viewport]').getAttribute('content');
 await tap(146,310);
 assert.deepEqual(await circuitScale(),beforeNumbering,'Abrir la numeración no hace zoom en el circuito ni en la página');
 if(mobile)assert.match(await page.locator('meta[name=viewport]').getAttribute('content'),/maximum-scale=1(?:,|$)/,'Se evita expresamente el autozoom del teclado durante la numeración');
 else assert.equal(await page.locator('meta[name=viewport]').getAttribute('content'),originalViewport);
 assert(await page.locator('#currentNumber').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=16),'Campo sin reducción que provoque zoom al enfocar');
 assert.equal(await page.locator('[data-current-branch="0"]').evaluate(el=>getComputedStyle(el).touchAction),'manipulation','La pulsación de ramas no dispara el zoom de doble toque');
 if(mobile){
  const viewport=page.viewportSize();await page.setViewportSize({width:viewport.width,height:Math.round(viewport.height*.65)});
  assert.deepEqual(await circuitScale(),beforeNumbering,'El teclado no cambia la escala del circuito');
  await page.setViewportSize(viewport);
 }
 if(!mobile){const distance=await page.locator('#currentNameDialog').evaluate(el=>{const p=new DOMPoint(146,310).matrixTransform(document.getElementById('circuit').getScreenCTM()),r=el.getBoundingClientRect();return Math.hypot(Math.max(r.left-p.x,0,p.x-r.right),Math.max(r.top-p.y,0,p.y-r.bottom));});assert(distance<60,'Editor junto a la rama seleccionada: '+distance);}assert(await page.locator('[data-current-branch="0"]').evaluate(el=>getComputedStyle(el).outlineStyle==='none'));assert((await page.locator('#branchSelection').getAttribute('d')).length>0);assert(await page.locator('#currentNameDialog').isVisible(),JSON.stringify(await page.evaluate(()=>({scroll:[scrollX,scrollY],bar:document.querySelector('#stagebar').getBoundingClientRect().toJSON(),circuit:document.querySelector('#circuit').getBoundingClientRect().toJSON(),width:document.documentElement.scrollWidth}))));await page.locator('#currentNumber').fill('7');await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,await page.locator('#currentNumber').getAttribute('aria-invalid'));
 await page.waitForFunction(original=>document.querySelector('meta[name=viewport]').getAttribute('content')===original,originalViewport);
 assert.equal(await page.locator('meta[name=viewport]').getAttribute('content'),originalViewport,'Al cerrar se restaura el zoom habitual de la página');
 await tap(345,310);await page.locator('#currentNumber').fill('7');await page.click('#currentNameForm button[type="submit"]');
 assert.equal(await page.locator('#currentNumber').getAttribute('aria-invalid'),'true');assert(await page.locator('#currentNameDialog').isVisible());
 await page.locator('#currentNumber').fill('12');await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,await page.locator('#currentNumber').getAttribute('aria-invalid'));
 await tap(544,310);await page.locator('#currentNumber').fill('3');await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,await page.locator('#currentNumber').getAttribute('aria-invalid'));
 let editPose=await openNumberEditor('#currentArrow0');
 assert.equal(await page.locator('#currentNumber').inputValue(),'7');
 await page.locator('#currentNumber').fill('12');await page.click('#currentNameForm button[type="submit"]');
 assert.equal(await page.locator('#currentNumber').getAttribute('aria-invalid'),'true','No repite el número de otra rama');
 assert.equal(await page.locator('#currentArrow0 .dirlabel').textContent(),'I₇');
 await saveNumber('#currentArrow0',17,editPose);assert.equal(await page.locator('#currentArrow0 .dirlabel').textContent(),'I₁₇');
 assert.equal(await page.locator('#currentArrow1 .dirlabel').textContent(),'I₁₂','No modifica números con prefijos parecidos');
 editPose=await openNumberEditor('#currentArrow0',mobile?'double':'long');
 await page.locator('#currentNumber').fill('9');await page.keyboard.press('Escape');await page.locator('#currentNameDialog').waitFor({state:'hidden'});assert.equal(await page.locator('#currentArrow0 .dirlabel').textContent(),'I₁₇','Cancelar conserva el número');
 editPose=await openNumberEditor('#currentArrow0');await saveNumber('#currentArrow0',7,editPose);
 for(const [i,x] of [146,345,544].entries()){
  const position=await page.locator('#currentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
  assert(Math.abs(position.x-x)<2&&Math.abs(position.y-310)<2,'Flecha sobre la rama en el punto pulsado');
 }
 await tap(146,175);assert.equal(await page.locator('#currentNameDialog').isVisible(),false);
 assert.match(await page.locator('#currentPlacementNotice').textContent(),/ya tiene la corriente I₇/);
 assert.equal(await page.locator('#dirGraphics [data-current-index]').count(),3,'No duplica la corriente de una rama ocupada');
 assert.equal(await page.locator('#currentArrow0 .dirlabel').textContent(),'I₇');assert.equal(await page.locator('#currentArrow1 .dirlabel').textContent(),'I₁₂');
 await selectSymbol('ansi');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);assert.equal(await page.locator('#circuit .resistor-ansi .symbol:visible').count(),3);assert.equal(await page.locator('#circuit .resistor-iec .symbol:visible').count(),0);
 for(const resistor of await page.locator('#circuit .component-resistor').all()){
  assert(await resistor.evaluate(el=>{
   const symbol=el.querySelector('.resistor-ansi .symbol'),value=el.querySelector('.resistor-value'),label=el.querySelector('.resistor-ansi .resistor-name');
   const center=new DOMPoint(0,0).matrixTransform(symbol.getScreenCTM()),anchor=new DOMPoint(Number(value.getAttribute('x')),Number(value.getAttribute('y'))).matrixTransform(value.getScreenCTM());
   return Math.abs(center.y-anchor.y)<1&&Number(label.getAttribute('x'))<Number(value.getAttribute('x'));
  }),'Valor centrado en altura y nombre a la izquierda');
 }
 await selectSymbol('iec');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);assert.equal(await page.locator('#circuit .resistor-iec .symbol:visible').count(),3);
 await page.locator('#circuit').scrollIntoViewIfNeeded();
 const labelPoint=await page.locator('#currentArrow0 .dirlabel').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};});
 if(mobile)await page.touchscreen.tap(labelPoint.x,labelPoint.y);else await page.mouse.click(labelPoint.x,labelPoint.y);
 await page.click('#confirmDirs');await enterNodeEquation(page,'A','I7+I12+I3=0');
 assert(await page.locator('#goLoops').isVisible(),'Confirma una pulsación simple pendiente antes de fijar referencias');
 await page.click('#editCurrentReferences');
 const originalArrow=await page.locator('#currentArrow0').evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));await tap(originalArrow.x,originalArrow.y);
 await page.click('#confirmDirs');await enterNodeEquation(page,'A','I7=I12+I3');
 assert.match(await page.locator('#nodeEq').textContent(),/I₇.*I₁₂.*I₃/);
 assert(!/\bKCL\b|\bKVL\b/.test(await page.locator('body').innerText()));
 assert(parseFloat(await page.locator('#nodeEq').evaluate(el=>getComputedStyle(el).fontSize))>=18);
 const arrow=async s=>page.locator(s+' .direction').getAttribute('d');
 await page.selectOption('#exerciseSelect','base');if(await page.locator('#toggleDemo').getAttribute('aria-pressed')==='true')await page.click('#toggleDemo');assert.equal(await page.locator('#toggleDemo').getAttribute('aria-pressed'),'false','Modo interactivo para la topología introductoria');await assignNumbers([1,2,3]);
 assert.equal(await page.locator('#reductions').isVisible(),false,'No se deben pedir resistencias equivalentes');await page.click('#confirmDirs');
 assert.equal(await page.locator('#hero').isVisible(),false);await page.locator('#nodeTargets [data-node="A"]').click();assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);await page.click('#startNodeEquations');await page.locator('#nodeEquationChallenge .kcl-answer').fill('I1');
 const term=page.locator('#nodeEquationChallenge .kcl-live-term').first();
 const blink=await term.evaluate(el=>{const s=getComputedStyle(el);return {name:s.animationName,duration:s.animationDuration,count:s.animationIterationCount}});
 assert.equal(blink.name,'kclTermBlink');assert.equal(blink.count,'3');
 await page.waitForFunction(()=>!document.querySelector('#nodeEquationChallenge .blink-three'));
 assert.equal(await term.evaluate(el=>getComputedStyle(el).opacity),'1');await page.click('#closeNodeEquation');
 await page.click('#toggleDemo');assert.equal(await page.locator('#toggleDemo').getAttribute('aria-pressed'),'true','Restaurar modo demo para probar recorrido guiado');for(const [i,coords] of [[146,235],[345,235],[544,235]].entries()){await tap(...coords);assert.equal(await page.locator(`#currentArrow${i} .dirlabel`).textContent(),['I₁','I₂','I₃'][i],'Numeración automática en demo');}
 const expandedHit=await page.locator('#currentArrow0').evaluate(group=>{
  const x=Number(group.dataset.arrowX),y=Number(group.dataset.arrowY),dx=Number(group.dataset.arrowDx),dy=Number(group.dataset.arrowDy),label=group.querySelector('.dirlabel').getBBox();
  const side=Math.abs(dx)>.5?(label.y+label.height/2<y?1:-1):(label.x+label.width/2<x?1:-1);
  return {x:x+(Math.abs(dy)>.5?24*side:0),y:y+(Math.abs(dx)>.5?24*side:0)};
 });
 const originalDirection=await page.locator('#currentArrow0 .direction').getAttribute('d');
 await tap(expandedHit.x,expandedHit.y);assert.notEqual(await page.locator('#currentArrow0 .direction').getAttribute('d'),originalDirection,'Pulsación fuera del dibujo dentro de la zona ampliada');
 await tap(expandedHit.x,expandedHit.y);assert.equal(await page.locator('#currentArrow0 .direction').getAttribute('d'),originalDirection);
 assert(parseFloat(await page.locator('#currentArrow0 .current-direction-hit').evaluate(el=>getComputedStyle(el).strokeWidth))>=44);
 let dragged=await dragCurrent('#currentArrow0',146,310,'padding');
 assert(Math.hypot(dragged.x-146,dragged.y-310)<2,'Arrastra flecha por su conductor');
 let direction=await page.locator('#currentArrow0 .direction').getAttribute('d');
 assert(Number(direction.split(' ')[1])>Number(direction.split(' L')[1].split(' ')[1]),'Arrastrar conserva el sentido ascendente');
 dragged=await dragCurrent('#currentArrow0',249,74,true);
 assert(Math.hypot(dragged.x-249,dragged.y-74)<2,'Arrastra desde el texto y atraviesa la esquina de la misma rama');
 await dragCurrent('#currentArrow0',345,300);await assertBranchPlacement(false);await assertNoCurrentOverlap();
 await dragCurrent('#currentArrow0',146,235);await assertNoCurrentOverlap();
 dragged=await dragCurrent('#currentArrow0',146,310,true);
 await page.locator('#currentArrow0').focus();await page.locator('#currentArrow0').press('ArrowUp');
 const keyboard=await page.locator('#currentArrow0').evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
 assert(keyboard.y<dragged.y-5,'También se puede desplazar con el teclado');
 assert.equal(await page.locator('#resetLoop svg').count(),1);assert.equal(await page.locator('#resetLoop').getAttribute('aria-label'),'Repetir recorrido');
 assert.equal(await page.locator('#dirButtons,#advDirections,#loopButtons,#advLoopButtons,#cw,#ccw,#advCw,#advCcw').count(),0);
 for(const i of [0,1,2]){
  const {x,y}=await page.locator('#currentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
  const sel='#currentArrow'+i,before=await arrow(sel);await tap(x,y);assert.notEqual(await arrow(sel),before,'Invertir corriente '+i);await tap(x,y);assert.equal(await arrow(sel),before);
 }
 await checkAction('confirmDirs');await page.click('#confirmDirs');
 assert.equal(await page.locator('#hero').isVisible(),false);assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);await page.locator('#nodeTargets [data-node="A"]').click();assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);await page.click('#startNodeEquations');if(await page.locator('#nodeEquationChallenge .kcl-drag-token').count()){await page.locator('#nodeEquationChallenge .kcl-drag-token').first().click();await page.locator('#nodeEquationChallenge .kcl-drop-side').first().click();}else await page.locator('#nodeEquationChallenge .kcl-answer').fill('I1=I2');await page.click('#nodeEquationChallenge .kcl-check');assert(await page.locator('#nodeEquationDialog').isVisible(),'Rechaza una ecuación incorrecta');await page.click('#closeNodeEquation');assert.equal(await page.locator('#goLoops').isVisible(),false,'Cancelar no completa el nudo');await enterNodeEquation(page,'A','I1=I2+I3');
 await page.locator('#nodeTargets [data-node="B"]').click();assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false,'No duplica una ecuación dependiente');
 const fixedEquation=await page.locator('#nodeEq').textContent();
 await dragCurrent('#currentArrow0',146,300,true);assert.equal(await page.locator('#nodeEq').textContent(),fixedEquation,'Mover la flecha conserva las ecuaciones');
 await checkAction('goLoops');await page.click('#goLoops');await checkMeshSelection(0,true);await checkVisibleMeshShade(205,110);await checkAction('confirmMeshDirections');assert.equal(await page.locator('#advance').isDisabled(),true);assert.equal(await page.locator('#advance').isVisible(),false);assert(await page.locator('#equationsCard #nodeEqPanel [data-equation="E1"]').isVisible());
 await tap(490,290);assert.equal(await page.locator('#meshSelection').getAttribute('data-selected-mesh'),'1');
 await tapMeshTurn(1);await checkMeshSelection(1,false);assert.match(await page.locator('#boardState').textContent(),/antihorario/);
 await tap(490,290);assert.match(await page.locator('#boardState').textContent(),/antihorario/,'Pulsar la malla activa conserva el progreso');
 await page.locator('[data-mesh-turn="1"]').focus();await page.locator('[data-mesh-turn="1"]').press('Space');
 assert.match(await page.locator('#boardState').textContent(),/horario/);assert.equal(await page.locator('#advance').isEnabled(),false,'No inicia el recorrido sin confirmar los sentidos');
 await checkMeshSelection(1,true);await tap(210,290);assert.equal(await page.locator('#meshSelection').getAttribute('data-selected-mesh'),'0');
 await page.click('#confirmMeshDirections');await checkAction('advance');await page.click('#advance');await tap(490,290);assert.equal(await page.locator('#meshSelection').getAttribute('data-selected-mesh'),'0','No cambiar malla durante el recorrido');
 await pauseResume('advance');
 await page.waitForFunction(()=>document.querySelector('#hero').classList.contains('hero-happy'));
 assert.equal(await page.locator('#advance').getAttribute('data-state'),'waiting');
 assert(await page.locator('#equationsCard #boardEquations [data-equation="E2"]').isVisible());
 const reaction=await page.evaluate(()=>{
  const style=sel=>{const s=getComputedStyle(document.querySelector(sel));return {name:s.animationName,duration:s.animationDuration,transition:s.transitionDuration}};
  return {face:style('.hero-face'),mouth:style('.hero-open-smile'),eyes:style('.hero-eyes'),term:style('.flash-term'),arrow:style('.flash-arrow')};
 });
 assert.equal(reaction.face.name,'heroJoy');assert.equal(reaction.mouth.name,'heroLaugh');assert.equal(reaction.term.name,'termBlink');assert.equal(reaction.arrow.name,'arrowBlink');
 const signature={blink,reaction};if(animationReference)assert.deepEqual(signature,animationReference,'Parpadeos y gestos idénticos en móvil/escritorio y movimiento reducido');else animationReference=signature;
 await page.selectOption('#exerciseSelect','r76');if(await page.locator('#toggleDemo').getAttribute('aria-pressed')==='true')await page.click('#toggleDemo');await assignNumbers([1,2,3,4,5,6]);
 for(const i of [0,1,2,3,4,5]){
  const {x,y}=await page.locator('#sixCurrentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
  const sel='#sixCurrentArrow'+i,before=await arrow(sel);await tap(x,y);assert.notEqual(await arrow(sel),before,'Invertir corriente avanzada '+i);await tap(x,y);assert.equal(await arrow(sel),before);
 }
 dragged=await dragCurrent('#sixCurrentArrow4',388,225,true);
 assert(Math.hypot(dragged.x-388,dragged.y-225)<2,'Arrastra I5 y su texto dentro de su rama');
 await dragCurrent('#sixCurrentArrow4',130,190);await assertBranchPlacement(true);await assertNoCurrentOverlap();
 await dragCurrent('#sixCurrentArrow4',465,225);
 await selectSymbol('ansi');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);
 for(const resistor of await page.locator('#circuit .component-resistor').all()){
  assert(await resistor.evaluate(el=>{
   const symbol=el.querySelector('.resistor-ansi .symbol'),value=el.querySelector('.resistor-value');
   const center=new DOMPoint(0,0).matrixTransform(symbol.getScreenCTM()),anchor=new DOMPoint(Number(value.getAttribute('x')),Number(value.getAttribute('y'))).matrixTransform(value.getScreenCTM());
   return value.getAttribute('text-anchor')==='middle'?Math.abs(center.x-anchor.x)<1:Math.abs(center.y-anchor.y)<1;
  }),'Valor centrado en resistencia horizontal o vertical');
 }
 await selectSymbol('iec');
 await checkAction('advStart');await page.click('#advStart');
 assert.equal(await page.locator('#hero').isVisible(),false);assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);assert.match(await page.locator('#advNodeEquationCount').textContent(),/4 − 1 = 3/);
 await page.locator('#nodeTargets [data-node="D"]').click();assert.match(await page.locator('#advNodeEquationCount [data-node-selection-progress]').textContent(),/1 de 3/);assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);
 await page.locator('#nodeTargets [data-node="D"]').click();assert.match(await page.locator('#advNodeEquationCount [data-node-selection-progress]').textContent(),/0 de 3/,'Permite corregir la selección');
 for(const [index,node] of ['D','A','C'].entries()){
  await page.locator('#nodeTargets [data-node="'+node+'"]').click();assert.match(await page.locator('#advNodeEquationCount [data-node-selection-progress]').textContent(),new RegExp((index+1)+' de 3'));assert.equal(await page.locator('#boardNodeSelectionCounter').textContent(),(index+1)+' de 3');assert(await page.locator('#boardNodeSelectionCounter').isVisible(),'Contador en la cabecera del circuito');assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false,'Selecciona todos los nudos antes de pedir ecuaciones');
  assert.equal(await page.locator('#advKCLtext [data-equation]').count(),0,'No crea ecuaciones al seleccionar');
  assert.equal(await page.locator('#nodeTargets [data-node="'+node+'"] circle').evaluate(el=>getComputedStyle(el).animationName),'nodeRingBlink','Parpadea cada nudo elegido');
  if(index===2)assert.equal(await page.locator('#nodeTargets [data-node="B"] circle').evaluate(el=>getComputedStyle(el).stroke),'none','Desaparece el círculo del nudo excluido');
 }
 await page.locator('#nodeTargets [data-node="B"]').click();assert.match(await page.locator('#advNodeEquationCount [data-node-selection-progress]').textContent(),/3 de 3/);assert.equal(await page.locator('#nodeTargets [data-node="B"]').getAttribute('aria-pressed'),'false','Deja un nudo sin considerar');
 await checkAction('advStartNodeEquations');await page.click('#advStartNodeEquations');
 let verifiedNodes=0;
 for(const [node,eq] of [['D','I3+I5+I6=0'],['A','I1=I2+I3'],['C','I2+I4=I5']]){
  await page.locator('#nodeEquationDialog').waitFor({state:'visible'});assert.match(await page.locator('#nodeEquationTitle').textContent(),new RegExp('Nudo '+node),'Pregunta las ecuaciones en el orden de selección');
  assert.deepEqual(await page.locator('#nodeTargets [data-node-blinking="true"]').evaluateAll(nodes=>nodes.map(el=>el.dataset.node)),[node],'El parpadeo pasa al nudo cuya ecuación se solicita');
  await page.locator('#nodeEquationChallenge .kcl-answer').fill(eq);await page.click('#nodeEquationChallenge .kcl-check');verifiedNodes++;assert.equal(await page.locator('#equationsCard #advKCL [data-equation]').count(),verifiedNodes);
 }
 assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);
 assert.deepEqual(await page.locator('#advKCLtext small').allTextContents(),['Nudo D','Nudo A','Nudo C'],'Conserva el orden de los nudos elegidos');await assertStageChecks(page,[0]);
 await page.locator('#nodeTargets [data-node="B"]').click();assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false,'El cuarto nudo aporta una ecuación dependiente');
 await checkAction('advGoLoops');await page.click('#advGoLoops');assert(await page.locator('#hero').isVisible());
 await checkMeshSelection(0,true);await checkVisibleMeshShade(185,190); await tap(460,290);assert.match(await page.locator('#advLap').textContent(),/Malla 3/);
 await tapMeshTurn(2);await checkMeshSelection(2,false);assert.match(await page.locator('#sixLoops [data-mesh-turn="2"]').textContent(),/↺/);
 await tap(460,290);assert.match(await page.locator('#sixLoops [data-mesh-turn="2"]').textContent(),/↺/);
 await tapMeshTurn(1);await checkMeshSelection(1,false);assert.match(await page.locator('#advLap').textContent(),/Malla 2/);assert.match(await page.locator('#sixLoops [data-mesh-turn="1"]').textContent(),/↺/);
 await checkAction('advConfirmMeshDirections');assert.equal(await page.locator('#advNext').isDisabled(),true);await page.click('#advConfirmMeshDirections');await checkAction('advNext');await page.click('#advNext');await tap(300,190);assert.match(await page.locator('#advLap').textContent(),/Malla 2/,'No cambiar malla avanzada durante el recorrido');
 await pauseResume('advNext');
 await page.locator('#sixTermChallenge .term-answer').waitFor({state:'visible'});
 editPose=await openNumberEditor('#sixCurrentArrow4');await saveNumber('#sixCurrentArrow4',15,editPose);
 assert.match(await page.locator('#advKCLtext').textContent(),/I₁₅/,'Actualiza las ecuaciones de nudo');
 assert.match(await page.locator('#sixTermChallenge .term-answer').getAttribute('placeholder'),/I₁₅/,'Actualiza el término pendiente');
 await page.locator('#sixTermChallenge .term-answer').fill('5I15');
 assert.equal(await page.locator('#sixTermChallenge .context-explanation').isVisible(),false);await page.click('#sixTermChallenge [data-context-help="resistanceTerm"]');assert(await page.locator('#phaseHelpDialog').isVisible());await page.keyboard.press('Escape');await page.locator('#phaseHelpDialog').waitFor({state:'hidden'});assert.equal(await page.locator('#sixTermChallenge .term-answer').inputValue(),'5I15');await page.click('#sixTermChallenge .term-check');
 await page.locator('#equationsCard #advBoardEquations [data-equation="E5"]').waitFor({state:'visible'});
 assert.match(await page.locator('#equationsCard #advBoardEquations [data-equation="E5"]').textContent(),/E5:/);
 assert.match(await page.locator('#advBoardRows').textContent(),/I₁₅/);editPose=await openNumberEditor('#sixCurrentArrow4');await saveNumber('#sixCurrentArrow4',5,editPose);assert(!/I₁₅/.test(await page.locator('#advBoardRows').textContent()));
 await page.click('[data-reset-phase="2"]');
 assert.equal(await page.locator('#advNext').getAttribute('data-state'),'blocked');assert(await page.locator('#advConfirmMeshDirections').isVisible());
 assert.equal(await page.locator('#advBoardRows [data-equation]').count(),0,'Reiniciar mallas borra los términos');
 assert.equal(await page.locator('#advKCLtext [data-equation]').count(),3,'Conserva los nudos anteriores');
 await page.click('[data-phase="0"]');
 assert(await page.locator('#advStart').isVisible(),'Volver a corrientes y nudos');
 assert.equal(await page.locator('[data-phase="2"]').isDisabled(),true);
 assert.equal(await page.locator('#sixRefArrows .dirlabel').count(),6,'Volver conserva la numeración');
 await page.click('#advStart');assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);await page.locator('#nodeTargets [data-node="D"]').click();assert.equal(await page.locator('#nodeEquationDialog').isVisible(),false);assert.match(await page.locator('#advNodeEquationCount [data-node-selection-progress]').textContent(),/1 de 3/);
 assert.equal(await page.locator('[data-phase="0"]').getAttribute('aria-current'),'step','Nudos en la misma fase que corrientes');
 await page.click('#advEditCurrentReferences');assert.equal(await page.locator('#advKCLtext [data-equation]').count(),0);
 await page.click('[data-reset-phase="0"]');
 assert.equal(await page.locator('#sixRefArrows .dirlabel').count(),0,'Reiniciar corrientes y nudos limpia los números');
 const freePoints=[[130,190],[350,105],[570,190],[255,225],[465,225],[370,355]];
 for(let i=0;i<6;i++){
  await tap(...freePoints[i]);await page.locator('#currentNumber').fill(String(i+1));await page.click('#currentNameForm button[type="submit"]');
  const position=await page.locator('#sixCurrentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
  assert(Math.hypot(position.x-freePoints[i][0],position.y-freePoints[i][1])<([0,2].includes(i)?10:2),'Posición de la flecha avanzada más próxima al clic: rama '+(i+1)+' '+JSON.stringify(position));
 }
 await assertBranchPlacement(true);await assertNoCurrentOverlap();
 await tap(570,300);assert.match(await page.locator('#currentPlacementNotice').textContent(),/ya tiene la corriente/);assert.equal(await page.locator('#currentNameDialog').isVisible(),false);
 await page.click('[data-reset-phase="0"]');
 await tap(130,105);await page.locator('#currentNumber').fill('123');assert.equal(await page.locator('#currentNumber').inputValue(),'12','Máximo dos cifras');
 await page.keyboard.press('Escape');await page.locator('#currentNameDialog').waitFor({state:'hidden'});
 await assignNumbers([11,22,33,44,55,66]);
 await selectSymbol('ansi');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);
 await selectSymbol('iec');await assertNoCurrentOverlap();
 assert.deepEqual(errors,[]);await context.close();console.log('OK: controles play/stop, pausa real, colores, checks verdes, despejes resaltados, acciones centradas, controles, parpadeos y expresiones; '+(mobile?'móvil':'escritorio')+'; movimiento '+reducedMotion);
}
// Edición y resolución inmediata: comprobar resultados físicos y conservación de valores.
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:430,height:932}:{width:1440,height:1100},isMobile:mobile,hasTouch:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 await page.route('**/wormhoff/',async route=>{
  const response=await route.fetch(),html=await response.text(),marker='  newGame();syncBoardActions();';
  assert(html.includes(marker),'Inicialización del circuito accesible');
  await route.fulfill({response,body:html.replace(marker,'  globalThis.wormhoffRouteTest={getBranches:()=>BRANCHES.map(b=>b.map(p=>({...p}))),getRoute:(loop,cw)=>createRoute(loop,cw)};\n'+marker)});
 });
 await page.goto('http://127.0.0.1:8767/wormhoff/');
 // DEMO conserva el estado y su comportamiento al cargar cualquier otro tipo.
 for(const enabled of [true,false]){
  if((await page.locator('#toggleDemo').getAttribute('aria-pressed')==='true')!==enabled)await page.click('#toggleDemo');
  for(const type of ['base','r73','fig237','r76']){
   await page.selectOption('#exerciseSelect',type);
   assert.equal(await page.locator('#toggleDemo').getAttribute('aria-pressed'),String(enabled),'Estado global al cargar '+type);
   assert.equal(await page.locator('#toggleDemo .demo-state').textContent(),enabled?'ON':'OFF');
   await page.locator('[data-current-branch="0"]').dispatchEvent('click');
   assert.equal(await page.locator('#currentNameDialog').isVisible(),!enabled,'Numeración según DEMO en '+type);
   if(enabled)assert.equal(await page.locator(type==='r76'?'#sixCurrentArrow0 .dirlabel':'#currentArrow0 .dirlabel').textContent(),'I₁');
   else await page.keyboard.press('Escape');await page.locator('#currentNameDialog').waitFor({state:'hidden'});
  }
 }
 await page.selectOption('#exerciseSelect','base');await page.click('#toggleDemo');
 const number=text=>Number(text.replace(/[−]/g,'-').replace(/\s*A$/,'').replace(',','.'));
 const assertResults=async(expected,six=false)=>{
  assert(await page.locator(six?'#advResultPanel':'#resultPanel').isVisible());
  const panel=(await page.locator(six?'#advResults strong':'#results strong').allTextContents()).map(number);
  const circuit=(await page.locator(six?'#sixRefArrows .dir-result':'#dirGraphics .dir-result').allTextContents()).map(number);
  assert.equal(panel.length,expected.length);assert.deepEqual(circuit,panel);
  panel.forEach((value,i)=>assert(Math.abs(value-expected[i])<=.000011,'Corriente '+i+': '+value+' frente a '+expected[i]));
  assert.match(await page.locator('#phaseHead').textContent(),/Fase 3 · Resolución/);
  assert.equal(await page.locator('#directMeshDirections [data-mesh-summary]').count(),six?3:2);
  const meshAppearance=await page.locator('#directMeshDirections [data-mesh-summary]').evaluateAll(nodes=>nodes.map(node=>{
   const name=node.querySelector('[data-mesh-name]'),check=node.querySelector('.mesh-complete circle'),turn=node.querySelector('[data-mesh-turn] text');
   return {name:name.textContent,titleY:Number(name.getAttribute('y')),checkY:Number(check.getAttribute('cy')),turnY:Number(turn.getAttribute('y')),x:Number(name.getAttribute('x')),turn:turn.textContent};
  }));
  assert.deepEqual(meshAppearance,six?[
   {name:'M1',titleY:139,checkY:160,turnY:204.92,x:247,turn:'↻'},
   {name:'M2',titleY:139,checkY:160,turnY:204.92,x:497,turn:'↻'},
   {name:'M3',titleY:259,checkY:278,turnY:326.92,x:350,turn:'↻'}
  ]:[
   {name:'MALLA 1',titleY:166,checkY:190,turnY:251.04,x:246,turn:'↻'},
   {name:'MALLA 2',titleY:166,checkY:190,turnY:251.04,x:445,turn:'↻'}
  ],'Nombre, check y giro en las posiciones del procedimiento guiado');
 };
 const edit=async(id,value)=>{
  await page.locator('[data-component-edit="'+id+'"]').click();assert(await page.locator('#componentValueDialog').isVisible());
  await page.locator('#componentValueInput').fill(value);await page.locator('#componentValueForm button[type="submit"]').click();
  assert.equal(await page.locator('#componentValueDialog').isVisible(),false);
 };
 await page.click('#solveDirect');await assertResults([5,1,4]);
 await page.locator('[data-component-edit="resistorElement0"]').click();await page.locator('#componentValueInput').fill('0');await page.locator('#componentValueForm button[type="submit"]').click();
 assert(await page.locator('#componentValueDialog').isVisible());assert.equal(await page.locator('#componentValueInput').getAttribute('aria-invalid'),'true');
 await page.click('#cancelComponentValue');await assertResults([5,1,4]);
 await edit('resistorElement0','4');await assertResults([3,0,3]);
 await edit('sourceElement0','0');await assertResults([-.6,-1.8,1.2]);
 assert.equal(await page.locator('[data-component-edit="sourceElement0"]').count(),1,'La fuente de cero voltios sigue siendo editable');
 await edit('sourceElement0','-6');await assertResults([-1.8,-2.4,.6]);
 await page.selectOption('#exerciseSelect','r73');await page.click('#solveDirect');await assertResults([8/11,-1/11,9/11]);
 await page.selectOption('#exerciseSelect','fig237');
 assert.equal(await page.locator('#exerciseSelect option:checked').textContent(),'Tipo 3','La figura 2.37 sustituye a la figura 4.51');
 assert.deepEqual(await page.locator('#staticCircuit .resistor-value').allTextContents(),['4Ω','3Ω','2Ω'],'Valores originales de la figura 2.37');
 assert.equal(await page.locator('#staticCircuit .component-source').count(),2,'La figura 2.37 tiene exactamente dos fuentes laterales');
 assert.equal(await page.locator('#staticCircuit .component-resistor').count(),3,'La figura 2.37 tiene tres resistencias');
 // Comprobar la posición del símbolo, no el getBBox del grupo con textos.
 // Los símbolos están dentro de grupos transformados: medir en coordenadas del SVG raíz.
 const geometry=await page.evaluate(()=>{
  const root=document.getElementById('circuit');
  const center=el=>{
   const b=el.getBBox(),p=root.createSVGPoint();p.x=b.x+b.width/2;p.y=b.y+b.height/2;
   const matrix=root.getScreenCTM().inverse().multiply(el.getScreenCTM());
   const c=p.matrixTransform(matrix);return {x:c.x,y:c.y};
  };
  return {
   resistors:[0,1,2].map(i=>center(document.querySelector('#resistorElement'+i+' .symbol'))),
   sources:[0,2].map(i=>center(document.querySelector('#sourceElement'+i+' .source-plate')))
  };
 });
 assert(Math.max(...geometry.resistors.map(r=>r.y))-Math.min(...geometry.resistors.map(r=>r.y))<1,'Resistencias de las tres ramas alineadas como en tipos 1 y 2: '+JSON.stringify(geometry));
 assert(geometry.resistors[0].x<geometry.resistors[1].x&&geometry.resistors[1].x<geometry.resistors[2].x,'Resistencias en ramas izquierda, central y derecha: '+JSON.stringify(geometry));
 assert(Math.abs(geometry.sources[0].y-geometry.sources[1].y)<1,'Fuentes alineadas como en tipos 1 y 2: '+JSON.stringify(geometry));
 const routeCheck=await page.evaluate(()=>{
  const {getBranches,getRoute}=wormhoffRouteTest,branches=getBranches();
  return {resistors:branches.map(b=>b.filter(p=>p.component==='resistor').length),sources:branches.map(b=>b.filter(p=>p.component==='source').length),loops:[0,1].flatMap(i=>[true,false].map(cw=>getRoute(i,cw)))};
 });
 assert.deepEqual(routeCheck.resistors,[1,1,1],'Una resistencia en cada rama');
 assert.deepEqual(routeCheck.sources,[1,0,1],'Fuentes solamente en las ramas exteriores');
 for(const route of routeCheck.loops){
  assert.equal(route.legs.length,2);
  const a=route.legs[0].points.at(-1),b=route.legs[1].points[0];
  assert.equal(a.x,b.x,'Sin salto horizontal entre ramas');
  assert.equal(a.y,b.y,'Sin salto vertical entre ramas');
  assert.equal(route.legs[1].points.at(-1).y,360,'La malla termina en el nudo inferior');
 }
 await page.click('#solveDirect');await assertResults([5,0,5]);
 assert.equal(await page.locator('#componentValueDialog').isVisible(),false);
 await edit('resistorElement0','5');await assertResults([130/31,-10/31,140/31]);
 await page.selectOption('#exerciseSelect','r73');await page.selectOption('#exerciseSelect','fig237');
 assert.deepEqual(await page.locator('#staticCircuit .resistor-value').allTextContents(),['4Ω','3Ω','2Ω'],'Se restauran los valores originales al volver al tipo 3');
 await page.selectOption('#exerciseSelect','r76');
 const sourceBackgrounds=await page.locator('#sixSymbols .source-halo').evaluateAll(nodes=>nodes.map(rect=>{
  const x=Number(rect.getAttribute('x'))+Number(rect.getAttribute('width'))/2,y=Number(rect.getAttribute('y'))+Number(rect.getAttribute('height'))/2;
  const branch=rect.parentElement.id.match(/^sixCmp(\d)U$/)[1],wire=document.querySelector('[data-wire-branch="'+branch+'"]');
  return {fill:getComputedStyle(rect).fill,wireAcrossSource:wire.isPointInStroke(new DOMPoint(x,y))};
 }));
 assert.equal(sourceBackgrounds.length,5);
 assert(sourceBackgrounds.every(s=>s.fill==='rgba(0, 0, 0, 0)'&&!s.wireAcrossSource),'Fuentes sin fondo ni conductor que cruce entre sus placas');
 const originalResistors=await page.locator('#componentValueTargets [data-component-edit$="R"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label')));
 for(const i of [0,2,3,4,5])await edit('sixCmp'+i+'U','0');
 await page.click('#solveDirect');await assertResults(Array(6).fill(0),true);
 assert.deepEqual(await page.locator('#componentValueTargets [data-component-edit$="R"]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-label'))),originalResistors,'Resolver y editar no regeneran las resistencias');
 await edit('sixCmp0R','2,5');await assertResults(Array(6).fill(0),true);
 assert.match(await page.locator('#sixCmp0R .component-value').textContent(),/2,5Ω/);
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'La cabecera con Resolver cabe en la pantalla');
 assert.deepEqual(errors,[]);await context.close();
 console.log('OK: edición de valores, cero y polaridad negativa, cuatro tipos, recálculo y resultados directos en circuito y resolución; '+(mobile?'móvil':'escritorio'));
}
}finally{await browser.close()}

