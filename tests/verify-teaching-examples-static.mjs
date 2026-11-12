import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const [dir,repo]=process.argv.slice(2);
assert(dir&&repo);
const root=join(repo,'examples','circuit-jgr');
const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const list=readFileSync(join(dir,'public','setuplist.txt'),'utf8');
assert.equal(manifest.length,48);
assert.equal(list.split('+Circuit JGR\n').length-1,1);
for(const cat of ['comb','feedback','bistable','counter'])assert(manifest.some(x=>x.category===cat));
const typePaths={
 sop:['Lógica combinacional','Suma de productos (SOP)'],
 pos:['Lógica combinacional','Producto de sumas (POS)'],
 mapa:['Lógica combinacional','Mapas de Karnaugh'],
 logic:['Lógica combinacional','Circuitos lógicos'],
 encoder:['Lógica combinacional','Codificadores'],
 decoder:['Lógica combinacional','Decodificadores'],
 mux:['Lógica combinacional','Multiplexores y demultiplexores'],
 feedback:['Lógica secuencial','Circuitos realimentados'],
 rs:['Lógica secuencial','Biestables','RS'],
 jk:['Lógica secuencial','Biestables','JK'],
 d:['Lógica secuencial','Biestables','D'],
 t:['Lógica secuencial','Biestables','T'],
 counter:['Lógica secuencial','Contadores','Con biestables JK']
};
const entries=new Map();
const lines=list.split(/\r?\n/);
const start=lines.indexOf('+Circuit JGR');
assert(start>=0,'Falta Circuit JGR');
const stack=[];
for(let i=start;i<lines.length;i++){
 const line=lines[i].trim();
 if(line.startsWith('+')){stack.push(line.slice(1));continue;}
 if(line==='-'){assert(stack.length>0,'Cierre de submenú sin apertura');stack.pop();if(stack.length===0)break;continue;}
 if(!line||!stack.length)continue;
 const name=line.split(' ')[0];
 assert(!entries.has(name),'Ejemplo duplicado: '+name);
 entries.set(name,{path:stack.slice(1),line});
}
for(const type of Object.keys(typePaths))assert(manifest.some(m=>m.type===type),'Tipo no representado: '+type);
for(const item of manifest){
 const a=readFileSync(join(root,item.file)),b=readFileSync(join(dir,'public','circuits','jgr',item.file));
 assert(a.equals(b),'Contenido alterado: '+item.file);
 const entry=entries.get('jgr/'+item.file);
 assert(entry,'Falta el circuito en el índice: '+item.file);
 assert.equal(entry.line,'jgr/'+item.file+' '+item.label,'Se ha cambiado el título: '+item.file);
 assert.deepEqual(entry.path,typePaths[item.type],'Clasificación incorrecta de '+item.file);
}
const integrated=['cd4026-practice.xml','7493-practice.xml','74191-practice.xml'];
for(const name of integrated){
 const e=entries.get(name);
 assert(e,'Ejemplo integrado perdido: '+name);
 assert.deepEqual(e.path,['Lógica secuencial','Contadores','Circuitos integrados'],
  'Ejemplo integrado mal clasificado: '+name);
}
assert.equal(entries.size,51,'El índice debe contener 48 ejemplos docentes y 3 circuitos integrados');
console.log('OK: 51 circuitos únicos ordenados por tipo; 48 XML preservados y 3 integrados con sus títulos originales.');
