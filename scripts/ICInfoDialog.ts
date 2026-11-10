// SPDX-License-Identifier: GPL-3.0-or-later
import {ChipElm} from './ChipElm';
import {CircuitElm} from './CircuitElm';
import {CirSim} from './CirSim';
import {Dialog} from './Dialog';
import {Locale} from './Locale';
import {circuitJsDrawLabel} from './CircuitJsDrawLabels';
import {numberedICInfo,electricalHardware,pinLogicState} from './ICInfoData';
import type {ICInfo,InfoPin} from './ICInfoData';
import {icInfoDiagram} from './ICInfoDiagram';
import {icInfoLabel} from './ICInfoLabels';
import {registerICInfoHandler} from './ICInfoController';
let activeDialog:ICInfoDialog|null=null;
function information(elm:CircuitElm):ICInfo{
 const type=elm.constructor.name,part=(typeof (elm as any).part==='function'?(elm as any).part():undefined)||({CD4026Elm:'4026',Counter7493Elm:'7493',Counter74191Elm:'74191',TimerElm:'555'}as Record<string,string>)[type];
 const fixed=part?numberedICInfo(part,Locale.activeLanguage):null;
 if(fixed)return fixed;
 const chip=(elm as any).chip||elm,modelName=(elm as any).modelName as string|undefined;
 const raw=elm.isSubcircuitElm()&&modelName?(modelName.startsWith('~')?modelName.replace(/^~/,'').replace(/-v\d+$/,''):modelName):(chip.getChipName?.()||elm.getElmType()),source='Add '+raw;
 const translated=Locale.LS(source),name=circuitJsDrawLabel(source,translated===source?Locale.LS(raw):translated,Locale.activeLanguage);
 const pins:InfoPin[]=Array.from({length:elm.getPostCount()},(_,i)=>{const p=chip.pins?.[i];return {number:i+1,name:(p?.lineOver||p?.bubble?'/':'')+(p?.clock?'CK':p?.text||'T'+(i+1)),index:i,role:p?.output?'output':'input'};});
 const notes=[icInfoLabel('logical',Locale.activeLanguage)];
 return {part:name,name,family:'',physical:false,pins,blocks:[],stages:[name],model:[],notes,table:[]};
}
export class ICInfoDialog extends Dialog {
 private timer:ReturnType<typeof setInterval>|null=null;
 private closed=false;
 private info:ICInfo;
 private values=new Map<number,{absolute:HTMLElement;relative:HTMLElement;state:HTMLElement}>();
 private svgValues=new Map<number,Element>();
 private rawValues=new Map<number,HTMLElement>();
 private supplyValue:HTMLElement|null=null;
 private time:HTMLElement;
 private elm:CircuitElm;
 constructor(elm:CircuitElm){
  super();this.elm=elm;this.info=information(elm);this.closeOnEnter=false;
  const d=this.dialogEl;d.id='ic-info-dialog';d.setAttribute('aria-labelledby','ic-info-title');
  const label=(key:Parameters<typeof icInfoLabel>[0])=>icInfoLabel(key,Locale.activeLanguage);
  const style=document.createElement('style');style.textContent=`
   #ic-info-dialog{box-sizing:border-box;width:min(1120px,calc(100vw - 24px));max-width:calc(100vw - 24px);max-height:calc(100dvh - 24px);padding:0;color:#172554;background:#fff;border:1px solid #94a3b8;border-radius:12px;overflow:auto;font:14px system-ui,sans-serif;}
   #ic-info-dialog::backdrop{background:#0f172a66} #ic-info-dialog *{box-sizing:border-box}
   #ic-info-dialog header{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:16px;background:#fff;border-bottom:1px solid #e2e8f0;padding:16px 20px}
   #ic-info-dialog h2{margin:0;font-size:21px;line-height:1.25} #ic-info-dialog h3{font-size:16px;margin:20px 0 10px} #ic-info-dialog p{line-height:1.5;margin:8px 0}
   #ic-info-dialog .ic-info-layout{display:grid;grid-template-columns:minmax(0,1fr);gap:24px;padding:4px 20px 20px} #ic-info-dialog figure{margin:0}
   #ic-info-dialog .ic-diagram-viewport{width:100%;overflow:auto;border:1px solid #e2e8f0;border-radius:8px} #ic-info-dialog .ic-diagram-controls{display:flex;gap:8px;align-items:center;margin:0 0 8px} #ic-info-dialog svg{display:block;width:100%;min-width:900px;height:auto;background:white;border:1px solid #e2e8f0;border-radius:8px}
   #ic-info-dialog figcaption,#ic-info-dialog .ic-info-note{color:#475569;font-size:13px;line-height:1.5} #ic-info-dialog .ic-info-subtitle{margin:3px 0 0;color:#475569}
   #ic-info-dialog .ic-table-wrap{overflow:auto;max-height:380px;border:1px solid #e2e8f0;border-radius:6px} #ic-info-dialog table{border-collapse:collapse;width:100%;font-size:13px;text-align:left}
   #ic-info-dialog th,#ic-info-dialog td{padding:7px 9px;border-bottom:1px solid #e2e8f0;white-space:normal} #ic-info-dialog th{position:sticky;top:0;background:#f1f5f9;font-weight:600}
   #ic-info-dialog td[data-measured]{white-space:nowrap;font-variant-numeric:tabular-nums} #ic-info-dialog tr:last-child td{border-bottom:0} #ic-info-dialog tbody tr:hover{background:#eff6ff}
   #ic-info-dialog button{font:inherit;cursor:pointer;border:1px solid #94a3b8;border-radius:6px;padding:7px 12px;color:#172554;background:#f8fafc} #ic-info-dialog button:focus-visible,#ic-info-dialog a:focus-visible{outline:3px solid #2563eb;outline-offset:2px}
   #ic-info-dialog .ic-info-actions{display:flex;gap:8px;flex-shrink:0} #ic-info-dialog a{color:#1d4ed8} #ic-info-dialog .ic-info-span{grid-column:1/-1} #ic-info-dialog .ic-info-time{font-variant-numeric:tabular-nums;color:#475569;font-size:12px}
   @media(max-width:700px){#ic-info-dialog .ic-info-layout{grid-template-columns:minmax(0,1fr);gap:0;padding:0 12px 16px} #ic-info-dialog header{padding:12px;align-items:flex-start} #ic-info-dialog h2{font-size:18px} #ic-info-dialog .ic-info-actions{flex-direction:column} #ic-info-dialog .ic-info-span{grid-column:auto}}
  `;d.append(style);
  const header=document.createElement('header'),heading=document.createElement('div'),title=document.createElement('h2');title.id='ic-info-title';title.textContent=this.info.physical?this.info.part+' — '+this.info.name:this.info.name;heading.append(title);
  const subtitle=document.createElement('p');subtitle.className='ic-info-subtitle';subtitle.textContent=[this.info.family,this.info.physical?'DIP-'+this.info.pins.length:label('logical')].filter(Boolean).join(' · ');heading.append(subtitle);header.append(heading);
  const actions=document.createElement('div');actions.className='ic-info-actions';
  if(elm.hasProperties()&&!CircuitElm.app.ui.isReadOnly()){
   const edit=document.createElement('button');edit.type='button';edit.textContent=Locale.LS('Edit...');edit.dataset.icEdit='true';edit.onclick=()=>{this.closeDialog();CircuitElm.app.commands.doEdit(elm);};actions.append(edit);
  }
  const close=document.createElement('button');close.type='button';close.textContent=Locale.LS('Close');close.dataset.icClose='true';close.onclick=()=>this.closeDialog();actions.append(close);header.append(actions);d.append(header);
  const layout=document.createElement('div');layout.className='ic-info-layout';layout.addEventListener('pointerdown',e=>e.stopPropagation());d.append(layout);
  const drawing=document.createElement('section');this.heading(drawing,label('pinout'));
  const figure=document.createElement('figure'),graphic=document.createElement('div');graphic.className='ic-diagram-viewport';graphic.tabIndex=0;graphic.setAttribute('aria-label',label('pinout'));
  graphic.innerHTML=icInfoDiagram(this.info,label(this.info.physical?'physical':'logical'));
  const controls=document.createElement('div');controls.className='ic-diagram-controls';let zoom=1;
  const zoomLabel=document.createElement('span');zoomLabel.textContent='100 %';
  for(const [symbol,delta,key]of [['−',-.25,'Zoom Out'],['+',.25,'Zoom In']]as const){const b=document.createElement('button');b.type='button';b.textContent=symbol;b.title=Locale.LS(key);b.setAttribute('aria-label',Locale.LS(key));b.onclick=()=>{zoom=Math.max(.25,Math.min(3,zoom+delta));(graphic.querySelector('svg')as SVGElement).style.minWidth=(900*zoom)+'px';zoomLabel.textContent=Math.round(zoom*100)+' %';};controls.append(b);}
  controls.append(zoomLabel);figure.append(controls,graphic);
  const caption=document.createElement('figcaption');caption.textContent=label('functional');figure.append(caption);drawing.append(figure);layout.append(drawing);
  for(const el of Array.from(graphic.querySelectorAll('[data-pin-voltage]')))this.svgValues.set(Number(el.getAttribute('data-pin-voltage')),el);
  const detail=document.createElement('section');layout.append(detail);this.heading(detail,label('model'));
  if(this.info.model.length){this.text(detail,label('supply')+': '+this.info.model[0]);if(this.info.model[1])this.text(detail,label('threshold')+': '+this.info.model[1]);}
  else if(elm instanceof ChipElm&&elm.isDigitalChip()){
   this.text(detail,'VH = '+CircuitElm.getVoltageText(elm.highVoltage)+'; VL = 0 V; VTH = '+CircuitElm.getVoltageText(elm.getThreshold()));
  }
  this.supplyValue=document.createElement('p');this.supplyValue.dataset.icSupply='true';detail.append(this.supplyValue);
  this.text(detail,label('limits'),'ic-info-note');for(const note of this.info.notes)this.text(detail,note,'ic-info-note');
  const hardware=electricalHardware(this.info);if(hardware.length){this.heading(detail,label('hardware'));this.table(detail,['', 'V'],hardware);}
  if(this.info.source){
   const p=document.createElement('p'),a=document.createElement('a');a.href=this.info.source;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label('datasheet')+(this.info.sourceName?' · '+this.info.sourceName:'');p.append(a);detail.append(p);this.text(detail,label('variant'),'ic-info-note');
  }
  const live=document.createElement('section');live.className='ic-info-span';this.heading(live,label('live'));this.text(live,label('reference'),'ic-info-note');
  this.time=document.createElement('p');this.time.className='ic-info-time';live.append(this.time);
  const {tbody}=this.table(live,[label(this.info.physical?'pin':'signal'),label('signal'),'V(t) (GND)','V(t) − VSS',label('state')],[]);
  for(const pin of this.info.pins){
   const tr=document.createElement('tr');tr.dataset.icPin=String(pin.number);this.cell(tr,this.info.physical?String(pin.number):'T'+pin.number);this.cell(tr,pin.name);
   const absolute=this.cell(tr,'—'),relative=this.cell(tr,'—'),state=this.cell(tr,'—');absolute.dataset.measured='true';relative.dataset.measured='true';absolute.title=label('unexposed');this.values.set(pin.number,{absolute,relative,state});tbody.append(tr);
  }
  layout.append(live);
  if(this.info.physical&&(elm.getPostCount()!==this.info.pins.length||elm.constructor.name==='Counter74191Elm')){
   const raw=document.createElement('details');raw.className='ic-info-span';const summary=document.createElement('summary');summary.textContent=label('terminals');raw.append(summary);
   const pins=((elm as any).pins||[]) as {text?:string}[];
   const {tbody:rawBody}=this.table(raw,['T',label('signal'),'V(t) (GND)'],[]);
   for(let i=0;i<elm.getPostCount();i++){const row=document.createElement('tr');this.cell(row,'T'+(i+1));this.cell(row,pins[i]?.text||'—');this.rawValues.set(i,this.cell(row,'—'));rawBody.append(row);}layout.append(raw);
  }
  if(this.info.table.length){
   const truth=document.createElement('details');truth.className='ic-info-span';truth.open=this.info.table.length<=16;const summary=document.createElement('summary');summary.textContent=label('truth');truth.append(summary);
   const heads=this.info.part==='74181'?['S3S2S1S0','M=1','M=0; /Cn=1']:[label('function'),label('result')];this.table(truth,heads,this.info.table);layout.append(truth);
  }
  this.update();this.show();close.focus();this.timer=setInterval(()=>this.update(),250);
 }
 private heading(parent:HTMLElement,text:string):void{const h=document.createElement('h3');h.textContent=text;parent.append(h);}
 private text(parent:HTMLElement,text:string,cls=''):void{const p=document.createElement('p');p.textContent=text;p.className=cls;parent.append(p);}
 private cell(row:HTMLElement,text:string):HTMLTableCellElement{const td=document.createElement('td');td.textContent=text;row.append(td);return td;}
 private table(parent:HTMLElement,headers:string[],rows:string[][]){
  const wrap=document.createElement('div');wrap.className='ic-table-wrap';const table=document.createElement('table'),head=document.createElement('thead'),tr=document.createElement('tr');
  for(const title of headers){const th=document.createElement('th');th.scope='col';th.textContent=title;tr.append(th);}head.append(tr);table.append(head);
  const tbody=document.createElement('tbody');for(const values of rows){const row=document.createElement('tr');values.forEach(value=>this.cell(row,value));tbody.append(row);}table.append(tbody);wrap.append(table);parent.append(wrap);return {table,tbody};
 }
 private update():void{
  const info=this.info,volts=Array.from({length:this.elm.getPostCount()},(_,i)=>this.elm.getPostVoltage(i));
  const ground=info.pins.find(p=>p.number===info.gnd),gi=ground?.index,vss=gi!==null&&gi!==undefined&&gi<volts.length?volts[gi]:undefined;
  const vcc=info.pins.find(p=>p.number===info.vcc),vi=vcc?.index;
  if(this.supplyValue)this.supplyValue.textContent=vss!==undefined&&vi!==null&&vi!==undefined&&vi<volts.length?'VCC − VSS = '+CircuitElm.getVoltageText(volts[vi]-vss):'';
  for(const pin of info.pins){
   const cells=this.values.get(pin.number)!;const voltage=pin.index!==null&&pin.index<volts.length?volts[pin.index]:undefined;
   const display=voltage!==undefined&&Number.isFinite(voltage)?CircuitElm.getVoltageText(voltage):'—';
   cells.absolute.textContent=display;cells.absolute.title=voltage===undefined?icInfoLabel('unexposed',Locale.activeLanguage):'V (GND)';
   cells.relative.textContent=voltage!==undefined&&vss!==undefined?CircuitElm.getVoltageText(voltage-vss):'—';
   const state=pinLogicState(info,pin,volts,info.definition?(this.elm as any).values:undefined);cells.state.textContent=state;
   const svg=this.svgValues.get(pin.number);if(svg)svg.textContent=display+(state==='Z'?' · Z':'');
  }
  for(const [i,cell]of this.rawValues)cell.textContent=CircuitElm.getVoltageText(volts[i]);
  this.time.textContent='t = '+CircuitElm.getUnitText(CircuitElm.sim.t,'s');
 }
 closeDialog():void{if(this.closed)return;this.closed=true;if(activeDialog===this)activeDialog=null;if(this.timer!==null){clearInterval(this.timer);this.timer=null;}super.closeDialog();}
}

registerICInfoHandler(elm=>{CirSim.editDialog?.closeDialog();activeDialog?.closeDialog();activeDialog=new ICInfoDialog(elm);});
