import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,join} from 'node:path';

// Reorganiza la calculadora sin modificar sus cálculos ni sus ejemplos.
const directory=resolve(process.argv[2]||'');
assert(process.argv[2], 'Uso: node layout-calculadora.mjs <directorio>');
const load=name=>readFileSync(join(directory,name),'utf8');
const save=(name,contents)=>writeFileSync(join(directory,name),contents);
function replaceOnce(text,from,to){
  assert.equal(text.split(from).length,2,'No se encuentra el anclaje de diseño: '+from.slice(0,60));
  return text.replace(from,to);
}

let html=load('index.html');
if(!html.includes('class="workbench"')){
  const start=html.indexOf('<section class="examples">');
  const end=html.indexOf('<details class="help">');
  assert(start>0 && end>start,'No se encuentra el bloque de ejemplos');
  const examples=html.slice(start,end).trimEnd();
  html=html.slice(0,start)+html.slice(end);
  html=replaceOnce(html,'<nav class="tabs"',
    '<div class="workbench"><section class="entry-pane" aria-label="Sistema de ecuaciones"><nav class="tabs"');
  html=replaceOnce(html,'</form>\n<div class="display-options">',
    '</form>\n'+examples+'\n</section>\n<aside class="output-pane" aria-label="Resolución del sistema">\n<h2 class="output-title">Resultado</h2>\n<div class="display-options">');
  html=replaceOnce(html,'<section id="result" aria-live="polite" hidden></section>\n<details class="help">',
    '<section id="result" aria-live="polite" hidden></section>\n<p class="result-placeholder">Introduce un sistema y pulsa «Resolver» para ver su solución y desarrollo.</p>\n</aside>\n</div>\n<details class="help">');
  save('index.html',html);
}

let css=load('style.css');
if(!css.includes('/* Calculadora: sistema a la izquierda y resultado a la derecha */')){
  css+='\n'+[
    '/* Calculadora: sistema a la izquierda y resultado a la derecha */',
    'main{max-width:1680px}',
    '.workbench{display:grid;grid-template-columns:minmax(0,1.12fr) minmax(0,1fr);gap:clamp(24px,2.8vw,46px);align-items:stretch}',
    '.entry-pane,.output-pane{min-width:0}',
    '.output-pane{border-left:2px solid #a9bdcd;padding-left:clamp(22px,2.5vw,40px);min-height:380px}',
    '.output-pane .output-title{font-size:21px;margin:0 0 14px}',
    '.output-pane .display-options{margin:0 0 16px}',
    '.output-pane #result{border-top:1px solid #dce3e9;margin-top:12px;padding-top:12px}',
    '.output-pane .result-placeholder{font-size:15px;color:#627585;margin:32px 0 0;max-width:420px}',
    '.output-pane #result:not([hidden]) ~ .result-placeholder,.output-pane #error:not([hidden]) ~ .result-placeholder{display:none}',
    '.output-pane .answer{flex-direction:column;align-items:flex-start;gap:8px 0}',
    '.output-pane .matrix-scroll{max-width:100%}',
    '.output-pane .matrix td{padding:6px 10px}',
    '.entry-pane .system-scroll{max-width:100%}',
    '.entry-pane .examples{margin-top:22px}',
    '@media(max-width:1100px){.workbench{display:flex;flex-direction:column;gap:24px}.entry-pane,.output-pane{width:100%}.output-pane{border-left:0;border-top:2px solid #a9bdcd;padding:20px 0 0;min-height:200px}}',
    '@media print{.workbench{display:block}.entry-pane{display:none!important}.output-pane{border:0;padding:0;min-height:0}.output-pane .result-placeholder{display:none}}'
  ].join('\n')+'\n';
  save('style.css',css);
}

let app=load('app.js');
if(app.includes('<h2>Solución</h2>')){
  app=replaceOnce(app,'<h2>Solución</h2>','');
}
// El redondeo sigue usando BigInt; solo se suprimen los ceros decimales de relleno.
const oldDecimal=app.split('\n').find(line=>line.startsWith('function decimal(q){'));
assert(oldDecimal,'No se encuentra el formateador decimal original');
if(!app.includes("const fractional=s.slice(-digits).replace(/0+$/,'');")){
  const decimalFormatter=[
    'function decimal(q){',
    " const digits=+$('precision').value,scale=10n**BigInt(digits),n=q.n<0n?-q.n:q.n;",
    ' const rounded=(n*scale*2n+q.d)/(2n*q.d);',
    " const s=rounded.toString().padStart(digits+1,'0');",
    " const whole=s.slice(0,-digits).replace(/\\B(?=(\\d{3})+(?!\\d))/g,region==='eu'?'.':',');",
    " const fractional=s.slice(-digits).replace(/0+$/,'');",
    " return (q.n<0n&&rounded!==0n?'−':'')+whole+(fractional?(region==='eu'?',':'.')+fractional:'');",
    '}'
  ].join('\n');
  app=replaceOnce(app,oldDecimal,decimalFormatter);
}
const oldHint="'Resultados con '+$('precision').value+' decimales: = indica un valor exacto; ≈ indica un valor redondeado. El desarrollo conserva las fracciones exactas.'";
const newHint="'Resultados con hasta '+$('precision').value+' decimales, sin ceros finales: = indica un valor exacto; ≈ indica un valor redondeado. El desarrollo conserva las fracciones exactas.'";
if(!app.includes(newHint))app=replaceOnce(app,oldHint,newHint);
save('app.js',app);
for(const digits of [3,4,6,10]){
  const oldLabel='>'+digits+' decimales</option>';
  if(html.includes(oldLabel))html=replaceOnce(html,oldLabel,'>Hasta '+digits+' decimales</option>');
}
save('index.html',html);
assert(html.indexOf('class="entry-pane"')<html.indexOf('id="grid"'));
assert(html.indexOf('id="grid"')<html.indexOf('class="output-pane"'));
assert(html.indexOf('class="output-pane"')<html.indexOf('id="result"'));
assert(html.indexOf('class="examples"')<html.indexOf('class="output-pane"'));
console.log('OK: sistema a la izquierda, resultado a la derecha, separador vertical y diseño adaptable.');
