// Preparar Circuit JGR 1.0 como entrada REAL de Vite, no como copia ni
// redirección de la versión compilada de circuitjs.html.
// Ejecutar tras los parches del motor y las traducciones, antes de npm run build.
import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {readFileSync,writeFileSync,existsSync} from "node:fs";
import {resolve,join} from "node:path";

const dir=resolve(process.argv[2]||"");
assert(process.argv[2] && existsSync(join(dir,"vite.config.ts")),
 "Uso: node prepare-circuits-jgr.mjs <directorio-ts-de-CircuitJS>");
const htmlPath=join(dir,"circuitjs.html");
const src=readFileSync(htmlPath,"utf8");
assert(src.includes("<title>CircuitJS</title>") && src.includes('src="/main.ts"'),
 "La página de origen ya no tiene la estructura esperada");
const branded=src
 .replace("<title>CircuitJS</title>","<title>Circuit JGR</title>")
 .replace("<head>","<head>\n  <meta name=\"application-name\" content=\"Circuit JGR\">");
writeFileSync(join(dir,"circuitjgr.html"),branded);
const viteFile=join(dir,"vite.config.ts");
const vite=readFileSync(viteFile,"utf8");
const entry="circuitjs: 'circuitjs.html',";
assert(vite.split(entry).length===2,"No se encuentra una única entrada Vite de CircuitJS");
writeFileSync(viteFile,vite.replace(entry,"circuitjgr: 'circuitjgr.html',"));

// Los ejemplos públicos de la distribución original se conservan,
// pero su iframe apunta ahora a la página específica de Circuit JGR.
for(const name of ["iframe.html","jsinterface.html"]){
 const target=join(dir,name);
 if(!existsSync(target))continue;
 const text=readFileSync(target,"utf8");
 writeFileSync(target,text.replaceAll("circuitjs.html","circuitjgr.html"));
}
const serviceWorker=join(dir,"service-worker.template.js");
if(existsSync(serviceWorker)){
 const text=readFileSync(serviceWorker,"utf8");
 writeFileSync(serviceWorker,text.replace("'circuitjs.html',","'circuitjgr.html',"));
}

// Identidad propia sin borrar el bloque original de créditos ni sus licencias;
// el bloque se inserta como <section> para no alterar los índices de <p>
// que usan las traducciones existentes de «Acerca de».
const about=join(dir,"circuitjs","about.html");
const html=readFileSync(about,"utf8");
assert(html.includes("<div>") && html.includes("Original by Paul Falstad."),
 "No se reconoce la página original Acerca de");
