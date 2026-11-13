import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
for(const mobile of [false,true]){
 const context=await browser.newContext({viewport:mobile?{width:430,height:932}:{width:1440,height:1100},hasTouch:mobile,isMobile:mobile});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8767/wormhoff/');
 const tap=async(x,y)=>{
  await page.locator('#circuit').scrollIntoViewIfNeeded();
  const p=await page.locator('#circuit').evaluate((svg,[x,y])=>{const p=new DOMPoint(x,y).matrixTransform(svg.getScreenCTM());return {x:p.x,y:p.y}},[x,y]);
  if(mobile)await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);
 };
 const arrow=async s=>page.locator(s+' .direction').getAttribute('d');
 await page.selectOption('#exerciseSelect','base');
 assert.equal(await page.locator('#dirButtons,#advDirections,#loopButtons,#advLoopButtons,#cw,#ccw,#advCw,#advCcw').count(),0);
 for(const [i,x,y] of [[0,249,74],[1,345,103],[2,454,74]]){
  const sel='#currentArrow'+i,before=await arrow(sel);await tap(x,y);assert.notEqual(await arrow(sel),before,'Invertir corriente '+i);await tap(x,y);assert.equal(await arrow(sel),before);
 }
 await page.click('#confirmDirs');await page.click('#goLoops');
 await tap(490,290);assert.equal(await page.locator('#loopHighlight').getAttribute('x'),'355');
 await tap(445,164);assert.match(await page.locator('#boardState').innerText(),/antihorario/);
 await tap(490,290);assert.match(await page.locator('#boardState').innerText(),/antihorario/,'Pulsar la malla activa conserva el progreso');
 await page.locator('[data-mesh-turn="1"]').focus();await page.locator('[data-mesh-turn="1"]').press('Space');
 assert.match(await page.locator('#boardState').innerText(),/horario/);assert.equal(await page.locator('#advance').isEnabled(),true,'Espacio cambia el giro sin iniciar el recorrido');
 await tap(210,290);assert.equal(await page.locator('#loopHighlight').getAttribute('x'),'156');
 await page.click('#advance');await tap(490,290);assert.equal(await page.locator('#loopHighlight').getAttribute('x'),'156','No cambiar malla durante el recorrido');
 await page.selectOption('#exerciseSelect','r76');
 for(const [i,x,y] of [[0,174,74],[1,350,111],[2,395,74],[3,159,225],[4,379,225],[5,199,355]]){
  const sel='#sixCurrentArrow'+i,before=await arrow(sel);await tap(x,y);assert.notEqual(await arrow(sel),before,'Invertir corriente avanzada '+i);await tap(x,y);assert.equal(await arrow(sel),before);
 }
 await page.click('#advStart');
 for(const eq of ['I1=I2+I3','I2+I4=I5','I1+I4+I6=0']){
  await page.locator('#sixNodeChallenge .kcl-answer').fill(eq);await page.click('#sixNodeChallenge .kcl-check');
 }
 await tap(460,290);assert.match(await page.locator('#advLap').innerText(),/Malla 3/);
 await tap(352,294);assert.match(await page.locator('#sixLoops [data-mesh-turn="2"]').innerText(),/↺/);
 await tap(460,290);assert.match(await page.locator('#sixLoops [data-mesh-turn="2"]').innerText(),/↺/);
 await tap(477,130);assert.match(await page.locator('#advLap').innerText(),/Malla 2/);assert.match(await page.locator('#sixLoops [data-mesh-turn="1"]').innerText(),/↺/);
 await page.click('#advNext');await tap(300,190);assert.match(await page.locator('#advLap').innerText(),/Malla 2/,'No cambiar malla avanzada durante el recorrido');
 assert.deepEqual(errors,[]);await context.close();console.log('OK: controles directos, tres y seis ramas, '+(mobile?'pantalla táctil':'ratón y teclado'));
}
}finally{await browser.close()}
