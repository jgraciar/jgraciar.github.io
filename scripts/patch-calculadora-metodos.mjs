import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const dir=resolve(process.argv[2]||'');
assert(process.argv[2],'Uso: node patch-calculadora-metodos.mjs <directorio>');
function replaceOnce(text,from,to){
 assert.equal(text.split(from).length,2,'No se encuentra un único anclaje: '+from.slice(0,100));
 return text.replace(from,to);
}
let html=readFileSync(join(dir,'index.html'),'utf8');
let app=readFileSync(join(dir,'app.js'),'utf8');
if(!html.includes('value="equalization"')){
 html=replaceOnce(html,'<option value="rank">Analizar la compatibilidad</option>',
  '<option value="rank">Analizar la compatibilidad</option><option value="equalization">Resolver por igualación</option><option value="elimination">Resolver por reducción</option><option value="substitution">Resolver por sustitución</option><option value="auto">Automático · métodos algebraicos</option>');
 html=replaceOnce(html,'<script src="app.js"></script>','<script src="classical.js"></script><script src="app.js"></script>');
 html=replaceOnce(html,'<p>Los cálculos son exactos con fracciones.',
  '<p>Igualación, reducción y sustitución muestran las operaciones con ecuaciones. Con más de dos incógnitas, se eliminan sucesivamente y se recuperan sus valores. Automático compara el número estimado de operaciones de estos tres métodos. El selector funciona en las dos pestañas y conserva las ecuaciones al cambiar de método.</p><p>Los cálculos son exactos con fracciones.');
 app=replaceOnce(app," if(useGauss){html+=", " if(classicalNames[method]||method==='auto')html+=renderClassical(A,b,vars,method);\n if(useGauss){html+=");
 writeFileSync(join(dir,'index.html'),html);
 writeFileSync(join(dir,'app.js'),app);
}
copyFileSync(join(dirname(fileURLToPath(import.meta.url)),'CalculatorClassical.js'),join(dir,'classical.js'));
// Método inicial automático y solución al principio, como en Cramer.
if(!html.includes('<option value="auto" selected>')){
 html=replaceOnce(html,'<option value="cramer" selected>','<option value="cramer">');
 html=replaceOnce(html,'<option value="auto">','<option value="auto" selected>');
 writeFileSync(join(dir,'index.html'),html);
}
if(!app.includes('const algebraic=Boolean(classicalNames[method]')){
 app=replaceOnce(app," if(classicalNames[method]||method==='auto')html+=renderClassical(A,b,vars,method);\n",'');
 app=replaceOnce(app," if(s.x){html+='<div class=\"answer\">'",
  " const algebraic=Boolean(classicalNames[method]||method==='auto');\n if(s.x){html+='<div class=\"answer\">'");
 const matrixLine=app.split('\n').find(line=>line.startsWith(" html+='<h3>Sistema en forma matricial</h3>"));
 assert(matrixLine,'Falta la presentación matricial original');
 app=replaceOnce(app,matrixLine,' if(!algebraic){'+matrixLine.trim()+'}');
}
const oldPosition=" if(algebraic)html+=renderClassical(A,b,vars,method)+'<h3>Solución</h3>';\n";
if(app.includes(oldPosition))app=replaceOnce(app,oldPosition,'');
if(!app.includes(' if(algebraic)html+=renderClassical(A,b,vars,method);')){
 app=replaceOnce(app,' if(useGauss){html+=',' if(algebraic)html+=renderClassical(A,b,vars,method);\n if(useGauss){html+=');
}
writeFileSync(join(dir,'app.js'),app);
console.log('OK: igualación, reducción, sustitución y automático en ambas pestañas; se conservan los cuatro métodos anteriores.');