const improvementsScript=readFileSync(new URL("./circuit-jgr-improvements.js",import.meta.url),"utf8");
const identity=`
<section id="circuits-jgr-identity" style="padding:8px 10px;margin-bottom:12px;border-bottom:1px solid #888">
  <h2 style="margin:0 0 6px">Circuit JGR 1.0</h2>
  <p style="margin:3px 0"><span id="jgr-development">Desarrollo y adaptación</span>:
    <strong>Jesús Gracia Ruiz</strong> · 2026</p>
  <p style="margin:3px 0"><span id="jgr-based">Basado en</span>
    <strong>CircuitJS1 5.0.5ts</strong> (<span id="jgr-authors">Paul Falstad, Iain Sharp and contributors</span>).</p>
  <p style="margin:3px 0"><span id="jgr-license">Adaptaciones propias: GNU GPLv3</span>.
    <a href="../LICENSE-GPLv3.txt" target="_blank" rel="noopener">GPLv3</a>.
    <span id="jgr-code">Código fuente</span>:
    <a href="https://github.com/jgraciar/jgraciar.github.io" target="_blank" rel="noopener">jgraciar/jgraciar.github.io</a>.
    <span id="jgr-credits">The original credits and licenses follow.</span></p>
  <h3 id="jgr-improvements-title" style="font-size:1.05em;margin:14px 0 6px">Improvements over CircuitJS1 5.0.5ts</h3>
  <ul id="jgr-improvements-list" style="padding-left:22px;margin:0 0 12px"></ul>
</section>
<script>
(() => {
 const requested=new URLSearchParams(location.search).get("lang")||navigator.language||"es";
 const lang=requested.toLowerCase().replace(/_/g,"-");
 const code=lang.startsWith("ca-es-valencia")?"ca-es-valencia":
   ["zh-tw","zh-hant","zh-hk","zh-mo"].some(prefix=>lang.startsWith(prefix))?"zh-tw":
   lang.startsWith("cs")?"csx":lang.startsWith("ko")?"kr":
   ["no","nn","nb"].some(prefix=>lang===prefix||lang.startsWith(prefix+"-"))?"nb":
   lang.split("-")[0];
 const languages={
  es:["Desarrollo y adaptación","Basado en","Adaptaciones propias: GNU GPLv3","Código fuente","Se conservan a continuación los créditos y las licencias originales."],
  en:["Development and adaptation","Based on","Custom adaptations: GNU GPLv3","Source code","The original credits and license notices follow."],
  ca:["Desenvolupament i adaptació","Basat en","Adaptacions pròpies: GNU GPLv3","Codi font","A continuació es conserven els crèdits i les llicències originals."],
  "ca-es-valencia":["Desenvolupament i adaptació","Basat en","Adaptacions pròpies: GNU GPLv3","Codi font","A continuació es conserven els crèdits i les llicències originals."],
  gl:["Desenvolvemento e adaptación","Baseado en","Adaptacións propias: GNU GPLv3","Código fonte","A continuación consérvanse os créditos e as licenzas orixinais."],
  eu:["Garapena eta egokitzapena","Oinarritua","Norberaren egokitzapenak: GNU GPLv3","Iturburu-kodea","Jatorrizko kredituak eta lizentziak jarraian ageri dira."],
  fr:["Développement et adaptation","Basé sur","Adaptations propres : GNU GPLv3","Code source","Les crédits et licences d’origine figurent ci-dessous."],
  de:["Entwicklung und Anpassung","Basierend auf","Eigene Anpassungen: GNU GPLv3","Quellcode","Ursprüngliche Urheberangaben und Lizenzen folgen."],
  it:["Sviluppo e adattamento","Basato su","Adattamenti propri: GNU GPLv3","Codice sorgente","Seguono i riconoscimenti e le licenze originali."],
  pt:["Desenvolvimento e adaptação","Baseado em","Adaptações próprias: GNU GPLv3","Código-fonte","Seguem-se os créditos e as licenças originais."],
  nl:["Ontwikkeling en aanpassing","Gebaseerd op","Eigen aanpassingen: GNU GPLv3","Broncode","De oorspronkelijke vermeldingen en licenties volgen."],
  sv:["Utveckling och anpassning","Baserad på","Egna anpassningar: GNU GPLv3","Källkod","Ursprungliga upphovsuppgifter och licenser följer."],
  da:["Udvikling og tilpasning","Baseret på","Egne tilpasninger: GNU GPLv3","Kildekode","Originale krediteringer og licenser følger."],
  nb:["Utvikling og tilpasning","Basert på","Egne tilpasninger: GNU GPLv3","Kildekode","Opprinnelige bidragsytere og lisenser følger."],
  fi:["Kehitys ja mukautus","Perustuu ohjelmistoon","Omat mukautukset: GNU GPLv3","Lähdekoodi","Alkuperäiset tekijätiedot ja lisenssit seuraavat."],
  pl:["Rozwój i adaptacja","Na podstawie","Własne modyfikacje: GNU GPLv3","Kod źródłowy","Oryginalne informacje o autorach i licencjach znajdują się poniżej."],
  csx:["Vývoj a úpravy","Založeno na","Vlastní úpravy: GNU GPLv3","Zdrojový kód","Původní autoři a licence jsou uvedeni níže."],
  ru:["Разработка и адаптация","На основе","Собственные изменения: GNU GPLv3","Исходный код","Сведения об авторах и исходных лицензиях приведены ниже."],
  zh:["开发与改编","基于","自行修改部分：GNU GPLv3","源代码","原始作者和许可信息见下文。"],
  "zh-tw":["開發與改編","基於","自行修改部分：GNU GPLv3","原始碼","原始作者與授權資訊見下文。"],
  ja:["開発と改変","基盤","独自の変更部分：GNU GPLv3","ソースコード","元の著作者とライセンス情報は以下に記載されています。"],
  kr:["개발 및 수정","기반","독자적 변경 사항: GNU GPLv3","소스 코드","원저작자 및 라이선스 정보는 아래에 있습니다."]
 };
 const contributors={
   en:"Paul Falstad, Iain Sharp and contributors",
   es:"Paul Falstad, Iain Sharp y colaboradores",
   "ca-es-valencia":"Paul Falstad, Iain Sharp i col·laboradors",
   ca:"Paul Falstad, Iain Sharp i col·laboradors",
   gl:"Paul Falstad, Iain Sharp e colaboradores",
   eu:"Paul Falstad, Iain Sharp eta laguntzaileak",
   csx:"Paul Falstad, Iain Sharp a přispěvatelé",
   da:"Paul Falstad, Iain Sharp og bidragydere",
   de:"Paul Falstad, Iain Sharp und Mitwirkende",
   fi:"Paul Falstad, Iain Sharp ja muut kehittäjät",
   fr:"Paul Falstad, Iain Sharp et les contributeurs",
   it:"Paul Falstad, Iain Sharp e collaboratori",
   nb:"Paul Falstad, Iain Sharp og bidragsytere",
   pl:"Paul Falstad, Iain Sharp i współtwórcy",
   pt:"Paul Falstad, Iain Sharp e colaboradores",
   ru:"Paul Falstad, Iain Sharp и участники проекта",
   zh:"Paul Falstad、Iain Sharp 及其他贡献者",
   "zh-tw":"Paul Falstad、Iain Sharp 及其他貢獻者",
   ja:"Paul Falstad、Iain Sharp と貢献者",
   kr:"Paul Falstad, Iain Sharp 및 기여자",
   nl:"Paul Falstad, Iain Sharp en bijdragers",
   sv:"Paul Falstad, Iain Sharp och medverkande"
 };
 const t=languages[lang]||languages[code]||languages.en;
 ["jgr-development","jgr-based","jgr-license","jgr-code","jgr-credits"]
  .forEach((id,i)=>{const el=document.getElementById(id);if(el)el.textContent=t[i]});
 const authors=document.getElementById("jgr-authors");
 if(authors)authors.textContent=contributors[code]||contributors.en;
})();
</script>
<script>
${improvementsScript}
</script>
`;
assert(!html.includes("circuits-jgr-identity"),"La identidad se ha insertado dos veces");
writeFileSync(about,html.replace("<div>","<div>\n"+identity));
console.log("OK: entrada Vite circuitjgr.html, Circuit JGR 1.0 y Acerca de conservando todos los créditos.");

