import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];
function patch(file,before,after){
 const path=join(dir,file),original=readFileSync(path,'utf8');
 assert(original.split(before).length===2,file+': falta el anclaje único de identificación');
 writeFileSync(path,original.replace(before,after));
}
// Se identifica el elemento físico, no su posición o número de osciloscopio.
// El índice se calcula en cada dibujo y coincide con el marcador del circuito.
patch('Scope.ts',`            if (t === null)
                return "";
            return Locale.LS(t);`,
`            if (t === null)
                return "";
            const source = (this.selectedPlot >= 0 && this.selectedPlot < this.visiblePlots.length)
                ? this.visiblePlots[this.selectedPlot] : this.visiblePlots[0];
            const elementIndex = source?.elm ? this.app.locateElm(source.elm) : -1;
            return Locale.LS(t) + (elementIndex >= 0 ? " · E" + (elementIndex + 1) : "");`);
// Las leyendas de osciloscopios combinados deben indicar el origen de cada curva.
patch('ScopeOverlays.ts',`            const label = (plot.elm !== null) ? Locale.LS(plot.elm.getScopeText(plot.value)) : ("Plot " + (i + 1));`,
`            const sourceIndex = plot.elm ? this.scope.app.locateElm(plot.elm) : -1;
            const label = (plot.elm !== null) ? Locale.LS(plot.elm.getScopeText(plot.value))
                + (sourceIndex >= 0 ? " · E" + (sourceIndex + 1) : "") : ("Plot " + (i + 1));`);
patch('ScopeOverlays.ts','        const t = embedded ? this.scope.text : this.scope.getScopeLabelOrText(true);',
 '        const t = embedded ? (this.scope.text ?? this.scope.getScopeLabelOrText(true)) : this.scope.getScopeLabelOrText(true);');
// Marcador temporal junto al elemento cuando el cursor está sobre una curva.
// No añade números permanentes que puedan saturar los esquemas grandes.
patch('UIManager.ts',`        this.drawBottomArea(g);
        perfmon.stopContext();`,
`        this.drawBottomArea(g);
        // Vincular la curva con su componente sin alterar el esquema guardado.
        const sourceScope = Scope.cursorScope;
        const sourcePlot = sourceScope?.visiblePlots?.[
            sourceScope.selectedPlot >= 0 ? sourceScope.selectedPlot : 0];
        const sourceElement = sourcePlot?.elm;
        if (sourceElement != null && !this.app.modalDialogIsShowing()) {
            const sourceIndex = this.app.locateElm(sourceElement);
            const bounds = sourceElement.getBoundingBox();
            if (sourceIndex >= 0 && bounds != null) {
                this.cvcontext.save();
                this.cvcontext.setTransform(
                    this.app.transform[0] * scale, 0, 0,
                    this.app.transform[3] * scale,
                    this.app.transform[4] * scale, this.app.transform[5] * scale);
                const tag = 'E' + (sourceIndex + 1);
                const x = bounds.x + bounds.width / 2;
                const y = bounds.y - 12;
                const width = Math.max(26, tag.length * 8 + 8);
                g.setColor(this.menus.printableCheckItem.getState() ? '#175fba' : '#ffdd55');
                g.fillRect(x - width / 2, y - 14, width, 17);
                g.setColor(this.menus.printableCheckItem.getState() ? '#ffffff' : '#111111');
                g.drawString(tag, x - width / 2 + 4, y - 2);
                this.cvcontext.restore();
            }
        }
        perfmon.stopContext();`);
console.log('OK: etiquetas E# automáticas para osciloscopios sin nombre, leyendas y marcador al señalar la curva.');
