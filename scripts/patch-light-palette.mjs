// Paleta clara del circuito y de todos los osciloscopios.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];
function patch(file, edits){let s=readFileSync(join(dir,file),'utf8');for(const [a,b] of edits){assert(s.includes(a),`${file}: no se encuentra ${a.slice(0,70)}`);s=s.replaceAll(a,b);}writeFileSync(join(dir,file),s);}
patch('UIManager.ts',[
 ['let printable = false;', 'let printable = true;'],
 ['this.getOptionFromStorage("whiteBackground", false)', 'this.getOptionFromStorage("whiteBackground", true)'],
 ['        if (this.menus.printableCheckItem.getState()) {\n            CircuitElm.whiteColor', `        // Reapply theme defaults when switching background, retaining saved custom colors.
        const lightPalette = this.menus.printableCheckItem.getState();
        if (this.jgrLightPalette !== lightPalette) {
            this.jgrLightPalette = lightPalette;
            this.setColors(null, null, null, null, null);
            for (const scope of this.scopeManager.scopes) {
                if (scope) { scope.calcVisiblePlots(); scope.resetGraph(); }
            }
        }
        if (this.menus.printableCheckItem.getState()) {
            CircuitElm.whiteColor`],
 ['    setColors(positiveColor:', '    private jgrLightPalette: boolean | undefined;\n\n    setColors(positiveColor:'],
 ['CircuitElm.positiveColor = Color.green;', 'CircuitElm.positiveColor = this.app.isPrintable() ? new Color("#007A3D") : Color.green;'],
 ['CircuitElm.negativeColor = Color.red;', 'CircuitElm.negativeColor = this.app.isPrintable() ? new Color("#C62828") : Color.red;'],
 ['CircuitElm.neutralColor = Color.gray;', 'CircuitElm.neutralColor = this.app.isPrintable() ? new Color("#777777") : Color.gray;'],
 ['CircuitElm.selectColor = Color.cyan;', 'CircuitElm.selectColor = this.app.isPrintable() ? new Color("#005FCC") : Color.cyan;'],
 ['CircuitElm.currentColor = this.menus.conventionCheckItem.getState() ? Color.yellow : Color.cyan;', 'CircuitElm.currentColor = this.app.isPrintable() ? new Color(this.menus.conventionCheckItem.getState() ? "#6A1B9A" : "#006B80") : (this.menus.conventionCheckItem.getState() ? Color.yellow : Color.cyan);']
]);
patch('UIManager.ts', [['cc === "#ffff00" || cc === "#00ffff"', 'cc === "#ffff00" || cc === "#00ffff" || cc.toLowerCase() === "#6a1b9a" || cc.toLowerCase() === "#006b80"']]);
// White halo separates moving dots from wires of either polarity.
patch('CircuitElm.ts',[[
 '            g.fillRect(x0-2, y0-2, 4, 4);',
 `            if (CircuitElm.app.isPrintable()) {
                g.setColor(Color.white);
                g.fillRect(x0-3, y0-3, 6, 6);
                g.setColor(CircuitElm.currentColor);
            }
            g.fillRect(x0-2, y0-2, 4, 4);`
]]);
patch('ScopePlot.ts',[
 ['this.color = ScopePlot.colors[(count - 1) % 8];', 'this.color = (CirSim.theApp.isPrintable() ? ["#C62828", "#A64B00", "#9C267C", "#6036A6", "#005FCC", "#007C91", "#766000", "#3D6473"] : ScopePlot.colors)[(count - 1) % 8];'],
 ['"#A0A000" : "#FFFF00"', '"#6A1B9A" : "#FFFF00"']
]);
patch('Scope.ts',[
 ['minorDiv = "#D0D0D0";', 'minorDiv = "#E2E5E9";'],
 ['majorDiv = "#808080";', 'majorDiv = "#9AA2AC";'],
 ['this.curColor = "#A0A000";', 'this.curColor = "#6A1B9A";'],
 ['this.app.isPrintable() ? "#eee" : "#111"', 'this.app.isPrintable() ? "#ffffff" : "#111"']
]);
patch('ScopePlot2d.ts',[
 ['this.scope.app.isPrintable() ? "#eee" : "#111"', 'this.scope.app.isPrintable() ? "#ffffff" : "#111"'],
 ['g.setColor(Color.yellow);', 'g.setColor(this.scope.app.isPrintable() ? new Color("#6A1B9A") : Color.yellow);']
]);
console.log('OK: paleta clara, corriente con halo y osciloscopios blancos.');