// El prototipo de pestañas necesita acceder a las instancias internas exclusivamente
// cuando la página de ensayo las solicita; el simulador normal no expone esta referencia.
const menuSource=join(dir,"Menus.ts");
const menuText=readFileSync(menuSource,"utf8");
const fileMenuAnchor="        const fileMenu = new Menu(this.app);";
assert(menuText.split(fileMenuAnchor).length===2,
 "No se puede localizar la inicialización del menú Archivo para el prototipo");
writeFileSync(menuSource,menuText.replace(fileMenuAnchor,
 '        if (new URLSearchParams(window.location.search).has("jgr-tabs-prototype"))\n' +
 '            (window as any).__CircuitJGRExperimentalApp = this.app;\n' +
 fileMenuAnchor));

// Mantener el diálogo nativo «Guardar como...» y comunicar el nombre solo
// después de pulsar Aceptar. Cancelar no guarda ni cierra la pestaña.
const saveDialogSource=join(dir,"ExportAsLocalFileDialog.ts");
const saveDialogText=readFileSync(saveDialogSource,"utf8");
const saveDialogAnchor='        document.body.removeChild(a);\n        return true;';
const cancelAnchor='        cancelButton.onclick = () => this.closeDialog();';
assert(saveDialogText.split(cancelAnchor).length===2,
 "No se encuentra Cancelar en el diálogo nativo Guardar como...");
// Circuit JGR utiliza .jgr por defecto, conservando el formato de texto
// compatible con CircuitJS/Falstad y respetando las extensiones introducidas
// explícitamente en Guardar como....
const defaultFilenameAnchor='fname = "circuitjs-" + ts + ".txt";';
const noExtensionAnchor='fname += ".txt";';
const existingFilenameAnchor='fname = ExportAsLocalFileDialog.lastFileName;';
for(const anchor of [defaultFilenameAnchor,noExtensionAnchor,existingFilenameAnchor])
 assert(saveDialogText.split(anchor).length===2,
  "No se encuentra el punto de configuración de la extensión JGR: "+anchor);
const jgrSaveDialogText=saveDialogText
 .replace(defaultFilenameAnchor,'fname = "circuitjgr-" + ts + ".jgr";')
 .replace(noExtensionAnchor,'fname += ".jgr";')
 .replace(existingFilenameAnchor,
  'fname = ExportAsLocalFileDialog.lastFileName.replace(/\\.(txt|xml|circuitjs)$/i, ".jgr");');
const withCancel=jgrSaveDialogText.replace(cancelAnchor,
 '        cancelButton.onclick = () => {\n' +
 '            if (new URLSearchParams(window.location.search).has("jgr-tabs-prototype"))\n' +
 '                window.parent.postMessage({source:"circuit-jgr-tabs",action:"save-canceled"},"*");\n' +
 '            this.closeDialog();\n' +
 '        };');

assert(saveDialogText.split(saveDialogAnchor).length===2,
 "No se encuentra la finalización de Guardar como... de CircuitJS");
