import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
const [dir,repo]=process.argv.slice(2);
assert(dir&&repo);
const root=join(repo,'examples','circuit-jgr');
const manifest=JSON.parse(readFileSync(join(root,'manifest.json'),'utf8'));
const list=readFileSync(join(dir,'public','setuplist.txt'),'utf8');
assert.equal(manifest.length,16);
assert.equal(list.split('+Circuit JGR\n').length-1,1);
for(const cat of ['comb','feedback','bistable','counter'])assert(manifest.some(x=>x.category===cat));
for(const item of manifest){
 const a=readFileSync(join(root,item.file)),b=readFileSync(join(dir,'public','circuits','jgr',item.file));
 assert(a.equals(b),'Contenido alterado: '+item.file);
 assert(list.includes('jgr/'+item.file+' '+item.label),'Falta enlace en Circuit JGR: '+item.file);
}
for(const x of ['cd4026-practice.xml','7493-practice.xml','74191-practice.xml'])
 assert(list.includes(x),'Se ha perdido '+x);
console.log('OK: 16/16 ejemplos preservados y tres anteriores intactos.');
