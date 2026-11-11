import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];
function patch(file,before,after){
 const path=join(dir,file),source=readFileSync(path,'utf8');
 assert(source.split(before).length===2,file+': no se localiza un único anclaje para el grosor de línea');
 writeFileSync(path,source.replace(before,after));
}
patch('Scope.ts','showScale: boolean = true;',
 'showScale: boolean = true;\n    traceWidth: number = 2;');
patch('Scope.ts','        this.speed = 64;','        this.speed = 64;\n        this.traceWidth = 2;');
patch('Scope.ts','        g.setColor(color);\n        if (this.isManualScale()) {',
 '        g.setColor(color);\n        g.setLineWidth(this.traceWidth);\n        if (this.isManualScale()) {');
patch('Scope.ts',`        if (ox !== -1)
            g.drawLine(ox, maxy - oy, i - 1, maxy - oy);
    }`,
`        if (ox !== -1)
            g.drawLine(ox, maxy - oy, i - 1, maxy - oy);
        g.setLineWidth(1);
    }`);
patch('ScopeSerializer.ts','        CircuitXMLSerializer.dumpAttr(xmlElm, "p", this.scope.position);',
 '        CircuitXMLSerializer.dumpAttr(xmlElm, "p", this.scope.position);\n        if (this.scope.traceWidth !== 2) CircuitXMLSerializer.dumpAttr(xmlElm, "lw", this.scope.traceWidth);');
patch('ScopeSerializer.ts','        this.scope.manDivisions = xml.parseIntAttr("md", 8);',
 '        this.scope.manDivisions = xml.parseIntAttr("md", 8);\n        this.scope.traceWidth = Math.max(1, Math.min(4, xml.parseIntAttr("lw", 2)));');
patch('ScopePropertiesDialog.ts','        hContent.appendChild(hRow);',
`        hContent.appendChild(hRow);
        // Grosor de trazo por osciloscopio. Es una propiedad visual,
        // independiente de la escala y de los valores eléctricos.
        const traceRow = document.createElement('div');
        traceRow.className = 'jgr-trace-width';
        traceRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-top:10px;';
        const traceLabel = document.createElement('label');
        const traceLanguages: Record<string,string> = {
            en:'Line width',es:'Grosor de línea',ca:'Gruix de línia',
            'ca-es-valencia':'Grossor de línia',gl:'Grosor da liña',eu:'Lerroaren lodiera',
            fr:'Épaisseur du trait',de:'Linienstärke',it:'Spessore della linea',
            pt:'Espessura da linha',nl:'Lijndikte',pl:'Grubość linii',
            sv:'Linjetjocklek',da:'Linjetykkelse',nb:'Linjetykkelse',
            fi:'Viivan paksuus',csx:'Tloušťka čáry',cs:'Tloušťka čáry',
            ru:'Толщина линии',zh:'线条粗细','zh-tw':'線條粗細',
            ja:'線の太さ',kr:'선 두께',ko:'선 두께'
        };
        const traceLang = document.documentElement.lang.toLowerCase();
        traceLabel.textContent = traceLanguages[traceLang] ?? traceLanguages[traceLang.split('-')[0]] ?? traceLanguages.en;
        traceRow.appendChild(traceLabel);
        const traceSelect = document.createElement('select');
        traceSelect.id = 'jgr-trace-width';
        for (const width of [1,2,3,4]) {
            const option = document.createElement('option');
            option.value=String(width);option.textContent=width+' px';
            traceSelect.appendChild(option);
        }
        traceSelect.value=String(scope.traceWidth);
        traceSelect.addEventListener('change',()=>{
            scope.traceWidth=Number(traceSelect.value);
            app.ui.repaint();
        });
        traceRow.appendChild(traceSelect);
        hContent.appendChild(traceRow);`);
console.log('OK: grosor de líneas independiente en propiedades de cada osciloscopio, guardado en XML.');
