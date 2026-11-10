// SPDX-License-Identifier: GPL-3.0-or-later
import type {ICInfo,InfoPin} from './ICInfoData.ts';
export function svgEscape(value:unknown):string{return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));}
const colors=['#1d4ed8','#047857','#7e22ce','#b45309','#be123c','#0e7490','#4338ca','#4d7c0f'];
export function icInfoDiagram(info:ICInfo,caption:string):string{
 const half=Math.ceil(info.pins.length/2),height=Math.max(440,half*42+100),top=66,step=(height-125)/Math.max(1,half-1);
 const loc=(p:number)=>{const i=info.pins.findIndex(pin=>pin.number===p),left=i<half,row=left?i:info.pins.length-1-i;return {x:left?260:840,y:top+row*step,left};};
 const t=(x:number,y:number,text:string,extra='')=>`<text x="${x}" y="${y}" ${extra}>${svgEscape(text)}</text>`;
 const line=(points:string,color:string,width=1.7)=>`<path d="${points}" fill="none" stroke="${color}" stroke-width="${width}" vector-effect="non-scaling-stroke"/>`;
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1100 ${height+28}" role="img" aria-label="${svgEscape(caption)}"><title>${svgEscape(info.part+' — '+caption)}</title><style>text{font:15px system-ui,sans-serif;fill:#172554}.ic-small{font-size:12px;fill:#475569}.ic-pin-value{font:12px ui-monospace,monospace;fill:#0369a1}.ic-block-label{font-size:17px;font-weight:600}.ic-pin-number{font-weight:700}</style><rect x="260" y="26" width="580" height="${height-30}" rx="18" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>${info.physical?'<path d="M520 26 a30 22 0 0 0 60 0" fill="white" stroke="#64748b" stroke-width="2"/>':''}${t(550,18,info.part,'text-anchor="middle" class="ic-block-label"')}`;
 const wire=(pin:number,ex:number,ey:number,color:string,port:'in'|'out',inverted=false,offset=0,bypassY?:number)=>{
  const s=loc(pin);let path:string;
  if((s.left&&port==='in')||(!s.left&&port==='out'))path=`M${s.x} ${s.y} H${s.left?340+offset:760-offset} V${ey} H${ex}`;
  else{
   const outer=port==='in'?690+offset:410-offset,routeY=bypassY??ey+(port==='in'?-48:48);
   path=`M${s.x} ${s.y} H${outer} V${routeY} H${port==='in'?ex-24-offset:ex+24+offset} V${ey} H${ex}`;
  }
  return `<g data-internal-pin="${pin}">${line(path,color)}${inverted?`<circle cx="${ex+(port==='out'?5:-5)}" cy="${ey}" r="5" fill="white" stroke="${color}" stroke-width="2"/>`:''}</g>`;
 };
 if(info.blocks.length){
  const blockGap=(height-150)/info.blocks.length;
  info.blocks.forEach((block,i)=>{
   const y=80+i*blockGap,color=colors[i%colors.length],bh=Math.min(blockGap-16,Math.max(70,block.inputs.length*17+16)),x=475,w=150;
   block.inputs.forEach((pin,k)=>svg+=wire(pin,x,y+12+k*(bh-24)/Math.max(1,block.inputs.length-1),color,'in',!!block.inverted?.includes(pin),k*4,y-14-k*3));
   block.outputs.forEach((pin,k)=>svg+=wire(pin,x+w,y+bh*(k+1)/(block.outputs.length+1),color,'out',!!block.inverted?.includes(pin),k*4,y+bh+14+k*3));
   svg+=`<g data-ic-block="${i}"><rect x="${x}" y="${y}" width="${w}" height="${bh}" rx="3" fill="white" stroke="${color}" stroke-width="2"/>${t(x+w/2,y+bh/2+5,block.title,'text-anchor="middle" class="ic-block-label"')}`;
   block.inputs.forEach((pin,k)=>{const py=y+12+k*(bh-24)/Math.max(1,block.inputs.length-1);svg+=t(x+(block.clock===pin?15:7),py+4,String(pin),'class="ic-small"');if(block.clock===pin)svg+=`<path d="M${x} ${py-6} l8 6 l-8 6" fill="none" stroke="${color}"/>`;});
   block.outputs.forEach((pin,k)=>svg+=t(x+w-8,y+bh*(k+1)/(block.outputs.length+1)+4,String(pin),'text-anchor="end" class="ic-small"'));
   if(info.definition?.gates[i]?.kind==='SCHMITT')svg+=line(`M${x+62} ${y+bh-12} h7 v-8 h12 m-12 8 v-12 h12`,color,1.3);
   svg+='</g>';
  });
 }else{
  const y=48,h=height-78;
  svg+=`<g data-ic-functional-block="true"><rect x="420" y="${y}" width="260" height="${h}" rx="8" fill="white" stroke="#2563eb" stroke-width="2"/>`;
  for(const pin of info.pins.filter(p=>p.role!=='nc'&&p.role!=='power')){
   const s=loc(pin.number);svg+=`<g data-internal-pin="${pin.number}">${line(`M${s.x} ${s.y} H${s.left?420:680}`,'#64748b',1.3)}</g>`;
  }
  const stages=info.stages.length?info.stages:[info.part],gap=Math.min(105,(h-40)/stages.length),start=y+(h-gap*stages.length)/2;
  stages.forEach((stage,i)=>{
   const by=start+i*gap;
   svg+=`<g data-ic-stage="${i}"><rect x="444" y="${by}" width="212" height="${gap-27}" rx="5" fill="#eff6ff" stroke="#93c5fd"/>${t(550,by+(gap-27)/2+5,stage,'text-anchor="middle"')}</g>`;
   if(i<stages.length-1)svg+=line(`M550 ${by+gap-27} v20 m-4 -5 l4 5 l4 -5`,'#2563eb');
  });
  svg+='</g>';
 }
 for(const pin of info.pins.filter(p=>p.role==='power')){
  const s=loc(pin.number),supply=pin.number===info.vcc,railY=supply?43:height-18;
  svg+=`<g data-internal-power="${pin.number}">${line(`M${s.x} ${s.y} H${s.left?300:800} V${railY} H${supply?390:710}`,'#94a3b8',1.2)}</g>`;
 }
 for(const pin of info.pins){
  const s=loc(pin.number),tx=s.left?210:890;
  svg+=`<g data-pin="${pin.number}">${line(`M${s.left?215:885} ${s.y} H${s.x}`,'#334155',2)}${t(tx,s.y-5,(info.physical?'':'T')+pin.number+' '+pin.name,`text-anchor="${s.left?'end':'start'}" class="ic-pin-number"`)}${t(tx,s.y+14,pin.role==='nc'?'NC':'—',`text-anchor="${s.left?'end':'start'}" class="ic-pin-value" data-pin-voltage="${pin.number}"`)}</g>`;
 }
 svg+=t(550,height+19,caption,'text-anchor="middle" class="ic-small"')+'</svg>';
 return svg;
}
