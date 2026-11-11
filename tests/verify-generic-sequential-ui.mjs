import assert from "node:assert/strict";
import {chromium} from "playwright";
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage({viewport:{width:1450,height:900},locale:"es-ES"});
 const errors=[];page.on("pageerror",e=>errors.push(e.message));
 await page.goto("http://127.0.0.1:8767/circuitjgr-core.html");
 if(await page.locator("#lab-start-accept").count())await page.locator("#lab-start-accept").click({timeout:30000});
 await page.waitForFunction(()=>!!window.CircuitJS1?.getElements);
 const result=await page.evaluate(()=>{
   const api=window.CircuitJS1;
   function elem(type,flags=0){
     api.setSimRunning(false);
     const xml='<cir f="0" ts="0.00005" ic="125" cb="50" pb="50" vr="5" mts="5e-11"><'+type+' x="160 160 192 160" f="'+flags+'"/></cir>';
     api.importCircuit(xml,false);
     api.setSimRunning(false);
     const chip=Array.from(api.getElements()).find(e=>e.getType()===type+"Elm");
     if(!chip)throw Error("Not loaded: "+type);
     return chip;
   }
   function check(cond,msg){if(!cond)throw Error(msg);}
   const symbols=[];
   for(const [name,clockIndex,mask,initial] of [
     ["DFlipFlop",3,3<<8,0],["TFlipFlop",3,3<<8,0],["JKFlipFlop",1,3<<8,1]
   ]){
     for(let mode=0;mode<4;mode++){
       const f=(name==="JKFlipFlop"?(1<<14):0)|(mode<<8);
       const chip=elem(name,f);
       check(chip.timingMode()===mode,name+" mode "+mode);
       check(chip.pins[clockIndex].clock===(mode<2),name+" clock symbol "+mode);
       check(chip.pins[clockIndex].bubble===(mode===1||mode===3),name+" bubble "+mode);
       const options=chip.getChipEditInfo(name==="DFlipFlop"?3:name==="TFlipFlop"?2:1).choice.items;
       check(options.length===4,name+" dropdown options");
       symbols.push(name+":"+mode);
     }
   }
   // Los tres componentes originales mantienen sus flancos historicos.
   check(elem("DFlipFlop").timingMode()===0,"legacy D rising");
   check(elem("TFlipFlop").timingMode()===0,"legacy T rising");
   check(elem("JKFlipFlop").timingMode()===1,"legacy JK falling");
   for(let mode=0;mode<6;mode++){
     const rs=elem("RSGeneric",mode<<7),c=rs.pins;
     check(rs.mode()===mode,"RS mode "+mode);
     check(c.length===(mode<2?4:5),"RS pins "+mode);
     if(mode>=2){
       check(c[4].clock===(mode>=4),"RS edge "+mode);
       check(c[4].bubble===(mode===3||mode===5),"RS inversion "+mode);
     }
     check(rs.getChipEditInfo(0).choice.items.length===6,"RS options");
   }
   // Verificacion de las dieciseis conversiones binarias a dos digitos BCD.
   const bcd=elem("BinaryToBCD4");
   for(let n=0;n<16;n++){
     for(let i=0;i<4;i++)bcd.pins[i].value=!!(n&(1<<i));
     bcd.execute();
     const val=(offset)=>[0,1,2,3].reduce((sum,i)=>sum+(bcd.pins[offset+i].value?(1<<i):0),0);
     check(val(4)===n%10&&val(8)===Math.floor(n/10),"BCD "+n);
   }
   const reader=elem("SevenSegNumeric");
   for(let digit=0;digit<=9;digit++){
     const pattern=reader.constructor.masks[digit];
     for(let i=0;i<7;i++)reader.pins[i].value=!!(pattern&(1<<i));
     check(reader.digit()===digit,"7seg "+digit);
   }
   for(let i=0;i<7;i++)reader.pins[i].value=false;
   check(reader.digit()===null,"reader invalid pattern");
   // Comportamiento D con ambos flancos y niveles.
   for(let mode=0;mode<4;mode++){
     const d=elem("DFlipFlop",mode<<8);
     d.pins[0].value=true;
     d.pins[3].value=mode===1?true:mode===3?true:false;
     d.execute();
     const before=d.pins[1].value;
     d.pins[3].value=mode===1?false:mode===3?false:true;
     d.execute();
     check(d.pins[1].value===true,"D transition "+mode+" before "+before);
   }
   // El estado de los modos debe formar parte del XML.
   const serial=elem("JKFlipFlop",(1<<14)|(3<<8));
   const serialized=api.exportCircuit();
   check(serialized.includes('f="')&&serialized.includes('JKFlipFlop'),"JK XML stored");
   return {symbols,rsModes:6,bcdCases:16,segmentDigits:10,serialized:serialized.length};
 });
 assert.equal(result.symbols.length,12);
 assert.deepEqual(errors,[]);
 console.log("OK generic flip-flops, symbols, dropdowns, legacy flags and two decimal auxiliaries",result);
}finally{await browser.close();}
