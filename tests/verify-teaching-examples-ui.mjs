import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const manifest=JSON.parse(readFileSync(new URL('../examples/circuit-jgr/manifest.json',import.meta.url),'utf8'));
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:'es-ES',viewport:{width:1450,height:900}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('labStartConfigured','1'));
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html?lang=es');
 await page.waitForFunction(()=>window.CircuitJS1?.getElements);
 await page.waitForFunction(()=>[...document.querySelectorAll('li')].some(e=>e.textContent?.includes('8.6.1. Codificador 4 a 2')),{timeout:20000});
 for(const item of manifest){
  const data=await page.evaluate(async file=>{
   const res=await fetch('/circuitjs/circuits/jgr/'+encodeURIComponent(file));
   if(!res.ok)throw Error(file+': HTTP '+res.status);
   const xml=await res.text();
   const root=new DOMParser().parseFromString(xml,'application/xml').documentElement;
   if(root.tagName!=='cir')throw Error(file+': XML no válido');
   const expected=[...root.children].filter(e=>!['o','h','adj'].includes(e.tagName)).length;
   window.CircuitJS1.setSimRunning(false);
   window.CircuitJS1.importCircuit(xml,false);
   return {expected,actual:[...window.CircuitJS1.getElements()].length,roundTrip:window.CircuitJS1.exportCircuit().includes('<cir')};
  },item.file);
  assert(data.expected>2,item.file+': circuito vacío');
  assert.equal(data.actual,data.expected,item.file+': elementos omitidos');
  assert(data.roundTrip,item.file+': no se puede exportar');
 }
 assert.deepEqual(errors,[]);
 console.log('OK: 16 ejemplos docentes accesibles, importables y exportables.');
}finally{await browser.close();}
