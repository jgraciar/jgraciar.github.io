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
 await page.locator('#exerciseSelect').selectOption('type5-3m5r3u');
 await page.waitForFunction(()=>Boolean(document.querySelector('#photoIntegratedView')?.__wormhoffType5));
 assert.equal(await page.locator('#stagebar').isVisible(),true,'main stagebar must be visible');
 assert.equal(await page.locator('#gameLayout').isVisible(),false,'previous circuit must be hidden');
 const shadow=page.locator('#photoIntegratedView');
 assert.equal(await shadow.locator('#toggleDemo').isVisible(),false,'duplicate DEMO control must be hidden');
 await page.locator('#randomizeValues').click();
 await page.locator('#solveDirect').click();
 await page.waitForTimeout(200);
 const result=await shadow.locator('#result').textContent();
 assert.match(result,/Corrientes de malla/);
 assert.match(result,/Potencia disipada/);
 assert.equal(await shadow.locator('#type5SolutionOverlay text').count(),5);
 await page.locator('#exerciseSelect').selectOption('base');
 assert.equal(await page.locator('#gameLayout').isVisible(),true);
 await page.locator('#exerciseSelect').selectOption('type5-3m5r3u');
 assert.equal(await page.locator('#stagebar').isVisible(),true);

 // Recorrido completo jugable con DEMO desactivado.
 await page.evaluate(()=>localStorage.setItem('wormhoff.demo','false'));
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#exerciseSelect').selectOption('type5-3m5r3u');
 await page.waitForFunction(()=>Boolean(document.querySelector('#photoIntegratedView')?.__wormhoffType5));
 const game=page.locator('#photoIntegratedView');
 await game.locator('#guideNext').click();
 await game.locator('[data-node="A"]').click();
 await game.locator('[data-node="C"]').click();
 for(const answers of [['Entra','Sale','Sale'],['Entra','Sale','Sale']]){
   for(let i=0;i<3;i++)await game.locator('#kclTerms p').nth(i).getByRole('button',{name:answers[i]}).click();
   await game.locator('#kclCheck').click();
 }
 assert.equal(await game.locator('#guideNext').isDisabled(),false,'KCL accepted');
 await game.locator('#guideNext').click();
 for(const row of [[6,-4,0,10],[-4,15,-6,12],[0,-6,9,-3]]){
   const inputs=game.locator('#equationInputs input');
   for(let j=0;j<4;j++)await inputs.nth(j).fill(String(row[j]));
   await game.locator('#checkEquation').click();
   assert.equal(await game.locator('#guideNext').isDisabled(),false,'KVL accepted');
   await game.locator('#guideNext').click();
 }
 await game.locator('#guideNext').click();
 assert.match(await game.locator('#result').textContent(),/Corrientes de malla/);
 assert.equal(await game.locator('#hero.hero-victory').count(),1,'original worm victory');
  assert.deepEqual(errors,[],'No uncaught browser errors');
 console.log('Type 5 browser integration smoke test passed');
}finally{
 await browser.close();
 server.kill();
}
