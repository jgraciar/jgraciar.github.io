import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const browser=await chromium.launch({headless:true});
try {
 const page=await browser.newPage({locale:'es-ES',viewport:{width:860,height:430}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>localStorage.setItem('labStartConfigured','1'));
 await page.goto('http://127.0.0.1:8767/circuitjgr-core.html',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.CircuitJS1?.getElements &&
  Array.from(document.querySelectorAll('td.gwt-MenuItem')).some(el=>/Circuitos|Circuits/.test(el.textContent||'')));
 const circuits=page.locator('td.gwt-MenuItem').filter({hasText:/Circuitos|Circuits/}).first();
 await circuits.click();
 const dropdown=circuits.locator(':scope > ul.menuDropdown');
 await dropdown.waitFor({state:'visible'});
 const measure=()=>dropdown.evaluate(el=>{
  const r=el.getBoundingClientRect();
  return {top:r.top,bottom:r.bottom,height:r.height,scrollHeight:el.scrollHeight,
   clientHeight:el.clientHeight,viewport:innerHeight};
 });
 const start=await measure();
 assert(start.top>=0&&start.bottom<=start.viewport+2,'El menú principal debe caber verticalmente');
 assert(start.scrollHeight>start.clientHeight+20,'El menú de ejemplos debe ser desplazable');
 const firstSub=dropdown.locator(':scope > li.hasSubmenu').first();
 await firstSub.hover();
 const inner=firstSub.locator(':scope > ul.menuDropdown');
 await inner.waitFor({state:'visible'});
 const pos=await inner.evaluate(el=>{
  const r=el.getBoundingClientRect();
  return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,w:innerWidth,h:innerHeight};
 });
 assert(pos.left>=-2&&pos.right<=pos.w+2,'Submenú fuera de la anchura visible');
 assert(pos.top>=-2&&pos.bottom<=pos.h+2,'Submenú fuera de la altura visible');
 await dropdown.evaluate(el=>{el.scrollTop=el.scrollHeight});
 const scrolled=await dropdown.evaluate(el=>el.scrollTop);
 assert(scrolled>20,'Deben poder alcanzarse los últimos ejemplos al desplazarse');
 await page.setViewportSize({width:500,height:370});
 await page.waitForTimeout(350);
 const root=await dropdown.evaluate(el=>({height:el.getBoundingClientRect().height,h:innerHeight}));
 assert(root.height<=root.h+2,'El menú no debe salirse de la pantalla pequeña');
 assert.deepEqual(errors,[]);
 console.log('OK: menús desplazables; submenús enteros en 860 × 430 y 500 × 370');
}finally{await browser.close();}
