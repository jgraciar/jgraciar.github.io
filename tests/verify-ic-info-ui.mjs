import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {digitalICs,digitalICParts,inputPins,outputPins} from '../scripts/LabDigitalIC.ts';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
try{
 const page=await browser.newPage({viewport:{width:1500,height:950},locale:'es-ES'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const fill=CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText=function(text,x,y,...rest){
   const request=window.icGrabRequest;
   if(request&&text===request.text&&this.canvas.matches('.canvasWrapper > canvas')){
    const m=this.getTransform(),r=this.canvas.getBoundingClientRect();window.icGrab={x:r.left+(m.a*request.x+m.c*request.y+m.e)*r.width/this.canvas.width,y:r.top+(m.b*request.x+m.d*request.y+m.f)*r.height/this.canvas.height};
   }return fill.call(this,text,x,y,...rest);
  };
 });
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html');await page.locator('#lab-start-accept').click({timeout:30000});await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 const layout=()=>page.evaluate(()=>{
  const xml=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),'application/xml');return Array.from(xml.documentElement.children).map(el=>[el.tagName,el.getAttribute('x')]);
 });
 const advance=async()=>{
  await page.evaluate(()=>{const api=window.CircuitJS1,target=api.getTime()+.001;window.icAdvanced=false;api.ontimestep=()=>{if(api.getTime()>=target){api.setSimRunning(false);api.ontimestep=null;window.icAdvanced=true;}};api.setSimRunning(true);});
  await page.waitForFunction(()=>window.icAdvanced,null,{timeout:20000});
 };
 const head='<cir f="0" ts="0.00001" ic="125" cb="50" pb="50" vr="5" mts="5e-11">';
 function circuit(part,external=false){
  const d=digitalICs[part],pos=p=>p<=d.pins/2?[480,160+16*p,-1]:[640,160+16*(d.pins-p+1),1],nodes=[`<IC${part} x="480 160 624 160" f="1"/>`];
  const [vx,vy,vs]=pos(d.vcc),[gx,gy,gs]=pos(d.gnd);nodes.push(`<R x="${vx} ${vy} ${vx+32*vs} ${vy}" f="0" wf="0" maxv="5"/>`,`<g x="${gx} ${gy} ${gx+32*gs} ${gy}" f="0"/>`);
  for(const p of inputPins(d)){const [x,y,s]=pos(p);
   if(d.msi?.bidir?.includes(p)){nodes.push(`<r x="${x} ${y} ${x+48*s} ${y}" f="0" r="10000"/>`,`<R x="${x+48*s} ${y} ${x+80*s} ${y}" f="0" wf="0" maxv="5"/>`);continue;}
   nodes.push(external&&p===1?`<ExtVoltage x="${x} ${y} ${x+32*s} ${y}" f="0" nm="ic-input"/>`:`<L x="${x} ${y} ${x+32*s} ${y}" f="2" p="1" key="${String.fromCharCode(96+p)}"/>`);
  }
  for(const p of outputPins(d)){if(d.msi?.bidir?.includes(p))continue;const [x,y,s]=pos(p),end=x+80*s;nodes.push(`<r x="${x} ${y} ${end} ${y}" f="0" r="10000"/>`,d.msi?.openCollector?.includes(p)?`<R x="${end} ${y} ${end+16*s} ${y}" f="0" wf="0" maxv="5"/>`:`<g x="${end} ${y} ${end+16*s} ${y}" f="0"/>`);}
  return head+nodes.join('')+'</cir>';
 }
 async function load(xml,text,x,y,run=true){
  await page.evaluate(({xml,text,x,y})=>{window.icGrab=null;window.icGrabRequest={text,x,y};window.CircuitJS1.setSimRunning(false);window.CircuitJS1.importCircuit(xml,false);},{xml,text,x,y});
  if(run)await advance();await page.waitForFunction(()=>!!window.icGrab,null,{timeout:15000});return page.evaluate(()=>window.icGrab);
 }
 const dialog=page.locator('#ic-info-dialog');
 const openInformation=async point=>{
  await page.mouse.move(point.x,point.y);await page.mouse.click(point.x,point.y,{button:'right'});
  await page.getByText('Información del integrado',{exact:true}).click();await dialog.waitFor({state:'visible'});
 };

 for(const part of digitalICParts){
  const d=digitalICs[part],point=await load(circuit(part),part,560,168+4*d.pins),before=await layout();
  await openInformation(point);
  assert((await dialog.locator('#ic-info-title').innerText()).startsWith(part+' —'));
  assert.equal(await dialog.locator('svg [data-pin]').count(),d.pins);assert.equal(await dialog.locator('tr[data-ic-pin]').count(),d.pins);
  assert(await dialog.locator('[data-ic-supply]').innerText(),'explicit supply measurement '+part);
  const outputs=await dialog.locator('[data-internal-pin]').count();assert(outputs>0,'internal gates or functional blocks '+part);
  const pin=await dialog.locator(`tr[data-ic-pin="${d.vcc}"] td`).allTextContents();assert(pin[2].includes('5'),'live VCC '+part+' '+pin);
  await page.keyboard.press('Escape');assert.equal(await dialog.count(),0);assert.deepEqual(await layout(),before,'opening information must not move or add elements');
 }
 console.log('OK IC cards: all 42 powered DIP models open through context action, complete pins, internal wiring, supply voltages and unchanged circuit');
 // Live values must follow actual solver nodes while the dialog stays open.
 const point=await load(circuit('7408',true),'7408',560,224);await page.mouse.move(point.x,point.y);await page.mouse.click(point.x,point.y,{button:'right'});
 await page.getByText('Información del integrado',{exact:true}).click();await dialog.waitFor({state:'visible'});
 const low=await page.evaluate(()=>Array.from(window.CircuitJS1.getElements()).find(e=>e.getType()==='IC7408Elm').getVoltage(2));
 const lowText=(await dialog.locator('[data-ic-pin="3"] td').allTextContents())[2];assert(Math.abs(low)<.01&&/V$/.test(lowText),'low output includes modeled leakage: '+lowText+' / '+low);
 await page.evaluate(()=>window.CircuitJS1.setExtVoltage('ic-input',5));await advance();
 await page.waitForFunction(()=>document.querySelector('#ic-info-dialog [data-ic-pin="3"] td:nth-child(3)')?.textContent?.match(/4[.,]9/));
 const text=await dialog.innerText();assert(text.includes('1.4 V'),'model threshold distinguished from hardware VIH/VIL');assert(text.includes('SN7408'));assert(text.includes('≥ 2 V'));assert(text.includes('≤ 0.8 V'));
 assert((await dialog.locator('svg [data-pin-voltage="3"]').textContent()).match(/4[.,]9/));
 await page.screenshot({path:'/tmp/ic-info-desktop.png'});
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(100);
 const box=await dialog.boundingBox();assert(box.width<=390&&box.x>=0&&box.x+box.width<=391,'mobile dialog fits viewport');
 assert(await dialog.locator('[data-ic-close]').isVisible());await page.screenshot({path:'/tmp/ic-info-mobile.png'});await dialog.locator('[data-ic-close]').click();
 await page.setViewportSize({width:1500,height:950});
 console.log('OK IC card: context action, live solver/diagram voltage updates, model versus hardware specifications, responsive mobile layout, close and Escape');
 for(const [tag,text,x,y,count]of [['CD4026','4026',528,232,16],['Counter7493','7493',520,200,14],['Counter74191','74191',528,224,16],['Timer','dis',512,170,8],['DFlipFlop','D',512,170,4]]){
  const point=await load(head+`<${tag} x="480 160 624 160" f="${tag==='Timer'?7:1}"/>`+'</cir>',text,x,y,false);await openInformation(point);
  assert.equal(await dialog.locator('[data-ic-pin]').count(),count,tag+' physical versus logical terminals');
  if(tag==='DFlipFlop'){
   assert((await dialog.innerText()).includes('sin encapsulado físico asignado'));
   await dialog.locator('[data-ic-edit]').click();assert.equal(await dialog.count(),0);await page.keyboard.press('Escape');
  }else await page.keyboard.press('Escape');
 }
 // Restore the original gesture for configurable chips, both logical and analog.
 for(const [tag,text]of [['DFlipFlop','D'],['Timer','dis']]){
  const point=await load(head+`<${tag} x="480 160 624 160" f="${tag==='Timer'?7:1}"/>`+'</cir>',text,512,170,false);
  await page.mouse.dblclick(point.x,point.y);
  const editor=page.locator('dialog.circuitDialog[open]').filter({has:page.locator('h3')});
  await editor.locator('input').first().waitFor({state:'visible'});assert.equal(await dialog.count(),0,tag+' double-click must edit, never open information');
  await page.keyboard.press('Escape');await editor.waitFor({state:'detached'});
 }
 console.log('OK native double-click: D flip-flop and 555 open their parameter editor; information remains a separate context action');
 assert.deepEqual(errors,[],'no browser errors from chip information');
 console.log('OK IC cards: 4026, 7493, 74191, 555 and generic logical chip; physical pin mapping, unexposed pins and Edit action');
}finally{await browser.close();}

