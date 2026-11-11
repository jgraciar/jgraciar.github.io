import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950},locale:'en-GB'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  for(const [k,v]of Object.entries({labStartConfigured:'1',labLanguageMode:'manual',language:'en',showPropsOnClick:'false',showOhm:'false'}))localStorage.setItem(k,v);
  const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){const q=window.grabRequest;if(q&&text===q.text&&this.canvas.matches('.canvasWrapper > canvas')){const m=this.getTransform(),r=this.canvas.getBoundingClientRect();window.grabPoint={x:r.left+(m.a*q.x+m.c*q.y+m.e)*r.width/this.canvas.width,y:r.top+(m.b*q.x+m.d*q.y+m.f)*r.height/this.canvas.height};}return fill.call(this,text,x,y,...rest);};
 });
 await page.goto('http://127.0.0.1:8767/circuitjgr.html');await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 const xml='<cir f="0" ts="0.00001" ic="125" cb="50" pb="50" vr="5" mts="5e-11"><r x="480 160 624 160" f="0" r="1000"/><r x="480 240 624 240" f="0" r="2000"/><r x="160 320 304 320" f="0" r="3000"/></cir>';
 await page.evaluate(xml=>{window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit(xml,false);},xml);
 async function popup(n){
  await page.evaluate(n=>{window.grabPoint=null;window.grabRequest={text:n+'k',x:n===3?232:552,y:80+80*n};},n);
  await page.waitForFunction(()=>!!window.grabPoint);const p=await page.evaluate(()=>window.grabPoint);await page.mouse.click(p.x,p.y,{button:'right'});
 }
 const count=()=>page.evaluate(()=>window.CircuitJS1.getElements().length);
 await popup(1);await page.getByText('Delete',{exact:true}).filter({visible:true}).click();assert.equal(await count(),2,'context Delete removes unselected target after leaving canvas');
 await page.keyboard.press('Control+z');await page.waitForFunction(()=>window.CircuitJS1.getElements().length===3);assert.equal(await count(),3,'one Undo restores deleted component');
 console.log('OK 5.0.5: contextual Delete targets the component; one Undo restores it');
 await popup(1);await page.getByText('View in New Scope',{exact:true}).filter({visible:true}).click();
 await popup(2);await page.getByText('View in New Undocked Scope',{exact:true}).filter({visible:true}).click();
 await popup(3);const add=page.getByText('Add to Existing Scope',{exact:true}).filter({visible:true});await add.hover();
 const item=page.getByText(/^Undocked Scope 1(?: \(|$)/).filter({visible:true});await item.waitFor({state:'visible'});assert(await page.getByText(/^Scope 1(?: \(|$)/).filter({visible:true}).isVisible(),'docked and floating scopes are both listed');await item.click();
 const result=await page.evaluate(()=>{const d=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');return Array.from(d.querySelectorAll('o')).map(o=>({en:o.getAttribute('en'),plots:Array.from(o.querySelectorAll('p')).map(p=>p.getAttribute('e'))}));});
 assert(result.some(o=>o.plots.includes('2')),'selected floating scope contains third resistor plot: '+JSON.stringify(result));
 assert.deepEqual(errors,[]);console.log('OK 5.0.5: submenu lists docked and floating scopes and adds signal to the chosen scope');
}finally{await browser.close();}
