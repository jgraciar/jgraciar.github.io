import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const file=join(process.argv[2],'ScopeOverlays.ts');let s=readFileSync(file,'utf8');
function patch(a,b){assert(s.split(a).length===2,'Scope overlay anchor: '+a);s=s.replace(a,b);}
patch('import {drawScopeScaleBadge}', 'import {drawScopeScaleBadge,drawScopeTextBackground}');
patch('        g.drawString(text, 0, this.textY);', '        drawScopeTextBackground(this.scope,g,text,0,this.textY);\n        g.drawString(text, 0, this.textY);');
patch('            g.setColor(plot.color);\n            g.fillRect(0, this.textY - 9, 10, 10);','            drawScopeTextBackground(this.scope,g,label,0,this.textY,16);\n            g.setColor(plot.color);\n            g.fillRect(0, this.textY - 9, 10, 10);');
patch('            g.drawString(Locale.LS("Min=") + plot.getUnitText(this.scope.minValue), 0, ym);','            const minText=Locale.LS("Min=") + plot.getUnitText(this.scope.minValue);\n            drawScopeTextBackground(this.scope,g,minText,0,ym);\n            g.drawString(minText, 0, ym);');
writeFileSync(file,s);
console.log('OK: translucent backgrounds for scope values, legends and scale badges');
