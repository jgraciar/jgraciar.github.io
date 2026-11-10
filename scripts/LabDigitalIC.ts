// SPDX-License-Identifier: GPL-3.0-or-later
// Functional DIP pinouts, checked against the manufacturer references in docs/digital-ics.md.
import {msiDefinitions,MSIState} from './LabDigitalMSI.ts';
import type {MSI} from './LabDigitalMSI.ts';
export type GateKind='AND'|'NAND'|'OR'|'NOR'|'XOR'|'NOT'|'SCHMITT';
export interface Gate {inputs:number[];output:number;kind:GateKind;}
export interface JK {j:number;k:number;clock:number;set:number;reset:number;q:number;nq:number;}
export interface RS {set:number;reset:number;q:number;}
export interface DigitalIC {
 part:string;family:'CMOS'|'TTL';pins:number;vcc:number;gnd:number;
 msi?:MSI;labels:string[];gates:Gate[];jk?:JK[];rs?:RS[];enable?:number;
 mode?:'master-slave'|'falling'|'rising'|'rs-nor'|'rs-nand';
}
const specs:Record<string,DigitalIC>={...msiDefinitions};
function gateIC(parts:string[],family:'CMOS'|'TTL',kind:GateKind,channels:number[][]):void{
 for(const part of parts){
  const labels=Array(14).fill('NC');labels[13]=family==='TTL'?'Vcc':'Vdd';labels[6]='GND';
  const gates=channels.map((c,i)=>{const inputs=c.slice(0,-1),output=c[c.length-1];
   inputs.forEach((p,k)=>labels[p-1]=`${i+1}${String.fromCharCode(65+k)}`);
   labels[output-1]=`${i+1}Y`;return {inputs,output,kind};});
  specs[part]={part,family,pins:14,vcc:14,gnd:7,labels,gates};
 }
}
const cmos2=[[1,2,3],[5,6,4],[8,9,10],[12,13,11]];
const ttl2=[[1,2,3],[4,5,6],[9,10,8],[12,13,11]];
const inv=[[1,2],[3,4],[5,6],[9,8],[11,10],[13,12]];
gateIC(['4081'],'CMOS','AND',cmos2);gateIC(['7408'],'TTL','AND',ttl2);
gateIC(['4011'],'CMOS','NAND',cmos2);gateIC(['7400'],'TTL','NAND',ttl2);
gateIC(['4071'],'CMOS','OR',cmos2);gateIC(['7432'],'TTL','OR',ttl2);
gateIC(['4001'],'CMOS','NOR',cmos2);gateIC(['7402'],'TTL','NOR',[[2,3,1],[5,6,4],[8,9,10],[11,12,13]]);
gateIC(['4070'],'CMOS','XOR',cmos2);gateIC(['7486'],'TTL','XOR',ttl2);
gateIC(['4069'],'CMOS','NOT',inv);gateIC(['7404'],'TTL','NOT',inv);
gateIC(['40106'],'CMOS','SCHMITT',inv);gateIC(['7414'],'TTL','SCHMITT',inv);
gateIC(['4082'],'CMOS','AND',[[2,3,4,5,1],[9,10,11,12,13]]);
gateIC(['4012'],'CMOS','NAND',[[2,3,4,5,1],[9,10,11,12,13]]);
gateIC(['7420'],'TTL','NAND',[[1,2,4,5,6],[9,10,12,13,8]]);
gateIC(['7430'],'TTL','NAND',[[1,2,3,4,5,6,11,12,8]]);
gateIC(['4023'],'CMOS','NAND',[[1,2,8,9],[3,4,5,6],[11,12,13,10]]);
function sequential(part:string,family:'CMOS'|'TTL',vcc:number,gnd:number,mode:DigitalIC['mode'],jk?:JK[],rs?:RS[],enable?:number):void{
 const labels=Array(16).fill('NC');labels[vcc-1]=family==='TTL'?'Vcc':'Vdd';labels[gnd-1]='GND';
 jk?.forEach((f,i)=>{for(const [key,name]of Object.entries({j:'J',k:'K',clock:'CK',set:'S',reset:'R',q:'Q',nq:'/Q'}))
  labels[f[key as keyof JK]-1]=`${i+1}${name}`;});
 rs?.forEach((f,i)=>{labels[f.set-1]=`${i+1}S`;labels[f.reset-1]=`${i+1}R`;labels[f.q-1]=`${i+1}Q`;});
 if(enable)labels[enable-1]='EN';
 specs[part]={part,family,pins:16,vcc,gnd,mode,jk,rs,enable,labels,gates:[]};
}
const jk76=[{j:4,k:16,clock:1,set:2,reset:3,q:15,nq:14},{j:9,k:12,clock:6,set:7,reset:8,q:11,nq:10}];
sequential('7476','TTL',5,13,'master-slave',jk76);
sequential('7476N','TTL',5,13,'master-slave',jk76); // N is the DIP package suffix, same logic and pinout.
sequential('74112','TTL',16,8,'falling',[
 {j:3,k:2,clock:1,set:4,reset:15,q:5,nq:6},{j:11,k:12,clock:13,set:10,reset:14,q:9,nq:7}]);
sequential('4027','CMOS',16,8,'rising',[
 {j:10,k:11,clock:13,set:9,reset:12,q:15,nq:14},{j:6,k:5,clock:3,set:7,reset:4,q:1,nq:2}]);
