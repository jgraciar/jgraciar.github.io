// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
const dir=process.argv[2];
assert(dir,'Uso: patch-menu-viewport.mjs <ts directory>');
const menus=join(dir,'Menus.ts'),css=join(dir,'style.css');
const source=readFileSync(menus,'utf8');
const insertion=[
'function fitJgrMenuToViewport(item: HTMLElement, submenu: HTMLUListElement): void {',
"    if (window.matchMedia('(max-width: 600px)').matches) {",
"        submenu.style.left = ''; submenu.style.top = ''; return;",
'    }',
'    const box = item.getBoundingClientRect();',
'    const width = Math.min(Math.max(180, submenu.scrollWidth), window.innerWidth - 16);',
'    const height = Math.min(submenu.scrollHeight, window.innerHeight - 16);',
'    const left = box.right + width + 8 <= innerWidth ? box.right :',
'        box.left - width >= 8 ? box.left - width : Math.max(8, innerWidth - width - 8);',
'    const top = Math.max(8, Math.min(box.top, innerHeight - height - 8));',
"    submenu.style.left = left + 'px'; submenu.style.top = top + 'px';",
'}',
''].join('\n');
assert(source.includes('// ---- State classes used by UIManager ----'));
let updated=source.replace('// ---- State classes used by UIManager ----',insertion+'\n// ---- State classes used by UIManager ----');
const orig="                if (li.classList.contains('hasSubmenu') && !li.classList.contains('menuItemDisabled'))\n                    li.classList.add('open');";
const replacement="                if (li.classList.contains('hasSubmenu') && !li.classList.contains('menuItemDisabled')) {\n                    li.classList.add('open');\n                    fitJgrMenuToViewport(li, sub.ul);\n                }";
assert.equal(updated.split(orig).length-1,2,'Faltan los dos eventos de menús anidados');
updated=updated.replaceAll(orig,replacement);
const anchor="            li.classList.add('open');\n        };\n        li.addEventListener('mouseover',";
assert(updated.includes(anchor),'No aparece la apertura del submenú');
updated=updated.replace(anchor,"            li.classList.add('open');\n            fitJgrMenuToViewport(li, sub.ul);\n        };\n        li.addEventListener('mouseover',");
writeFileSync(menus,updated);
const cssExtra=[
'',
'/* Circuit JGR: acceso completo a los menús en pantallas pequeñas. */',
'td.gwt-MenuItem > .menuDropdown {',
'    max-height: min(75dvh, calc(100dvh - 72px));',
'    max-width: calc(100vw - 16px);',
'    overflow-y: auto;',
'    overflow-x: auto;',
'    overscroll-behavior: contain;',
'}',
'.menuDropdown .menuDropdown, .elmContextMenu .menuDropdown {',
'    position: fixed;',
'    max-height: calc(100dvh - 16px);',
'    max-width: calc(100vw - 16px);',
'    overflow-y: auto;',
'    overflow-x: auto;',
'    overscroll-behavior: contain;',
'}',
'.elmContextMenu { max-height: calc(100dvh - 16px); overflow-y: auto; }',
'@media (max-width: 600px) {',
'    td.gwt-MenuItem > .menuDropdown { max-height: calc(100dvh - 40px); }',
'    .menuDropdown .menuDropdown, .elmContextMenu .menuDropdown {',
'        position: static; max-height: none; overflow: visible; width: 100%; box-shadow: none;',
'    }',
'}',''].join('\n');
const typography=[
 '/* Circuit JGR: tipografía de todos los menús, incluidos los desplegables y contextuales. */',
 '.gwt-MenuBar-horizontal td.gwt-MenuItem, .gwt-MenuBar-horizontal .menuDropdown,',
 '.gwt-MenuBar-horizontal .menuDropdown li, .gwt-MenuBar-horizontal .menuItemRow,',
 '.gwt-MenuBar-horizontal .itemLabel, .elmContextMenu, .elmContextMenu li,',
 '.menuDropdown, .menuDropdown .menuItem, .menuDropdown .shortcutHint {',
 '  font-family: "Segoe UI","Noto Sans Arabic",Tahoma,sans-serif !important;',
 '  font-size: 13px !important; line-height: 1.35 !important;',
 '}',
 'td.gwt-MenuItem {font-weight:600!important;}',
 '.menuDropdown,.elmContextMenu {background:#f8f8f8!important;border:1px solid #bcbcbc!important;box-shadow:2px 4px 9px #0004!important;}',
 '.menuDropdown .menuItem:hover,.menuDropdown .hasSubmenu.open {background:#d5d5d5!important;}',
 'html[lang="ar"] .menuDropdown .menuItem,html[lang="ar"] .elmContextMenu .menuItem {direction:rtl;text-align:right;}',
 'html[lang="ar"] .menuDropdown .itemLabel {unicode-bidi:plaintext;}',
 ''].join('\\n');
writeFileSync(css,readFileSync(css,'utf8')+cssExtra+typography);
console.log('OK: menús desplazables y submenús dentro de la pantalla');
