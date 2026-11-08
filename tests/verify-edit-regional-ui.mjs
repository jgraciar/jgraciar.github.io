import assert from "node:assert/strict";
import {chromium} from "playwright";

// Se recorre el mismo editor numérico de CircuitJS que utilizan todos los
// getEditInfo() de los componentes: edición, validación y guardado real en XML.
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({locale:"es-ES",viewport:{width:1440,height:900}});
 const errors=[];
 page.on("pageerror",error=>errors.push(error.message));
 await page.goto("http://127.0.0.1:8767/circuitjgr.html",{waitUntil:"domcontentloaded"});
 await page.locator("#lab-start-modal").waitFor({state:"visible",timeout:30000});
 await page.locator("#lab-start-accept").click();
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements,null,{timeout:90000});

 const header='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="20" mts="5e-11">';
 const tail='</cir>';

 async function setMode(decimal,group){
  await page.evaluate(({decimal,group})=>{
   localStorage.setItem("labRegionalFormat",decimal===","?"eu":"uk");
   localStorage.setItem("labDecimalSeparator",decimal);
   localStorage.setItem("labGroupingSeparator",group);
  },{decimal,group});
  await page.reload({waitUntil:"domcontentloaded"});
  await page.waitForFunction(()=>!!window.CircuitJS1?.getElements,null,{timeout:90000});
 }

 async function editOnce(tag,xmlAttr,initial,typed,expected){
  const model=tag==="FilteredBridge"?
   '<FilteredBridge x="256 304 352 304" f="0" r="'+initial+'" c="0.00047" rs="2.2"/>':
   '<r x="256 304 352 304" f="0" r="'+initial+'"/>';
  await page.evaluate(text=>window.CircuitJS1.importCircuit(text,false),header+model+tail);
  await page.waitForFunction(()=>window.CircuitJS1?.getElements?.().length===1,null,{timeout:30000});
  // Abrir el editor de la pieza visible. Las coordenadas de CircuitJS son
  // relativas al área de dibujo: probar puntos de la línea y de su centro.
  const probe=await page.evaluate(()=>{
   const canvas=[...document.querySelectorAll("canvas")]
     .filter(c=>c.width>400&&c.height>200)
     .sort((a,b)=>b.width*b.height-a.width*a.height)[0];
   if(!canvas)return {error:"no canvas"};
   const r=canvas.getBoundingClientRect();
   // La importación centra/escala los elementos; no suponer que la posición
   // lógica de CircuitJS coincide con los píxeles del lienzo.
   const candidateX=[304,500,650,800,400,200,1000,1120];
   const candidateY=[304,400,220,500,120,600];
   const attempts=[];
   const tryPoint=(x,y)=>{
    canvas.dispatchEvent(new MouseEvent("mousemove",{bubbles:true,cancelable:true,
      clientX:r.x+x,clientY:r.y+y,view:window}));
    canvas.dispatchEvent(new MouseEvent("dblclick",{bubbles:true,cancelable:true,
      clientX:r.x+x,clientY:r.y+y,view:window,button:0,detail:2}));
    const dialog=document.querySelector("dialog.circuitDialog[open]");
    if(dialog)return {opened:dialog.querySelector("h3")?.textContent,x,y};
    return null;
   };
   for(const y of candidateY)
    for(const x of candidateX){
     const found=tryPoint(x,y);
     if(found)return {...found,canvas:{width:canvas.width,height:canvas.height}};
    }
   for(let y=40;y<Math.min(r.height-35,650);y+=16)
    for(let x=35;x<Math.min(r.width-35,1200);x+=16){
     const found=tryPoint(x,y);
     if(found)return {...found,canvas:{width:canvas.width,height:canvas.height}};
    }
   return {opened:null,attempts,canvas:{width:canvas.width,height:canvas.height,
     x:r.x,y:r.y},circuitCount:window.CircuitJS1.getElements().length};
  });
  assert(probe.opened,"No se abrió editor para "+tag+": "+JSON.stringify(probe));
  const dialog=page.locator("dialog.circuitDialog[open]");
  const labels=await dialog.locator("label").allTextContents();
  const fields=dialog.locator('input[type="text"]');
  const count=await fields.count();
  assert(count>0,tag+": faltan campos numéricos: "+JSON.stringify(labels));
  const field=fields.first();
  await field.fill(typed);
  await dialog.locator("button").filter({hasText:/^(Aplicar|Apply)$/i}).first().click();
  const actual=await page.evaluate(({tag,xmlAttr})=>{
   const d=new DOMParser().parseFromString(window.CircuitJS1.exportCircuit(),"application/xml");
   return d.querySelector(tag)?.getAttribute(xmlAttr);
  },{tag,xmlAttr});
  const feedback=await dialog.innerText().catch(()=>"");
  assert.equal(Number(actual),expected,
   tag+": entrada "+typed+" no aceptada: "+JSON.stringify({actual,expected,feedback,probe}));
  await dialog.locator("button").filter({hasText:/^(Cancelar|Cancel)$/i}).first().click();
  console.log("OK: editor",tag,typed,"→",actual);
 }

 await setMode(",",".");
 for(const [typed,expected] of [["1,5",1.5],["1.234,5",1234.5],["2,2k",2200]])
  await editOnce("FilteredBridge","r",100,typed,expected);
 for(const [typed,expected] of [["1,5",1.5],["1.234,5",1234.5]])
  await editOnce("r","r",100,typed,expected);

 await setMode(".",",");
 for(const [typed,expected] of [["1.5",1.5],["1,234.5",1234.5],["2.2k",2200]])
  await editOnce("FilteredBridge","r",100,typed,expected);

 assert.deepEqual(errors,[],"Error JavaScript: "+errors.join("; "));
 console.log("OK: todos los campos EditDialog comparten conversión numérica única EU/UK");
}finally{await browser.close();}
