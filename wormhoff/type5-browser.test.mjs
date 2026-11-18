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
 await page.waitForTimeout(100);
 const result=await shadow.locator('#result').textContent();
 assert.match(result,/Corrientes de malla/);
 assert.match(result,/Potencia disipada/);
 assert.equal(await shadow.locator('#type5SolutionOverlay text').count(),5);
 await page.locator('#exerciseSelect').selectOption('base');
 assert.equal(await page.locator('#gameLayout').isVisible(),true);
 await page.locator('#exerciseSelect').selectOption('type5-3m5r3u');
 assert.equal(await page.locator('#stagebar').isVisible(),true);
 assert.deepEqual(errors,[],'No uncaught browser errors');
 console.log('Type 5 browser integration smoke test passed');
}finally{
 await browser.close();
 server.kill();
}
