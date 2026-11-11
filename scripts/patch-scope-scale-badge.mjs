import assert from 'node:assert/strict';
import{readFileSync,writeFileSync,copyFileSync}from'node:fs';
import{join}from'node:path';
const dir=process.argv[2];
function patch(name,from,to){const path=join(dir,name);const s=readFileSync(path,'utf8');assert(s.includes(from),name+': scale badge anchor missing');writeFileSync(path,s.replace(from,to));}
copyFileSync(new URL('./CircuitJGRScopeScale.ts',import.meta.url),join(dir,'CircuitJGRScopeScale.ts'));
const overlays=join(dir,'ScopeOverlays.ts');let s=readFileSync(overlays,'utf8');
s='import {drawScopeScaleBadge} from "./CircuitJGRScopeScale";\n'+s;
const start=s.indexOf('    drawScale(g: Graphics): void {');const end=s.indexOf('    // shared cycle-detection',start);assert(start>=0&&end>start);
s=s.slice(0,start)+`    private scaleBadge={width:0,height:0};
    drawScale(g: Graphics): void {
        this.scaleBadge=drawScopeScaleBadge(this.scope,g);
    }

`+s.slice(end);writeFileSync(overlays,s);
patch('ScopeOverlays.ts','        this.textY = 10;','        this.textY = 10;\n        this.scaleBadge={width:0,height:0};');
patch('ScopeOverlays.ts','        g.drawString(text, 0, this.textY);',`        if(this.textY<this.scaleBadge.height+10 && g.measureWidth(text)>this.scope.rect.width-this.scaleBadge.width-4)
            this.textY=this.scaleBadge.height+14;
        g.drawString(text, 0, this.textY);`);
patch('ScopeOverlays.ts','    drawLegend(g: Graphics): void {','    drawLegend(g: Graphics): void {\n        if(this.textY<this.scaleBadge.height+10)this.textY=this.scaleBadge.height+14;');
patch('Scope.ts','showScale: boolean = false;','showScale: boolean = true;');
patch('Scope.ts','        this.showScale = this.showFreq = this.manualScale = this.showMin = this.showP2P = this.showElmInfo = false;', '        this.showScale = true;\n        this.showFreq = this.manualScale = this.showMin = this.showP2P = this.showElmInfo = false;');
// Bit 28 marks explicit scale visibility. Bits 25–27 belong to legacy trigger flags.
patch('ScopeSerializer.ts','        let flags = (this.scope.showI ? 1 : 0)', '        let flags = (1 << 28) | (1 << 29) | (this.scope.showI ? 1 : 0)');
patch('ScopeSerializer.ts','        this.scope.showScale = (flags & 512) !== 0;','        this.scope.showScale = (flags & (1 << 28)) === 0 || (flags & 512) !== 0;');
patch('ScopePlot2d.ts',`            this.scope.drawInfoText(g, "X=" + spx.getUnitText(spx.manScale) + "/div, Y=" + spy.getUnitText(spy.manScale) + "/div");`, '            this.scope.overlays.drawScale(g);');
console.log('OK: live top-right scope scales, real units per division and preserved explicit visibility.');

patch('Scope.ts','maxScale: boolean = false;','maxScale: boolean = true;');
patch('Scope.ts','        this.showMax = true;','        this.showMax = true;\n        this.maxScale = true;');
// Bit 29 preserves explicit Auto / Auto (Max Scale) choices after migration.
patch('ScopeSerializer.ts','        this.scope.maxScale = (flags & 8192) !== 0;',
 '        this.scope.maxScale = (flags & (1 << 29)) !== 0 ? (flags & 8192) !== 0 : !this.scope.manualScale;');

patch('Scope.ts','gridMax = (mx - mn) * 0.55;', 'gridMax = Math.max((mx - mn) * 0.55, 1e-12);');
