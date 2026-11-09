import assert from "node:assert/strict";
import {chromium} from "playwright";

// La ruta compartida EditDialog -> normalizeCircuitEditInput -> parseUnits
// debe funcionar realmente en editores de componentes nativos y propios.
const browser=await chromium.launch({headless:true});
const head='<cir f="1" ts="0.00001" ic="12" cb="50" pb="50" vr="20" mts="5e-11">';
const tested=[];
try{
 async function testEditor(type,format,cases){
  // Un contexto limpio por componente evita que el modo de selección y el
  // editor anterior contaminen el siguiente ensayo de interfaz.
  const context=await browser.newContext({locale:"es-ES",viewport:{width:1440,height:900}});
  const [decimal,group]=format==="eu"?[",","."]:[".",","];
  await context.addInitScript({content:[
   'localStorage.setItem("labStartConfigured","1");',
   'localStorage.setItem("labRegionalFormat",'+JSON.stringify(format)+');',
   'localStorage.setItem("labDecimalSeparator",'+JSON.stringify(decimal)+');',
   'localStorage.setItem("labGroupingSeparator",'+JSON.stringify(group)+');',
   'localStorage.setItem("labLanguageMode","manual");',
   'localStorage.setItem("language","es");'
  ].join("\n")});
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",e=>errors.push(e.message));
  try{
   await page.goto("http://127.0.0.1:8767/circuitjgr.html",
    {waitUntil:"domcontentloaded"});
   await page.waitForFunction(()=>window.CircuitJS1?.getElements,
    null,{timeout:90000});
   assert.equal(await page.locator("#lab-start-modal:not([hidden])").count(),0,
    "La configuración del ensayo no debe mostrar un modal inicial");
   const element=type==="FilteredBridge"?
    '<FilteredBridge x="256 304 352 304" f="0" r="100" c="0.00047" rs="2.2"/>':
    '<r x="256 304 352 304" f="0" r="100"/>';
   await page.evaluate(xml=>window.CircuitJS1.importCircuit(xml,false),head+element+'</cir>');
   await page.waitForFunction(()=>window.CircuitJS1.getElements().length===1,
    null,{timeout:30000});
   const opened=await page.evaluate(()=>{
    const canvas=[...document.querySelectorAll("canvas")]
      .filter(c=>c.width>400&&c.height>200)
      .sort((a,b)=>b.width*b.height-a.width*a.height)[0];
    if(!canvas)return {error:"Canvas no encontrado"};
    const r=canvas.getBoundingClientRect();
    const moveAndEdit=(x,y)=>{
     const args={bubbles:true,cancelable:true,clientX:r.x+x,clientY:r.y+y,
      view:window,button:0};
     canvas.dispatchEvent(new MouseEvent("mousemove",args));
     canvas.dispatchEvent(new MouseEvent("dblclick",{...args,detail:2}));
     const dlg=document.querySelector("dialog.circuitDialog[open]");
     return dlg?{title:dlg.querySelector("h3")?.textContent,x,y}:null;
    };
    for(const [x,y] of [[304,304],[500,400],[650,400],[500,300],
                         [650,300],[800,400],[500,500],[700,200]]){
     const found=moveAndEdit(x,y);if(found)return found;
    }
    // Los componentes nativos (p. ej., R) tienen una caja de selección
    // mucho más estrecha que el rectificador compuesto. Un barrido con
    // saltos de 18 px puede pasar entre ambos bordes sin acertar.
    for(let y=372;y<=428;y+=2)
     for(let x=520;x<=770;x+=5){
      const found=moveAndEdit(x,y);if(found)return found;
     }
    for(let y=40;y<Math.min(r.height-30,650);y+=6)
     for(let x=35;x<Math.min(r.width-30,1200);x+=12){
      const found=moveAndEdit(x,y);if(found)return found;
     }
    return {error:"No se encontró un editor para la pieza",width:r.width,height:r.height};
   });
   console.log("Diagnóstico apertura editor",type,format,JSON.stringify(opened));
   assert(opened.title,type+": "+JSON.stringify(opened));
   const dialog=page.locator("dialog.circuitDialog[open]");
   const input=dialog.locator('input[type="text"]').first();
   assert(await input.count()>0,type+": no hay campo numérico");
   const apply=dialog.locator("button").filter({hasText:/^(Aplicar|Apply)$/i}).first();
   assert(await apply.count()>0,type+": no hay botón Aplicar");
   for(const [typed,expected] of cases){
    await input.fill(typed);
    await apply.click();
    const check=await page.evaluate(tag=>{
     const xml=window.CircuitJS1.exportCircuit();
     const item=new DOMParser().parseFromString(xml,"application/xml").querySelector(tag);
     return {value:item?.getAttribute("r"),
      errors:[...document.querySelectorAll("dialog.circuitDialog[open] div")]
       .filter(el=>el.style.color==="red"&&el.style.display!=="none")
       .map(el=>el.textContent)};
    },type);
    assert.equal(Number(check.value),expected,
     type+" "+format+" "+typed+" no guardado: "+JSON.stringify({check,opened}));
    assert.equal(check.errors.length,0,
     type+" "+format+" "+typed+": error de validación: "+JSON.stringify(check.errors));
    tested.push(type+" "+format+" "+typed+" = "+expected);
    console.log("OK: editor",type,format,typed,"→",check.value);
   }
   assert.deepEqual(errors,[],"Errores de navegador: "+errors.join("; "));
  }finally{await context.close();}
 }
 await testEditor("FilteredBridge","eu",
  [["1,5",1.5],["1.234,5",1234.5],["2,2k",2200]]);
 await testEditor("r","eu",
  [["1,5",1.5],["1.234,5",1234.5]]);
 await testEditor("r","uk",
  [["1.5",1.5],["1,234.5",1234.5],["2.2k",2200]]);
 assert.equal(tested.length,8);
 console.log("OK: ocho entradas numéricas aplicadas mediante los editores "+
  "reales de Circuit JGR, incluidas resistencias originales y cargas no lineales");
}finally{await browser.close();}
