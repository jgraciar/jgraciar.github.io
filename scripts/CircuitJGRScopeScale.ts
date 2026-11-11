import {CircuitElm} from './CircuitElm';
import {Locale} from './Locale';
import type {Scope} from './Scope';
import type {Graphics} from './Graphics';
export type ScaleRow={text:string;color:string};
export function scopeScaleRows(scope:Scope):ScaleRow[]{
 const plots=scope.visiblePlots;
 const plain=CircuitElm.whiteColor.getHexValue();
 const div=Locale.LS('/div');
 if(scope.plot2d.enabled){
  const xy=scope.plot2d;
  if(!scope.isManualScale())return [];// Auto XY only has centre axes, not division lines.
  const x=scope.plots[xy.validPlotIndex(xy.plotX,0)];
  const y=scope.plots[xy.validPlotIndex(xy.plotY,Math.min(1,scope.plots.length-1))];
  return x&&y?[{text:'X: '+x.getUnitText(x.manScale)+div,color:x.color},{text:'Y: '+y.getUnitText(y.manScale)+div,color:y.color}]:[];
 }
 if(!plots.length)return [];
 const rows:ScaleRow[]=[];
 if(scope.gridStepX>0)rows.push({text:'t: '+CircuitElm.getUnitText(scope.gridStepX,'s')+div,color:plain});
 if(scope.fftPlot.enabled)rows.push({text:'f: '+CircuitElm.getUnitText(1/(scope.sim.maxTimeStep*scope.speed*40),'Hz')+div,color:plain});
 const values=plots.map(p=>p.getUnitText(p.gridStepY)+div);
 if(plots.every(p=>p.gridStepY>0)){
  if(values.every(v=>v===values[0]))rows.push({text:values[0],color:plain});
  else plots.forEach((p,i)=>rows.push({text:Locale.LS('CH ')+(i+1)+': '+values[i],color:p.color}));
 }
 return rows;
}
export function drawScopeScaleBadge(scope:Scope,g:Graphics):{width:number;height:number}{
 if(!scope.showScale)return {width:0,height:0};
 const rows=scopeScaleRows(scope);
 if(!rows.length || scope.rect.width<40 || scope.rect.height<22)return {width:0,height:0};
 const gap=4,line=14;
 const width=Math.min(scope.rect.width-8,Math.ceil(Math.max(...rows.map(r=>g.measureWidth(r.text))))+12);
 const height=Math.min(scope.rect.height-8,rows.length*line+6);
 const x=scope.rect.width-width-gap;
 g.save();
 g.clipRect(x,gap,width,height);
 g.context.globalAlpha=.93;
 g.setColor(scope.app.isPrintable()?'#ffffff':'#111111');g.fillRect(x,gap,width,height);
 g.context.globalAlpha=1;
 g.context.textAlign='right';
 rows.forEach((row,i)=>{g.setColor(row.color);g.drawString(row.text,scope.rect.width-gap-6,gap+12+i*line);});
 g.restore();
 return {width:width+gap+6,height:height+gap};
}
