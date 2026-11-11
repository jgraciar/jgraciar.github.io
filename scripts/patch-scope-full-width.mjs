import assert from 'node:assert/strict';
import {readFileSync,writeFileSync}from'node:fs';
import {join}from'node:path';
const dir=process.argv[2];
function patch(name,from,to){const path=join(dir,name);const s=readFileSync(path,'utf8');assert(s.includes(from),`${name}: full-width scope anchor missing`);writeFileSync(path,s.replace(from,to));}
patch('ScopeManager.ts',`        let iw = CirSim.infoWidth;
        if (colct <= 2)
            iw = Math.trunc(iw * 3 / 2);
        let w = Math.trunc((ui.canvasWidth - iw) / colct);`,
`        // Status now lives in the existing controls panel, not beside the plots.
        let w = Math.trunc(ui.canvasWidth / colct);`);
patch('UIManager.ts','    setColors(positiveColor:', '    private jgrScopeInfo!: HTMLDivElement;\n\n    setColors(positiveColor:');
patch('UIManager.ts',`        this.buttonPanel.appendChild(this.runStopButton);`,
`        this.buttonPanel.appendChild(this.runStopButton);
        this.jgrScopeInfo = document.createElement('div');
        this.jgrScopeInfo.id = 'jgr-scope-info';
        this.jgrScopeInfo.style.cssText = 'display:none;padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.4 sans-serif;font-variant-numeric:tabular-nums;max-height:180px;overflow-y:auto;';
        this.verticalPanel.appendChild(this.jgrScopeInfo);`);
patch('UIManager.ts',`        g.setColor(CircuitElm.whiteColor);

        if (this.app.stopMessage != null) {`,
`        g.setColor(CircuitElm.whiteColor);
        this.jgrScopeInfo.style.display = 'none';

        if (this.app.stopMessage != null) {`);
patch('UIManager.ts',`            const ybase = this.app.circuitArea.height - h;`,
`            if (ct !== 0) {
                this.jgrScopeInfo.textContent = info.slice(0, i).filter(value => value != null).join('\\n');
                this.jgrScopeInfo.style.display = 'block';
                return;
            }
            const ybase = this.app.circuitArea.height - h;`);
console.log('OK: scopes use the entire canvas width; time, timestep and component details remain in the existing controls panel.');
