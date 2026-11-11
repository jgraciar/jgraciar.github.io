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
        this.jgrScopeInfo.style.cssText = 'display:block;padding:6px 8px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.4 sans-serif;font-variant-numeric:tabular-nums;max-height:180px;overflow-y:auto;';
        // La información se sitúa a continuación del nombre del circuito,
        // que se crea más abajo en el constructor.`);
patch('UIManager.ts', '        this.verticalPanel.appendChild(this.titleLabel);',
`        this.verticalPanel.appendChild(this.titleLabel);
        this.verticalPanel.appendChild(this.jgrScopeInfo);`);
patch('UIManager.ts',`        g.setColor(CircuitElm.whiteColor);

        if (this.app.stopMessage != null) {`,
`        g.setColor(CircuitElm.whiteColor);
        // Estado temporal visible incluso sin osciloscopios o con el puntero sobre un elemento.
        const jgrNominalSteprate = 160 * this.app.getIterCount();
        const jgrTimerate = jgrNominalSteprate * this.app.sim.timeStep;
        let jgrSimulationTime = "t = " + CircuitElm.getTimeText(this.app.sim.t);
        if (jgrTimerate >= 0.1 && this.steprate >= jgrNominalSteprate * 0.9)
            jgrSimulationTime += " (" + CircuitElm.showFormat.format(jgrTimerate) + "x)";
        this.jgrScopeInfo.textContent = jgrSimulationTime + '\\n'
            + Locale.LS("time step = ") + CircuitElm.getTimeText(this.app.sim.timeStep);

        if (this.app.stopMessage != null) {`);
patch('UIManager.ts',`            const ybase = this.app.circuitArea.height - h;
            for (i = 0; info[i] != null; i++)
                g.drawString(info[i]!, x, ybase + 15 * (i + 1));`,
`            // Mostrar la información contextual bajo el tiempo y el nombre
            // del circuito, tanto si hay osciloscopios como si no.
            const jgrDetails = info.slice(0, i).filter(value => value != null);
            if (this.mouse.getMouseElm() == null) jgrDetails.splice(0, 2);
            if (jgrDetails.length > 0)
                this.jgrScopeInfo.textContent += '\\n' + jgrDetails.join('\\n');`);
console.log('OK: nombre de circuito, tiempo, paso temporal e información del componente en el panel lateral.');
