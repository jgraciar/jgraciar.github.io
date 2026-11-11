import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const [dir,repo]=process.argv.slice(2);
assert(dir&&repo,'Uso: add-teaching-examples.mjs <ts-src> <repo>');
const src=join(repo,'examples','circuit-jgr');
const manifest=JSON.parse(readFileSync(join(src,'manifest.json'),'utf8'));
assert.equal(manifest.length,16);
const dest=join(dir,'public','circuits','jgr');
mkdirSync(dest,{recursive:true});
for(const item of manifest){
 assert(/^[a-zA-Z0-9._-]+\.txt$/.test(item.file));
 assert(item.label&&['comb','feedback','bistable','counter'].includes(item.category));
 const from=join(src,item.file),to=join(dest,item.file);
 const original=readFileSync(from,'utf8');
 assert(/^<cir(?:\s|>)/.test(original)&&/<\/cir>\s*$/.test(original),'XML incorrecto: '+item.file);
 copyFileSync(from,to);
 assert.equal(readFileSync(to,'utf8'),original,'El ejemplo se ha modificado: '+item.file);
}
const items=kind=>manifest.filter(x=>x.category===kind).map(x=>'jgr/'+x.file+' '+x.label);
const extra=[
 '+8.6 Lógica combinacional',...items('comb'),'-',
 '+8.7 Lógica secuencial',...items('feedback'),
 '+8.7.2 Biestables',...items('bistable'),'-',
 '+8.7.3 Contadores',...items('counter'),'-',
 '-'
];
const file=join(dir,'public','setuplist.txt');
let list=readFileSync(file,'utf8');
const anchor='+Circuit JGR\n';
assert.equal(list.split(anchor).length,2,'Se esperaba un único submenú Circuit JGR');
assert(!list.includes('jgr/8.6.1-codificador-4a2.txt'),'Ejemplos duplicados');
list=list.replace(anchor,anchor+extra.join('\n')+'\n');
writeFileSync(file,list);
for(const item of manifest)assert(list.includes('jgr/'+item.file+' '+item.label));
for(const previous of ['cd4026-practice.xml','7493-practice.xml','74191-practice.xml'])
 assert(list.includes(previous),'Ejemplo anterior perdido: '+previous);
console.log('OK: 16 circuitos docentes originales incorporados a Circuitos > Circuit JGR.');
