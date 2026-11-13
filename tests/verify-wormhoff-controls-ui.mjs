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
algebraContext.drawMeshTargets=()=>{};algebraContext.bindMeshTurns=()=>{};algebraContext.meshTurnIcon=()=>'';
vm.runInContext(
 gameSource.slice(gameSource.indexOf('  function meshCompleteMark('),gameSource.indexOf('  function setTransportState('))+
 gameSource.slice(gameSource.indexOf('  function updateLoopsArrows('),gameSource.indexOf('  const fmt='))+
 gameSource.slice(gameSource.indexOf('  function sixMeshArrows('),gameSource.indexOf('  function sixText('))+
 ';updateLoopsArrows();sixMeshArrows();',algebraContext);
const completedMarkup=meshElements.loopArrows.innerHTML+meshElements.sixLoops.innerHTML;
assert(completedMarkup.includes('data-mesh-complete="0"'));assert(completedMarkup.includes('data-mesh-complete="1"'));
assert(completedMarkup.includes('stroke="#8df09c"'));assert(!/FINALIZADA|HECHA/.test(completedMarkup));
assert(isolationMarkup.includes('I₂ = 4 A'));assert(isolationMarkup.includes('I₂ = 1,5 A'));
const browser=await chromium.launch({headless:true});
let animationReference=null;
try{
for(const [mobile,reducedMotion] of [[false,'no-preference'],[true,'no-preference'],[false,'reduce'],[true,'reduce']]){
 const context=await browser.newContext({viewport:mobile?{width:430,height:932}:{width:1440,height:1100},hasTouch:mobile,isMobile:mobile,reducedMotion});
 const page=await context.newPage(),errors=[];page.on('console',m=>{if(m.type()==='warning')console.log(m.text())});page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.stack)});
 await page.goto('http://127.0.0.1:8767/wormhoff/');
 const textControls=page.locator('#circuitCard [data-text-controls="circuit"]'),equationControls=page.locator('#equationsCard [data-text-controls="equations"]');
 const sourceText=page.locator('#circuit .component-value').first(),equationText=page.locator('#equationsCard .law-formula').first();
 const originalSizes=await Promise.all([sourceText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),equationText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize))]);
 await textControls.locator('[data-text-change="1"]').click();
 assert((await sourceText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)))>originalSizes[0]+1,'Amplía texto de la columna izquierda');
 assert.equal(await equationText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)),originalSizes[1],'Escalas independientes');
 await textControls.locator('[data-text-change="-1"]').click();
 await equationControls.locator('[data-text-change="1"]').click();
 assert((await equationText.evaluate(el=>parseFloat(getComputedStyle(el).fontSize)))>originalSizes[1]+1,'Amplía texto de la columna derecha');
 await equationControls.locator('[data-text-change="-1"]').click();
 const circuitCard=await page.locator('#circuitCard').boundingBox(),equationsCard=await page.locator('#equationsCard').boundingBox();
 if(mobile)assert(equationsCard.y>=circuitCard.y+circuitCard.height-1,'Ecuaciones debajo en móvil');
 else assert(equationsCard.x>=circuitCard.x+circuitCard.width-1,'Ecuaciones a la derecha en escritorio');
 const svgWidth=await page.locator('#circuit').boundingBox();
 assert(Math.abs(svgWidth.width-circuitCard.width+2)<2,'El circuito ocupa todo el ancho interior de su columna');
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
  if(transport)assert(actions.y+actions.height<=diagram.y+1,'Reproducción encima del circuito');
  else assert(actions.y>=diagram.y+diagram.height-1,'Navegación debajo del esquema');
  assert(Math.abs(actions.x+actions.width/2-diagram.x-diagram.width/2)<2,'Acciones centradas');
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
   const overlap=(a,b)=>a.x<b.x+b.w-.5&&a.x+a.w>b.x+.5&&a.y<b.y+b.h-.5&&a.y+a.h>b.y+.5;
   const fixed=[...svg.querySelectorAll('#staticCircuit .symbol,#staticCircuit .source-halo,#staticCircuit .component-value,#staticCircuit .resistor-name,#staticCircuit .txt,#staticCircuit .txtsm,#staticCircuit .nod')].filter(visible).map(rect);
   const current=[...svg.querySelectorAll('#dirGraphics .dirlabel,#dirGraphics .dir-result,#dirGraphics .direction,#sixRefArrows .dirlabel,#sixRefArrows .dir-result,#sixRefArrows .direction')].filter(visible);
   return current.flatMap((el,i)=>{const r=rect(el);return fixed.some(b=>overlap(r,b))||current.slice(0,i).some(other=>overlap(r,rect(other)))?[{id:el.parentElement.id,text:el.textContent,rect:r,transform:el.getAttribute('transform'),fixed:fixed.filter(b=>overlap(r,b)),currents:current.slice(0,i).filter(other=>overlap(r,rect(other))).map(other=>({id:other.parentElement.id,text:other.textContent,rect:rect(other)}))}]:[];});
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
 };
 assert.equal(await page.locator('#stagebar .phase-reset svg').count(),5);
 assert.equal(await page.locator('[data-phase="1"]').isDisabled(),true);
 await page.evaluate(()=>{const spacer=document.createElement('div');spacer.id='scrollProbe';spacer.style.height='1500px';document.body.append(spacer);window.scrollTo(0,500);});
 assert(Math.abs((await page.locator('#stagebar').boundingBox()).y)<2,'Fases fijas al desplazarse');
 await page.evaluate(()=>{document.getElementById('scrollProbe').remove();window.scrollTo(0,0);});
 const tap=async(x,y)=>{
  await page.locator('#circuit').scrollIntoViewIfNeeded();
  const p=await page.locator('#circuit').evaluate((svg,[x,y])=>{const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y}},[x,y]);
  if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
 };
 const pauseResume=async id=>{
  const button=page.locator('#'+id);
  await page.waitForFunction(id=>document.getElementById(id).dataset.state==='running',id);
  await page.waitForTimeout(80);
  const runningColor=await button.evaluate(el=>getComputedStyle(el).backgroundColor);
  await button.click();assert.equal(await button.getAttribute('data-state'),'paused');
  assert(await button.locator('.transport-play').isVisible());assert.equal(await button.locator('.transport-stop').isVisible(),false);
  const position=await page.locator('#hero').getAttribute('transform');
  await page.selectOption('#symbolStandard','ansi');assert.equal(await button.getAttribute('data-state'),'paused');assert.equal(await page.locator('#hero').getAttribute('transform'),position);
  await page.selectOption('#symbolStandard','iec');
  await page.locator('#hero').dispatchEvent('pointerdown',{pointerId:71,isPrimary:true,pointerType:'touch',button:0});
  assert.equal(await page.locator('#heroBody').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  assert.equal(await page.locator('#heroTail').evaluate(el=>getComputedStyle(el).visibility),'hidden');
  assert(await page.locator('#hero .hero-segment').evaluateAll(nodes=>nodes.every(el=>getComputedStyle(el).visibility==='hidden')));
  await page.locator('body').dispatchEvent('pointerup',{pointerId:71,isPrimary:true,pointerType:'touch',button:0});
  assert.equal(await page.locator('#heroBody').evaluate(el=>getComputedStyle(el).visibility),'visible');
  assert.equal(await page.locator('#heroTail').evaluate(el=>getComputedStyle(el).visibility),'visible');
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
  for(let i=0;i<numbers.length;i++){await tap(...coords[i]);await page.locator('#currentNumber').fill(String(numbers[i]));await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,await page.locator('#currentNumberError').textContent());}
 };
 await page.selectOption('#exerciseSelect','c75');
 assert.equal(await page.locator('#confirmDirs').isDisabled(),true);
 await tap(146,310);assert(await page.locator('[data-current-branch="0"]').evaluate(el=>getComputedStyle(el).outlineStyle==='none'));assert((await page.locator('#branchSelection').getAttribute('d')).length>0);assert(await page.locator('#currentNameDialog').isVisible(),JSON.stringify(await page.evaluate(()=>({scroll:[scrollX,scrollY],bar:document.querySelector('#stagebar').getBoundingClientRect().toJSON(),circuit:document.querySelector('#circuit').getBoundingClientRect().toJSON(),width:document.documentElement.scrollWidth}))));await page.locator('#currentNumber').fill('7');await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,await page.locator('#currentNumberError').textContent());
 await tap(345,310);await page.locator('#currentNumber').fill('7');await page.click('#currentNameForm button[type="submit"]');
 assert.match(await page.locator('#currentNumberError').textContent(),/ya está asignado/);assert(await page.locator('#currentNameDialog').isVisible());
 await page.locator('#currentNumber').fill('12');await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,await page.locator('#currentNumberError').textContent());
 await tap(544,310);await page.locator('#currentNumber').fill('3');await page.click('#currentNameForm button[type="submit"]');assert.deepEqual(errors,[]);assert.equal(await page.locator('#currentNameDialog').isVisible(),false,await page.locator('#currentNumberError').textContent());
 for(const [i,x] of [146,345,544].entries()){
  const position=await page.locator('#currentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
  assert(Math.abs(position.x-x)<2&&Math.abs(position.y-310)<2,'Flecha sobre la rama en el punto pulsado');
 }
 await tap(146,175);assert.equal(await page.locator('#currentNameDialog').isVisible(),false);
 assert.match(await page.locator('#currentPlacementNotice').textContent(),/ya tiene la corriente I₇/);
 assert.equal(await page.locator('#dirGraphics [data-current-index]').count(),3,'No duplica la corriente de una rama ocupada');
 assert.equal(await page.locator('#currentArrow0 .dirlabel').textContent(),'I₇');assert.equal(await page.locator('#currentArrow1 .dirlabel').textContent(),'I₁₂');
 await page.selectOption('#symbolStandard','ansi');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);assert.equal(await page.locator('#circuit .resistor-ansi .symbol:visible').count(),3);assert.equal(await page.locator('#circuit .resistor-iec .symbol:visible').count(),0);
 for(const resistor of await page.locator('#circuit .component-resistor').all()){
  assert(await resistor.evaluate(el=>{
   const symbol=el.querySelector('.resistor-ansi .symbol'),value=el.querySelector('.resistor-value'),label=el.querySelector('.resistor-ansi .resistor-name');
   const center=new DOMPoint(0,0).matrixTransform(symbol.getScreenCTM()),anchor=new DOMPoint(Number(value.getAttribute('x')),Number(value.getAttribute('y'))).matrixTransform(value.getScreenCTM());
   return Math.abs(center.y-anchor.y)<1&&Number(label.getAttribute('x'))<Number(value.getAttribute('x'));
  }),'Valor centrado en altura y nombre a la izquierda');
 }
 await page.selectOption('#symbolStandard','iec');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);assert.equal(await page.locator('#circuit .resistor-iec .symbol:visible').count(),3);
 await page.click('#confirmDirs');await page.locator('#nodeChallenge .kcl-answer').fill('I7=I12+I3');await page.click('#nodeChallenge .kcl-check');
 assert.match(await page.locator('#nodeEq').textContent(),/I₇.*I₁₂.*I₃/);
 assert(!/\bKCL\b|\bKVL\b/.test(await page.locator('body').innerText()));
 assert(parseFloat(await page.locator('#nodeEq').evaluate(el=>getComputedStyle(el).fontSize))>=18);
 const arrow=async s=>page.locator(s+' .direction').getAttribute('d');
 await page.selectOption('#exerciseSelect','c71');await assignNumbers([1,2,3]);
 await page.locator('[data-reduce="2"]').fill('12');await page.click('#checkReductions');await page.click('#confirmDirs');
 await page.locator('[data-kcl="0"]').selectOption('1');
 const term=page.locator('#nodeChallenge .kcl-live-term').first();
 const blink=await term.evaluate(el=>{const s=getComputedStyle(el);return {name:s.animationName,duration:s.animationDuration,count:s.animationIterationCount}});
 assert.equal(blink.name,'kclTermBlink');assert.equal(blink.count,'3');
 await page.waitForFunction(()=>!document.querySelector('#nodeChallenge .blink-three'));
 assert.equal(await term.evaluate(el=>getComputedStyle(el).opacity),'1');
 await page.selectOption('#exerciseSelect','base');await assignNumbers([1,2,3]);
 assert.equal(await page.locator('#resetLoop svg').count(),1);assert.equal(await page.locator('#resetLoop').getAttribute('aria-label'),'Repetir recorrido');
 assert.equal(await page.locator('#dirButtons,#advDirections,#loopButtons,#advLoopButtons,#cw,#ccw,#advCw,#advCcw').count(),0);
 for(const i of [0,1,2]){
  const {x,y}=await page.locator('#currentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
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
 await page.selectOption('#exerciseSelect','r76');await assignNumbers([1,2,3,4,5,6]);
 for(const i of [0,1,2,3,4,5]){
  const {x,y}=await page.locator('#sixCurrentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
  const sel='#sixCurrentArrow'+i,before=await arrow(sel);await tap(x,y);assert.notEqual(await arrow(sel),before,'Invertir corriente avanzada '+i);await tap(x,y);assert.equal(await arrow(sel),before);
 }
 await page.selectOption('#symbolStandard','ansi');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);
 for(const resistor of await page.locator('#circuit .component-resistor').all()){
  assert(await resistor.evaluate(el=>{
   const symbol=el.querySelector('.resistor-ansi .symbol'),value=el.querySelector('.resistor-value');
   const center=new DOMPoint(0,0).matrixTransform(symbol.getScreenCTM()),anchor=new DOMPoint(Number(value.getAttribute('x')),Number(value.getAttribute('y'))).matrixTransform(value.getScreenCTM());
   return value.getAttribute('text-anchor')==='middle'?Math.abs(center.x-anchor.x)<1:Math.abs(center.y-anchor.y)<1;
  }),'Valor centrado en resistencia horizontal o vertical');
 }
 await page.selectOption('#symbolStandard','iec');
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
 await pauseResume('advNext');
 await page.locator('#sixTermChallenge .term-answer').waitFor({state:'visible'});
 await page.locator('#sixTermChallenge .term-answer').fill('5I5');await page.click('#sixTermChallenge .term-check');
 await page.locator('#equationsCard #advBoardEquations [data-equation="E5"]').waitFor({state:'visible'});
 assert.match(await page.locator('#equationsCard #advBoardEquations [data-equation="E5"]').textContent(),/E5:/);
 await page.click('[data-reset-phase="2"]');
 assert.equal(await page.locator('#advNext').getAttribute('data-state'),'ready');
 assert.equal(await page.locator('#advBoardRows [data-equation]').count(),0,'Reiniciar mallas borra los términos');
 assert.equal(await page.locator('#advKCLtext [data-equation]').count(),3,'Conserva los nudos anteriores');
 await page.click('[data-phase="1"]');
 assert(await page.locator('#sixNodeChallenge .kcl-answer').isVisible(),'Volver a nudos');
 assert.equal(await page.locator('[data-phase="2"]').isDisabled(),true);
 await page.click('[data-reset-phase="1"]');
 assert.equal(await page.locator('#advKCLtext [data-equation]').count(),0);
 await page.click('[data-phase="0"]');
 assert.equal(await page.locator('#sixRefArrows .dirlabel').count(),6,'Volver conserva la numeración');
 await page.click('[data-reset-phase="0"]');
 assert.equal(await page.locator('#sixRefArrows .dirlabel').count(),0,'Reiniciar corrientes limpia los números');
 const freePoints=[[130,190],[350,190],[535,74],[255,225],[470,225],[370,355]];
 for(let i=0;i<6;i++){
  await tap(...freePoints[i]);await page.locator('#currentNumber').fill(String(i+1));await page.click('#currentNameForm button[type="submit"]');
  const position=await page.locator('#sixCurrentArrow'+i).evaluate(el=>({x:Number(el.dataset.arrowX),y:Number(el.dataset.arrowY)}));
  assert(Math.hypot(position.x-freePoints[i][0],position.y-freePoints[i][1])<2,'Posición de la flecha avanzada más próxima al clic');
 }
 await assertBranchPlacement(true);await assertNoCurrentOverlap();
 await tap(570,300);assert.match(await page.locator('#currentPlacementNotice').textContent(),/ya tiene la corriente/);assert.equal(await page.locator('#currentNameDialog').isVisible(),false);
 await page.click('[data-reset-phase="0"]');
 await assignNumbers([123456789012345,234567890123456,345678901234567,456789012345678,567890123456789,678901234567890]);
 await page.selectOption('#symbolStandard','ansi');await assertNoCurrentOverlap();await assertBranchPlacement((await page.locator('#sixRefArrows').count())>0);
 await page.selectOption('#symbolStandard','iec');await assertNoCurrentOverlap();
 assert.deepEqual(errors,[]);await context.close();console.log('OK: controles play/stop, pausa real, colores, checks verdes, despejes resaltados, acciones centradas, controles, parpadeos y expresiones; '+(mobile?'móvil':'escritorio')+'; movimiento '+reducedMotion);
}
const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage(),errors=[];
page.on('pageerror',e=>{errors.push(e.message);console.error('PAGE ERROR:',e.stack)});
await page.addInitScript(()=>{
 const now=performance.now.bind(performance),raf=window.requestAnimationFrame.bind(window);
 performance.now=()=>now()*80;window.requestAnimationFrame=callback=>raf(time=>callback(time*80));
});
await page.goto('http://127.0.0.1:8767/wormhoff/');
for(const [i,x] of [146,345,544].entries()){
 await page.locator(`[data-current-branch="${i}"]`).dispatchEvent('click');
 await page.locator('#currentNumber').fill(String(i+1));await page.click('#currentNameForm button[type="submit"]');
}
await page.click('#confirmDirs');await page.click('#goLoops');
for(let mesh=0;mesh<2;mesh++){
 await page.locator(`[data-mesh="${mesh}"]`).dispatchEvent('click');
 for(let turn=0;turn<250;turn++){
  if(await page.locator('#advance').getAttribute('data-state')==='complete')break;
  const state=await page.locator('#advance').getAttribute('data-state');
  if(['ready','waiting'].includes(state))await page.click('#advance');
  await page.waitForTimeout(35);
 }
 assert.equal(await page.locator('#advance').getAttribute('data-state'),'complete','Malla terminada');
}
await page.click('#goMatrix');await page.click('#fillMatrix');await page.click('#verifyMatrix');await page.click('#goSolve');
await page.click('#nextStep');await page.click('[data-reset-phase="4"]');
assert.equal(await page.locator('#resultPanel').isVisible(),false);
await page.click('[data-phase="3"]');
assert(await page.locator('#matrixInputs input').evaluateAll(nodes=>nodes.every(el=>el.value!=='')),'Volver a matriz conserva sus valores');
await page.click('[data-reset-phase="3"]');
assert(await page.locator('#matrixInputs input').evaluateAll(nodes=>nodes.every(el=>el.value==='')),'Reiniciar matriz vacía las casillas');
assert.equal(await page.locator('#equationsCard [data-equation]:visible').count(),3,'Conserva las ecuaciones previas');
await page.click('[data-phase="2"]');assert.equal(await page.locator('#loopArrows [data-mesh-complete]').count(),2);
await page.click('[data-reset-phase="2"]');assert.equal(await page.locator('#loopArrows [data-mesh-complete]').count(),0);
await page.click('#advance');await page.waitForFunction(()=>document.getElementById('advance').dataset.state==='running');
await page.click('[data-phase="1"]');const position=await page.locator('#hero').getAttribute('transform');await page.waitForTimeout(100);
assert.equal(await page.locator('#hero').getAttribute('transform'),position,'Retroceder cancela la animación');
await page.click('[data-reset-phase="1"]');assert(await page.locator('#goLoops').isVisible());
await page.click('[data-phase="0"]');assert.equal(await page.locator('#dirGraphics .dirlabel').count(),3);
await page.click('[data-reset-phase="0"]');assert.equal(await page.locator('#dirGraphics .dirlabel').count(),0);
assert.deepEqual(errors,[]);await context.close();console.log('OK: retroceso y reinicio en las cinco fases, matriz y cancelación del recorrido');
}finally{await browser.close()}
