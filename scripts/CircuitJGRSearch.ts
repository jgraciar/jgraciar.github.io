// SPDX-License-Identifier: GPL-3.0-or-later
import {digitalICs} from './LabDigitalIC.ts';
export type SearchKind='all'|'elements'|'commands'|'examples';
export const searchKinds:SearchKind[]=['all','elements','commands','examples'];
// Position: entry, title, placeholder, filter, all, elements, commands, examples,
// count, empty, example query hint. Keep new UI text available in all 22 languages.
export const searchTranslations:Record<string,string>={
 en:'Find element…|Find components, commands and examples|Name, reference or function…|Search in|All|Elements|Commands|Examples|{shown} of {total} results|No matches|Type at least two characters to find examples.',
 es:'Buscar elemento…|Buscar componentes, comandos y ejemplos|Nombre, referencia o función…|Buscar en|Todo|Elementos|Comandos|Ejemplos|{shown} de {total} resultados|Sin coincidencias|Escribe al menos dos caracteres para buscar ejemplos.',
 ca:'Busca un element…|Busca components, ordres i exemples|Nom, referència o funció…|Busca en|Tot|Elements|Ordres|Exemples|{shown} de {total} resultats|Sense coincidències|Escriu almenys dos caràcters per a buscar exemples.',
 'ca-es-valencia':'Busca un element…|Busca components, ordres i exemples|Nom, referència o funció…|Busca en|Tot|Elements|Ordres|Exemples|{shown} de {total} resultats|Sense coincidències|Escriu almenys dos caràcters per a buscar exemples.',
 gl:'Buscar elemento…|Buscar compoñentes, comandos e exemplos|Nome, referencia ou función…|Buscar en|Todo|Elementos|Comandos|Exemplos|{shown} de {total} resultados|Sen coincidencias|Escribe polo menos dous caracteres para buscar exemplos.',
 eu:'Bilatu elementua…|Bilatu osagaiak, komandoak eta adibideak|Izena, erreferentzia edo funtzioa…|Bilatu hemen|Guztiak|Elementuak|Komandoak|Adibideak|{total} emaitzatik {shown}|Ez dago bat-etortzerik|Idatzi gutxienez bi karaktere adibideak bilatzeko.',
 fr:'Rechercher un composant…|Rechercher composants, commandes et exemples|Nom, référence ou fonction…|Rechercher dans|Tout|Composants|Commandes|Exemples|{shown} résultats sur {total}|Aucun résultat|Saisissez au moins deux caractères pour rechercher des exemples.',
 de:'Bauelement suchen…|Bauelemente, Befehle und Beispiele suchen|Name, Typnummer oder Funktion…|Suchen in|Alle|Bauelemente|Befehle|Beispiele|{shown} von {total} Ergebnissen|Keine Treffer|Mindestens zwei Zeichen eingeben, um Beispiele zu suchen.',
 it:'Cerca componente…|Cerca componenti, comandi ed esempi|Nome, riferimento o funzione…|Cerca in|Tutto|Componenti|Comandi|Esempi|{shown} di {total} risultati|Nessun risultato|Digita almeno due caratteri per cercare esempi.',
 pt:'Procurar componente…|Procurar componentes, comandos e exemplos|Nome, referência ou função…|Procurar em|Tudo|Componentes|Comandos|Exemplos|{shown} de {total} resultados|Sem resultados|Escreva pelo menos dois caracteres para procurar exemplos.',
 nl:'Onderdeel zoeken…|Onderdelen, opdrachten en voorbeelden zoeken|Naam, typenummer of functie…|Zoeken in|Alles|Onderdelen|Opdrachten|Voorbeelden|{shown} van {total} resultaten|Geen resultaten|Typ minimaal twee tekens om voorbeelden te zoeken.',
 sv:'Sök komponent…|Sök komponenter, kommandon och exempel|Namn, beteckning eller funktion…|Sök i|Alla|Komponenter|Kommandon|Exempel|{shown} av {total} resultat|Inga träffar|Skriv minst två tecken för att söka exempel.',
 da:'Find komponent…|Find komponenter, kommandoer og eksempler|Navn, typenummer eller funktion…|Søg i|Alle|Komponenter|Kommandoer|Eksempler|{shown} af {total} resultater|Ingen resultater|Skriv mindst to tegn for at finde eksempler.',
 nb:'Finn komponent…|Finn komponenter, kommandoer og eksempler|Navn, typenummer eller funksjon…|Søk i|Alle|Komponenter|Kommandoer|Eksempler|{shown} av {total} resultater|Ingen treff|Skriv minst to tegn for å finne eksempler.',
 fi:'Etsi komponentti…|Etsi komponentteja, komentoja ja esimerkkejä|Nimi, tyyppinumero tai toiminto…|Etsi kohteista|Kaikki|Komponentit|Komennot|Esimerkit|{shown}/{total} tulosta|Ei tuloksia|Kirjoita vähintään kaksi merkkiä esimerkkien etsimiseksi.',
 pl:'Znajdź element…|Znajdź elementy, polecenia i przykłady|Nazwa, oznaczenie lub funkcja…|Szukaj w|Wszystko|Elementy|Polecenia|Przykłady|{shown} z {total} wyników|Brak wyników|Wpisz co najmniej dwa znaki, aby wyszukać przykłady.',
 csx:'Najít součástku…|Hledat součástky, příkazy a příklady|Název, označení nebo funkce…|Hledat v|Vše|Součástky|Příkazy|Příklady|{shown} z {total} výsledků|Žádné výsledky|Pro hledání příkladů zadejte alespoň dva znaky.',
 ru:'Найти компонент…|Поиск компонентов, команд и примеров|Название, обозначение или функция…|Искать в|Всё|Компоненты|Команды|Примеры|{shown} из {total} результатов|Совпадений нет|Введите не менее двух символов для поиска примеров.',
 zh:'查找元件…|查找元件、命令和示例|名称、型号或功能…|搜索范围|全部|元件|命令|示例|显示 {total} 项中的 {shown} 项|无匹配结果|输入至少两个字符以查找示例。',
 'zh-tw':'尋找元件…|尋找元件、命令和範例|名稱、型號或功能…|搜尋範圍|全部|元件|命令|範例|顯示 {total} 項中的 {shown} 項|無符合結果|輸入至少兩個字元以尋找範例。',
 ja:'部品を検索…|部品、コマンド、回路例を検索|名前、型番、機能…|検索対象|すべて|部品|コマンド|回路例|{total} 件中 {shown} 件|一致する項目はありません|回路例の検索には2文字以上入力してください。',
 kr:'부품 찾기…|부품, 명령 및 예제 검색|이름, 부품 번호 또는 기능…|검색 대상|전체|부품|명령|예제|{total}개 중 {shown}개 결과|검색 결과 없음|예제를 검색하려면 두 글자 이상 입력하세요.'
};
export function searchText(index:number,language:string):string {
 return (searchTranslations[language]||searchTranslations.en).split('|')[index];
}
export function normalizeSearch(text:string):string {
 return text.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase()
  .replace(/[-_/]+/g,' ').replace(/\s+/g,' ').trim();
}
export function isElementClass(name:string):boolean {return /Elm(?::|$)/.test(name);}
export function searchKind(cmd:{menu:string|null;item:string|null;category:string}):SearchKind {
 return cmd.menu==='circuits'?'examples':cmd.menu==='main'&&isElementClass(cmd.item||'')?'elements':'commands';
}
const functionAliases:Record<string,string>={
 latch:'biestable flip flop latch memoria bascula',
 register:'registro desplazamiento shift register',
 counter:'contador counter comptador',
 codec:'codificador decodificador encoder decoder',
 mux:'multiplexor demultiplexor multiplexador multiplexeur mux',
 memory:'memoria aritmetica memory arithmetic',
 gate:'puerta logica gate porta logic',
 schmitt:'disparador schmitt trigger histeresis hysteresis'
};
export function componentAliases(cls:string):string {
 const words:string[]=[];
 const part=cls.match(/^(?:IC|CD|Counter)?(\d+N?)Elm$/)?.[1];
 const d=part?digitalICs[part]:undefined;
 if(part)words.push(part);
 if(d){
  if(d.family==='CMOS')words.push('CD'+part);
  const group=d.msi?.group||(d.gates.length?(d.gates[0].kind==='SCHMITT'?'schmitt':'gate'):'latch');
  words.push(functionAliases[group]||'',d.msi?.name||'');
 }
 const rules:[RegExp,string][]=[
  [/SevenSeg|LEDArray|DecimalDisplay/,'display visualizador pantalla indicador led siete siete segmentos seven segment'],
  [/SevenSegDecoder/,'decodificador decoder bcd'],
  [/BinaryToBCD/,'conversor binario bcd binary converter'],
  [/FlipFlop|RSGeneric|Latch/,functionAliases.latch],
  [/Counter|Decade|CD4026/,functionAliases.counter],
  [/CD4026/,'4026 CD4026 contador decimal decada decade'],
  [/SipoShift|PisoShift/,functionAliases.register],
  [/Multiplexer/,functionAliases.mux],
  [/Schmitt/,functionAliases.schmitt],
  [/Gate|InverterElm$/,functionAliases.gate],
  [/Resistor|PotElm|LDR|Thermistor/,'resistencia resistor resistance resistència potenciometro'],
  [/Capacitor/,'condensador capacitor capacitancia capacité'],
  [/Inductor/,'bobina inductor inductancia coil'],
  [/Ground/,'masa tierra gnd ground referencia'],
  [/Wattmeter/,'vatimetro potencia wattmeter power p q s'],
  [/Ammeter/,'amperimetro corriente intensidad ammeter current'],
  [/Probe/,'sonda tension voltimetro probe voltage'],
  [/PVInverter/,'inversor fotovoltaico solar photovoltaic inverter'],
  [/Impedance/,'impedancia impedance z rlc'],
  [/Transformer/,'transformador transformer'],
  [/Switch/,'interruptor conmutador pulsador switch'],
  [/Timer/,'temporizador timer 555'],
  [/Clock/,'reloj clock generador pulsos']
 ];
 for(const [pattern,aliases]of rules)if(pattern.test(cls))words.push(aliases);
 if(/CommonCathode/.test(cls))words.push('catodo comun common cathode gnd');
 if(/CommonAnode/.test(cls))words.push('anodo comun common anode vcc');
 return words.join(' ');
}
// Read category headings only, excluding nested menu contents and arrow icons.
export function componentPath(item:HTMLElement|null,drawLabel:string):string {
 const headings:string[]=[];
 for(let node=item?.parentElement;node;node=node.parentElement){
  if(node.matches('li.hasSubmenu')){
   const title=Array.from(node.childNodes).filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
   if(title)headings.unshift(title);
  }
 }
 return [drawLabel,...headings].join(' → ');
}
export function searchScore(query:string,label:string,keywords:string):number {
 const q=normalizeSearch(query);if(!q)return 1;
 const name=normalizeSearch(label),target=normalizeSearch(label+' '+keywords);
 if(name===q)return 10000;
 if(name.startsWith(q))return 8000;
 if(name.includes(q))return 6000;
 if(target.includes(q))return 4000;
 const tokens=q.split(' ');
 if(tokens.length>1&&tokens.every(t=>target.includes(t)))return 3000;
 // Retain typo-tolerant subsequence matching after exact and word matches.
 let qi=0,score=0,last=-2;
 for(let i=0;i<target.length&&qi<q.length;i++)if(target[i]===q[qi]){
  score+=last===i-1?10:1;last=i;qi++;
 }
 return qi===q.length?score:0;
}
export function highlightSearch(label:string,query:string):string {
 const escape=(s:string)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
 const q=normalizeSearch(query);if(!q)return escape(label);
 // Normalize per code point and retain original offsets (including combining marks).
 let normalized='';const offsets:number[]=[];let offset=0;
 for(const char of label){const n=char.normalize('NFD').replace(/\p{M}/gu,'').toLowerCase().replace(/[-_/]/g,' ');for(const c of n){normalized+=c;offsets.push(offset);}offset+=char.length;}
 const index=normalized.indexOf(q);
 if(index<0)return escape(label);
 const from=offsets[index],last=offsets[index+q.length-1];
 let to=last+String.fromCodePoint(label.codePointAt(last)!).length;
 while(to<label.length&&/\p{M}/u.test(label[to]))to++;
 return escape(label.slice(0,from))+'<b>'+escape(label.slice(from,to))+'</b>'+escape(label.slice(to));
}