writeFileSync(saveDialogSource,withCancel.replace(saveDialogAnchor,
 '        document.body.removeChild(a);\n' +
 '        if (this.rememberName && new URLSearchParams(window.location.search).has("jgr-tabs-prototype"))\n' +
 '            window.parent.postMessage({source:"circuit-jgr-tabs",action:"saved",name:fname},"*");\n' +
 '        return true;'));



// Validate before clearing the current circuit on all import routes.
const importValidation=spawnSync(process.execPath,[new URL("./patch-import-validation.mjs",import.meta.url).pathname,dir],{stdio:"inherit"});
assert(importValidation.status===0,"Import validation patch failed");

const lightPalette=spawnSync(process.execPath,[new URL("./patch-light-palette.mjs",import.meta.url).pathname,dir],{stdio:"inherit"});
assert(lightPalette.status===0,"Light palette patch failed");
const liveSettings=spawnSync(process.execPath,[new URL("./patch-live-settings.mjs",import.meta.url).pathname,dir],{stdio:"inherit"});
assert(liveSettings.status===0,"Live settings patch failed");
const fullWidthScopes=spawnSync(process.execPath,[new URL("./patch-scope-full-width.mjs",import.meta.url).pathname,dir],{stdio:"inherit"});
assert(fullWidthScopes.status===0,"Full-width scopes patch failed");
const scopeScaleBadge=spawnSync(process.execPath,[new URL("./patch-scope-scale-badge.mjs",import.meta.url).pathname,dir],{stdio:"inherit"});
assert(scopeScaleBadge.status===0,"Scope scale badge patch failed");
const scopeLineWidth=spawnSync(process.execPath,[new URL("./patch-scope-line-width.mjs",import.meta.url).pathname,dir],{stdio:"inherit"});
assert(scopeLineWidth.status===0,"Scope trace line-width patch failed");

// Reservar una fila de pestañas dentro de la interfaz SOLO para el prototipo.
// La página principal conserva exactamente las dimensiones originales.
// Se hace después de aplicar los parches de osciloscopio para no solaparlos.
const uiSource=join(dir,"UIManager.ts");
let uiText=readFileSync(uiSource,"utf8");
const loadFileAcceptAnchor="this.element.accept = '.txt,.circuitjs';";
assert(uiText.split(loadFileAcceptAnchor).length===2,
 "No se encuentra el filtro nativo Abrir archivo...");
uiText=uiText.replace(loadFileAcceptAnchor,
 "this.element.accept = '.jgr,.txt,.circuitjs,.xml';");

const reserve={
  '        expectedHeight -= (this.hideMenu ? 0 : UIManager.MENUBARHEIGHT);':
    '        expectedHeight -= (this.hideMenu ? 0 : UIManager.MENUBARHEIGHT);\\n' +
    '        if (new URLSearchParams(window.location.search).has("jgr-tabs-prototype")) expectedHeight -= 33;',
  '        height -= (this.hideMenu ? 0 : UIManager.MENUBARHEIGHT);':
    '        height -= (this.hideMenu ? 0 : UIManager.MENUBARHEIGHT);\\n' +
    '        if (new URLSearchParams(window.location.search).has("jgr-tabs-prototype")) height -= 33;',
  "            this.canvasWrapper.style.top = (mbh + tbh) + 'px';":
    "            this.canvasWrapper.style.top = (mbh + tbh + (new URLSearchParams(window.location.search).has('jgr-tabs-prototype') ? 33 : 0)) + 'px';",
  '            this.subcircuitBar.updatePosition(0, barTop, width);':
    "            this.subcircuitBar.updatePosition(0, barTop + (new URLSearchParams(window.location.search).has('jgr-tabs-prototype') ? 33 : 0), width);"
};
for(const [before,after] of Object.entries(reserve)){
 assert(uiText.split(before).length===2,"No se encuentra una única referencia de UI para insertar pestañas: "+before);
 uiText=uiText.replace(before,after.replaceAll("\\n","\n"));
}
// En el prototipo, ocultar el panel derecho debe recuperar todo el ancho
// del lienzo; la versión sin pestañas conserva el cálculo del motor original.
const sidebarWidthCondition="        if (!this.app.isMobile(this.sidePanelCheckboxLabel))";
assert(uiText.split(sidebarWidthCondition).length===3,
 "Se esperaban exactamente dos comprobaciones del ancho del panel lateral");
uiText=uiText.replaceAll(sidebarWidthCondition,
 "        if (!this.app.isMobile(this.sidePanelCheckboxLabel) &&\n" +
 "            !(new URLSearchParams(window.location.search).has('jgr-tabs-prototype') && this.verticalPanel.style.display === 'none'))");
writeFileSync(uiSource,uiText);