sequential('4043','CMOS',16,8,'rs-nor',undefined,[
 {set:4,reset:3,q:2},{set:6,reset:7,q:9},{set:12,reset:11,q:10},{set:14,reset:15,q:1}],5);
sequential('4044','CMOS',16,8,'rs-nand',undefined,[
 {set:3,reset:4,q:13},{set:7,reset:6,q:9},{set:11,reset:12,q:10},{set:15,reset:14,q:1}],5);
export const digitalICs:Readonly<Record<string,DigitalIC>>=specs;
export const digitalICParts=Object.keys(specs).sort((a,b)=>parseInt(a)-parseInt(b)||a.localeCompare(b));
export function outputPins(d:DigitalIC):number[]{return [...(d.msi?.outputs||[]),...d.gates.map(g=>g.output),...(d.jk?.flatMap(f=>[f.q,f.nq])||[]),...(d.rs?.map(f=>f.q)||[])];}
export function inputPins(d:DigitalIC):number[]{return [...new Set([...(d.msi?.inputs||[]),...d.gates.flatMap(g=>g.inputs),...(d.jk?.flatMap(f=>[f.j,f.k,f.clock,f.set,f.reset])||[]),...(d.rs?.flatMap(f=>[f.set,f.reset])||[]),...(d.enable?[d.enable]:[])])];}
export function gateValue(kind:GateKind,values:boolean[]):boolean{
 const and=values.every(Boolean),or=values.some(Boolean);
 switch(kind){case'AND':return and;case'NAND':return !and;case'OR':return or;case'NOR':return !or;case'XOR':return values.filter(Boolean).length%2===1;default:return !values[0];}
}
export class DigitalICState {
 q=[false,false,false,false];master=[false,false];clock=[false,false];levels:boolean[]=Array(16).fill(false);
 msi=new MSIState();
 invalid=false;
 reset():void{this.msi.reset();this.q.fill(false);this.master.fill(false);this.clock.fill(false);this.levels.fill(false);this.invalid=false;}
 save():string{return JSON.stringify({q:this.q,master:this.master,clock:this.clock,levels:this.levels.slice(0,16),msi:this.msi.save()});}
 restore(text:string):void{
  try{const s=JSON.parse(text);for(const key of ['q','master','clock','levels']as const){
   if(!Array.isArray(s[key])||s[key].length!==(key==='levels'?16:this[key].length)||!s[key].every((x:unknown)=>typeof x==='boolean'))throw Error('invalid IC state');
  }this.q=s.q;this.master=s.master;this.clock=s.clock;this.levels=s.levels;this.msi.restore(s.msi);}catch{this.reset();}
 }
 step(d:DigitalIC,volts:number[]):Record<number,boolean|null>{
  const vss=volts[d.gnd-1],supply=volts[d.vcc-1]-vss;
  const powered=Number.isFinite(supply)&&supply>=(d.family==='TTL'?4.75:3)&&supply<=(d.family==='TTL'?5.25:18);
  const out:Record<number,boolean|null>={};this.invalid=false;
  if(!powered){for(const p of outputPins(d))out[p]=null;return out;}
  for(const p of inputPins(d)){
   const v=volts[p-1]-vss;
   const schmitt=d.gates.some(g=>g.kind==='SCHMITT'&&g.inputs.includes(p));
   if(schmitt){const lo=d.family==='TTL'?0.9:supply*0.3,hi=d.family==='TTL'?1.7:supply*0.7;
    if(v>=hi)this.levels[p-1]=true;else if(v<=lo)this.levels[p-1]=false;
   }else this.levels[p-1]=v>(d.family==='TTL'?1.4:supply/2);
  }
  const high=(p:number)=>this.levels[p-1];
  if(d.msi)return this.msi.step(d,high);
  for(const g of d.gates)out[g.output]=gateValue(g.kind,g.inputs.map(high));
  d.rs?.forEach((f,i)=>{
   const set=d.mode==='rs-nand'?!high(f.set):high(f.set),reset=d.mode==='rs-nand'?!high(f.reset):high(f.reset);
   // Manufacturer truth tables: S dominates for 4043; R dominates for 4044.
   if(d.mode==='rs-nor'){if(reset)this.q[i]=false;if(set)this.q[i]=true;}
   else{if(set)this.q[i]=true;if(reset)this.q[i]=false;}
   out[f.q]=high(d.enable!)?this.q[i]:null;
  });
  d.jk?.forEach((f,i)=>{
   const ck=high(f.clock),set=d.family==='TTL'?!high(f.set):high(f.set),reset=d.family==='TTL'?!high(f.reset):high(f.reset);
   const next=()=>high(f.j)?(high(f.k)?!this.q[i]:true):(high(f.k)?false:this.q[i]);
   if(set||reset){this.q[i]=set;this.master[i]=this.q[i];}
   else if(d.mode==='master-slave'){
    // Valid 7476 operation requires J/K stable throughout the high clock phase.
    if(ck)this.master[i]=next();else if(this.clock[i])this.q[i]=this.master[i];
   }else if(d.mode==='rising'?ck&&!this.clock[i]:!ck&&this.clock[i])this.q[i]=next();
   this.clock[i]=ck;this.invalid ||= set&&reset;
   out[f.q]=this.q[i];out[f.nq]=set&&reset?true:!this.q[i];
  });
  return out;
 }
}
