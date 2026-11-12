import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const [dir,repo]=process.argv.slice(2);
assert(dir&&repo,'Uso: add-teaching-examples.mjs <ts-src> <repo>');
const src=join(repo,'examples','circuit-jgr');
const manifest=JSON.parse(readFileSync(join(src,'manifest.json'),'utf8'));
assert.equal(manifest.length,48,'Deben conservarse los 48 ejemplos docentes');
const types=['sop','pos','mapa','logic','encoder','decoder','mux','feedback','rs','jk','d','t','counter'];
assert(manifest.every(x=>types.includes(x.type)),'Hay ejemplos sin clasificar');
assert.equal(new Set(manifest.map(x=>x.file)).size,manifest.length,'Ejemplos docentes duplicados');
const dest=join(dir,'public','circuits','jgr');
mkdirSync(dest,{recursive:true});
for(const item of manifest){
 assert(/^[a-zA-Z0-9._-]+\.txt$/.test(item.file));
 assert(item.label&&['comb','feedback','bistable','counter'].includes(item.category));
 const from=join(src,item.file),to=join(dest,item.file);
 const original=readFileSync(from,'utf8');
 assert(/^<cir(?:\s|>)/.test(original)&&/<\/cir>\s*$/.test(original),'XML incorrecto: '+item.file);
 copyFileSync(from,to);
 assert.equal(readFileSync(to,'utf8'),original,'Se ha modificado el circuito original: '+item.file);
}
const byType=type=>manifest.filter(x=>x.type===type).map(x=>'jgr/'+x.file+' '+x.label);
for(const type of types)assert(byType(type).length>0,'Tipo sin ejemplos: '+type);
const group=(label,items)=>['+'+label,...items,'-'];
const file=join(dir,'public','setuplist.txt');
let list=readFileSync(file,'utf8');
const originalLines=list.split(/\r?\n/);
const previousFiles=['cd4026-practice.xml','7493-practice.xml','74191-practice.xml'];
const previous=[];
for(const name of previousFiles){
 const found=originalLines.filter(line=>line.startsWith(name+' '));
 assert.equal(found.length,1,'Falta o está duplicado el circuito integrado '+name);
 previous.push(found[0]); // Conservar nombre y descripción original, sin retocarlos.
}
const withoutTopLevelCopies=originalLines.filter(line=>!previous.includes(line)).join('\n');
const extra=[
 ...group('Lógica combinacional',[
  ...group('Suma de productos (SOP)',byType('sop')),
  ...group('Producto de sumas (POS)',byType('pos')),
  ...group('Mapas de Karnaugh',byType('mapa')),
  ...group('Circuitos lógicos',byType('logic')),
  ...group('Codificadores',byType('encoder')),
  ...group('Decodificadores',byType('decoder')),
  ...group('Multiplexores y demultiplexores',byType('mux'))
 ]),
 ...group('Lógica secuencial',[
  ...group('Circuitos realimentados',byType('feedback')),
  ...group('Biestables',[
   ...group('RS',byType('rs')),
   ...group('JK',byType('jk')),
   ...group('D',byType('d')),
   ...group('T',byType('t'))
  ]),
  ...group('Contadores',[
   ...group('Con biestables JK',byType('counter')),
   ...group('Circuitos integrados',previous)
  ])
 ])
];
const anchor='+Circuit JGR\n';
assert.equal(withoutTopLevelCopies.split(anchor).length,2,'Se esperaba un único submenú Circuit JGR');
assert(!withoutTopLevelCopies.includes('jgr/8.6.1-codificador-4a2.txt'),'Ejemplos docentes duplicados');
list=withoutTopLevelCopies.replace(anchor,anchor+extra.join('\n')+'\n');
writeFileSync(file,list);
for(const item of manifest)assert.equal(list.split('jgr/'+item.file+' '+item.label).length-1,1,
 'El ejemplo debe aparecer exactamente una vez en el menú: '+item.file);
for(const previousLine of previous)assert.equal(list.split(previousLine).length-1,1,
 'El ejemplo de integrado debe aparecer exactamente una vez: '+previousLine);
console.log('OK: 51 ejemplos en Circuit JGR clasificados por función (48 docentes y 3 integrados), sin modificar los archivos ni sus nombres.');
