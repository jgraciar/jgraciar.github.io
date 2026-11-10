// SPDX-License-Identifier: GPL-3.0-or-later
import type {DigitalIC} from './LabDigitalIC';
export interface MSI {kind:string;outputs:number[];inputs:number[];openCollector?:number[];bidir?:number[];name:string;group:string;}
const defs:Record<string,DigitalIC>={};
function add(part:string,kind:string,labels:string,outputs:number[],name:string,group:string,vcc?:number,gnd?:number,oc:number[]=[],bidir:number[]=[]):void{
 const pins=labels.split(' '),power=vcc||pins.length,ground=gnd||pins.length/2;
 const inputs=pins.flatMap((s,i)=>s!=='NC'&&i+1!==power&&i+1!==ground&&(!outputs.includes(i+1)||bidir.includes(i+1))?[i+1]:[]);
 defs[part]={part,family:'TTL',pins:pins.length,vcc:power,gnd:ground,labels:pins,gates:[],msi:{kind,outputs,inputs,openCollector:oc,bidir,name,group}};
}
add('74373','latch8','/OE Q0 D0 D1 Q1 Q2 D2 D3 Q3 GND LE Q4 D4 D5 Q5 Q6 D6 D7 Q7 Vcc',[2,5,6,9,12,15,16,19],'Latch D ×8 (Z)','latch');
add('7475','latch4','/Q0 D0 D1 EN23 Vcc D2 D3 /Q3 Q3 Q2 /Q2 GND EN01 /Q1 Q1 Q0',[1,8,9,10,11,14,15,16],'Latch D ×4 (Q, /Q)','latch',5,12);
add('74194','universal','/CLR SR A B C D SL GND S0 S1 CK QD QC QB QA Vcc',[12,13,14,15],'Registro universal ↔ 4 bits','register');
add('74164','sipo','A B QA QB QC QD GND CK /CLR QE QF QG QH Vcc',[3,4,5,6,10,11,12,13],'Registro SIPO 8 bits','register');
add('74165','piso','/PL CK E F G H /QH GND QH SER A B C D INH Vcc',[7,9],'Registro PISO 8 bits','register');
add('74190','counter190','B QB QA /EN D/U QC QD GND D C /LOAD MAX/MIN /RCO CK A Vcc',[2,3,6,7,12,13],'Contador BCD ↑↓','counter');
add('74192','counter192','B QB QA DOWN UP QC QD GND D C /LOAD /CO /BO CLR A Vcc',[2,3,6,7,12,13],'Contador BCD ↑↓ (dos relojes)','counter');
add('74168','counter168','U/D CK A B C D /ENP GND /LOAD /ENT QD QC QB QA /RCO Vcc',[11,12,13,14,15],'Contador BCD síncrono ↑↓','counter');
add('7447','seven','B C /LT /BI/RBO /RBI D A GND e d c b a g f Vcc',[4,9,10,11,12,13,14,15],'BCD → 7 segmentos (colector abierto)','codec',undefined,undefined,[4,9,10,11,12,13,14,15],[4]);
add('74147','encoder','/4 /5 /6 /7 /8 /C /B GND /A /9 /1 /2 /3 /D NC Vcc',[6,7,9,14],'Codificador prioritario 10 → 4','codec');
add('74138','decoder','A B C /G2A /G2B G1 /Y7 GND /Y6 /Y5 /Y4 /Y3 /Y2 /Y1 /Y0 Vcc',[7,9,10,11,12,13,14,15],'Decodificador 3 → 8','codec');
for(const part of ['74151','54151'])add(part,'mux8','D3 D2 D1 D0 Y /Y /G GND C B A D7 D6 D5 D4 Vcc',[5,6],'Multiplexor 8 → 1 (Y, /Y)','mux');
add('74152','mux8inv','D4 D3 D2 D1 D0 /Y GND C B A D7 D6 D5 Vcc',[6],'Multiplexor 8 → 1 inversor','mux');
add('74150','mux16','D7 D6 D5 D4 D3 D2 D1 D0 /G /Y S3 GND S2 S1 S0 D15 D14 D13 D12 D11 D10 D9 D8 Vcc',[10],'Multiplexor 16 → 1 inversor','mux');
add('74181','alu','B0 A0 S3 S2 S1 S0 /Cn M F0 F1 F2 GND F3 A=B /P /Cn+4 /G B3 A3 B2 A2 B1 A1 Vcc',[9,10,11,13,14,15,16,17],'ALU 4 bits','memory',undefined,undefined,[14]);
add('74189','ram','A0 /CS /WE D0 /Q0 D1 /Q1 GND /Q2 D2 /Q3 D3 A3 A2 A1 Vcc',[5,7,9,11],'RAM 16 × 4 (salidas invertidas, Z)','memory');
export const msiDefinitions=defs;
export class MSIState {
 word=0;ram:number[]=Array(16).fill(0);previous:boolean[]=Array(4).fill(false);rbo=false;
 reset():void{this.word=0;this.ram.fill(0);this.previous.fill(false);this.rbo=false;}
 save(){return {word:this.word,ram:this.ram,previous:this.previous,rbo:this.rbo};}
 restore(s:any):void{
  if(!s){this.reset();return;}
  if(!Number.isInteger(s.word)||s.word<0||s.word>255||!Array.isArray(s.ram)||s.ram.length!==16||!s.ram.every((x:unknown)=>Number.isInteger(x)&&Number(x)>=0&&Number(x)<16)||!Array.isArray(s.previous)||s.previous.length!==4||!s.previous.every((x:unknown)=>typeof x==='boolean')||typeof s.rbo!=='boolean')throw Error('Invalid MSI state');
  this.word=s.word;this.ram=s.ram.slice();this.previous=s.previous.slice();this.rbo=s.rbo;
 }
 step(d:DigitalIC,h:(pin:number)=>boolean):Record<number,boolean|null>{
  const out:Record<number,boolean|null>={},kind=d.msi!.kind;
  const read=(pins:number[])=>pins.reduce((n,p,i)=>n+(h(p)?2**i:0),0);
  const put=(pins:number[],word:number,z=false)=>pins.forEach((p,i)=>out[p]=z?null:!!(word&(1<<i)));
  const edge=(clock:boolean,i=0)=>{const rising=clock&&!this.previous[i];this.previous[i]=clock;return rising;};
  switch(kind){
   case'latch8':if(h(11))this.word=read([3,4,7,8,13,14,17,18]);put([2,5,6,9,12,15,16,19],this.word,h(1));break;
   case'latch4':{
    [2,3,6,7].forEach((p,i)=>{if(h(i<2?13:4))this.word=(this.word&~(1<<i))|(h(p)?1<<i:0);});
    put([16,15,10,9],this.word);put([1,14,11,8],~this.word);break;
   }
   case'universal':{
    const rise=edge(h(11)),mode=read([9,10]);
    if(!h(1))this.word=0;else if(rise){if(mode===3)this.word=read([3,4,5,6]);else if(mode===1)this.word=((this.word<<1)|(h(2)?1:0))&15;else if(mode===2)this.word=(this.word>>1)|(h(7)?8:0);}
    put([15,14,13,12],this.word);break;
   }
   case'sipo':{const rise=edge(h(8));if(!h(9))this.word=0;else if(rise)this.word=((this.word<<1)|(h(1)&&h(2)?1:0))&255;put([3,4,5,6,10,11,12,13],this.word);break;}
   case'piso':{const rise=edge(h(2)||h(15));if(!h(1))this.word=read([11,12,13,14,3,4,5,6]);else if(rise)this.word=((this.word<<1)|(h(10)?1:0))&255;out[9]=!!(this.word&128);out[7]=!out[9];break;}
   case'counter190':{
    const rise=edge(h(14)),down=h(5);if(!h(11))this.word=read([15,1,10,9]);else if(rise&&!h(4))this.word=down?(this.word===0?9:(this.word-1)&15):(this.word===9?0:(this.word+1)&15);
    put([3,2,6,7],this.word);const terminal=this.word===(down?0:9);out[12]=terminal;out[13]=!(!h(4)&&!h(14)&&terminal);break;
   }
   case'counter192':{
    const up=edge(h(5)),down=edge(h(4),1);if(h(14))this.word=0;else if(!h(11))this.word=read([15,1,10,9]);else if(up&&h(4))this.word=this.word===9?0:(this.word+1)&15;else if(down&&h(5))this.word=this.word===0?9:(this.word-1)&15;
    put([3,2,6,7],this.word);out[12]=!(this.word===9&&!h(5));out[13]=!(this.word===0&&!h(4));break;
   }
   case'counter168':{
    const rise=edge(h(2)),up=h(1);if(rise){if(!h(9))this.word=read([3,4,5,6]);else if(!h(7)&&!h(10))this.word=up?(this.word===9?0:(this.word+1)&15):(this.word===0?9:(this.word-1)&15);}
    put([14,13,12,11],this.word);out[15]=!(!h(10)&&this.word===(up?9:0));break;
   }
   case'encoder':{const pins=[0,11,12,13,1,2,3,4,5,10];let value=0;for(let i=1;i<=9;i++)if(!h(pins[i]))value=i;put([9,7,6,14],~value);break;}
   case'decoder':{const enabled=h(6)&&!h(4)&&!h(5),address=read([1,2,3]);[15,14,13,12,11,10,9,7].forEach((p,i)=>out[p]=!(enabled&&address===i));break;}
   case'mux8':{const value=!h(7)&&h([4,3,2,1,15,14,13,12][read([11,10,9])]);out[5]=value;out[6]=!value;break;}
   case'mux8inv':out[6]=!h([5,4,3,2,1,13,12,11][read([10,9,8])]);break;
   case'mux16':out[10]=h(9)||!h([8,7,6,5,4,3,2,1,23,22,21,20,19,18,17,16][read([15,14,13,11])]);break;
   case'seven':{
    const digit=read([7,1,2,6]),rbo=h(3)&&!h(5)&&digit===0;
    // BI/RBO is a wired-AND pin. Ignore its own previous sink while releasing it;
    // the external BI level is sampled again after the next matrix solution.
    const blank=(!h(4)&&!this.rbo)||rbo;this.rbo=rbo;out[4]=rbo?false:null;
    const patterns=[0x3f,0x06,0x5b,0x4f,0x66,0x6d,0x7c,0x07,0x7f,0x67,0x58,0x4c,0x62,0x69,0x78,0];
    const mask=blank?0:!h(3)?127:patterns[digit];[13,12,11,10,9,15,14].forEach((p,i)=>out[p]=mask&(1<<i)?false:null);break;
   }
   case'ram':{const address=read([1,15,14,13]);if(!h(2)&&!h(3))this.ram[address]=read([4,6,10,12]);put([5,7,9,11],~this.ram[address],h(2)||!h(3));break;}
   case'alu':{
    const a=read([2,23,21,19]),b=read([1,22,20,18]),s=read([6,5,4,3]);
    // Positive-logic gate equations (TI SDLS136, figure 5). x includes y.
    const x=(a|((s&1)?b:0)|((s&2)?~b:0))&15,y=((s&4)?a&~b:0)|((s&8)?a&b:0);
    const sum=x+y+(h(7)?0:1),f=h(8)?~(x^y)&15:sum&15;
    put([9,10,11,13],f);out[14]=f===15?null:false;out[15]=x!==15;out[17]=x+y<16;out[16]=sum<16;break;
   }
  }
  return out;
 }
}
