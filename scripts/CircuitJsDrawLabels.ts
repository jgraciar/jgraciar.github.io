// Numbered digital ICs use the catalogue number before the translated name.
const digitalCounterNames: Record<string, string[]> = {
  "en": [
    "decade counter",
    "binary counter",
    "up/down counter"
  ],
  "es": [
    "contador decimal",
    "contador binario",
    "contador ascendente/descendente"
  ],
  "ca": [
    "comptador decimal",
    "comptador binari",
    "comptador ascendent/descendent"
  ],
  "ca-es-valencia": [
    "comptador decimal",
    "comptador binari",
    "comptador ascendent/descendent"
  ],
  "gl": [
    "contador decimal",
    "contador binario",
    "contador ascendente/descendente"
  ],
  "eu": [
    "hamartar kontagailua",
    "kontagailu bitarra",
    "goranzko/beheranzko kontagailua"
  ],
  "csx": [
    "dekadický čítač",
    "binární čítač",
    "vzestupný/sestupný čítač"
  ],
  "da": [
    "dekadetæller",
    "binær tæller",
    "op/ned-tæller"
  ],
  "de": [
    "Dekadenzähler",
    "Binärzähler",
    "Aufwärts-/Abwärtszähler"
  ],
  "fi": [
    "dekadilaskuri",
    "binäärilaskuri",
    "ylös-/alaslaskuri"
  ],
  "fr": [
    "compteur décimal",
    "compteur binaire",
    "compteur/décompteur"
  ],
  "it": [
    "contatore decimale",
    "contatore binario",
    "contatore avanti/indietro"
  ],
  "ja": [
    "10進カウンタ",
    "2進カウンタ",
    "アップ/ダウンカウンタ"
  ],
  "kr": [
    "10진 카운터",
    "2진 카운터",
    "업/다운 카운터"
  ],
  "nb": [
    "dekadeteller",
    "binærteller",
    "opp/ned-teller"
  ],
  "pl": [
    "licznik dekadowy",
    "licznik binarny",
    "licznik rewersyjny"
  ],
  "pt": [
    "contador decimal",
    "contador binário",
    "contador crescente/decrescente"
  ],
  "ru": [
    "десятичный счётчик",
    "двоичный счётчик",
    "реверсивный счётчик"
  ],
  "zh": [
    "十进制计数器",
    "二进制计数器",
    "加减计数器"
  ],
  "zh-tw": [
    "十進位計數器",
    "二進位計數器",
    "加減計數器"
  ],
  "nl": [
    "decadeteller",
    "binaire teller",
    "op/neer-teller"
  ],
  "sv": [
    "dekadräknare",
    "binärräknare",
    "upp/ned-räknare"
  ]
};

// Uppercase only the first letter of the name, after an optional catalogue number.
// Keep the remaining technical spelling (cos φ, VAr, MOSFET, etc.) intact.
export function capitalizeDrawComponent(label:string,language:string):string {
 const prefix=label.match(/^\s*\d+N?\s+/)?.[0]||'';
 const locale=language==='csx'?'cs':language==='kr'?'ko':language;
 return prefix+label.slice(prefix.length).replace(/\p{L}/u,c=>c.toLocaleUpperCase(locale||'en'));
}

// Nombres de los componentes de Dibujo sin verbos de inserción.
// Se conserva intacta la clave del comando (por ejemplo, «Add Resistor»)
// y se modifica únicamente su rótulo visible.
export function circuitJsDrawLabel(sourceKey: string, localized: string, language: string): string {
    // Los accesos de arrastre y las acciones ajenas a «Add» no se cambian.
    if (!/^(?:Add |Añadir |Afegir |Afig |Engadir )/i.test(sourceKey) || !localized) return capitalizeDrawComponent(localized,language);

    const code = language.toLowerCase().replace(/_/g, "-");
    const base = code.startsWith("ca-es-valencia") ? "ca-es-valencia"
        : code.startsWith("zh-tw") || code.startsWith("zh-hant") ? "zh-tw"
        : code.split("-")[0];
    const counters: Record<string, [string, number]> = {
        "Add CD4026 decade counter": ["4026", 0],
        "Add 7493 binary counter": ["7493", 1],
        "Add 74191 up/down counter": ["74191", 2]
    };
    const counter = counters[sourceKey];
    if (counter) return capitalizeDrawComponent(counter[0] + " " + (digitalCounterNames[base] || digitalCounterNames.en)[counter[1]],language);

    const prefixes: Record<string, string[]> = {
        en: ["Add "],
        es: ["Añadir ", "Agregar "],
        ca: ["Afegir ", "Afig ", "Añadir "],
        "ca-es-valencia": ["Afig ", "Afegir ", "Añadir "],
        gl: ["Engadir ", "Añadir "],
        eu: ["Gehitu ", "Añadir "],
        csx: ["Přidat ", "Vložit "],
        da: ["Tilføj "],
        de: ["Hinzufügen ", "Einfügen "],
        fi: ["Lisää "],
        fr: ["Ajouter "],
        it: ["Aggiungi ", "Inserisci "],
        ja: ["追加 ", "追加する "],
        kr: ["추가 "],
        nb: ["Legg til "],
        pl: ["Wstaw ", "Dodaj "],
        pt: ["Inserir ", "Inserir", "Adicionar "],
        ru: ["Добавить "],
        zh: ["添加 ", "添加", "加入 ", "加入"],
        "zh-tw": ["新增 ", "新增", "加入 ", "加入", "添加"],
        nl: ["Toevoegen ", "Voeg toe ", "Add "],
        sv: ["Lägg till ", "Add "]
    };
    // Los catálogos originales son heterogéneos. Quitar solo el verbo que
    // coincide exactamente; «Adder», «Additive», etc., son nombres válidos.
    let label = localized.trim();
    for (const prefix of [...(prefixes[base] || []), "Add "]) {
        if (label.toLocaleLowerCase().startsWith(prefix.toLocaleLowerCase())) {
            label = label.slice(prefix.length).trimStart();
            break;
        }
    }
    // En estas lenguas los catálogos ponen la acción después del componente,
    // no antes. Se limita el tratamiento a los nombres del menú de Dibujo.
    if (base === "de") label = label.replace(/\s+einfügen(?=\s|$)/gi, " ");
    if (base === "ja") label = label.replace(/(?:を)?追加|を挿入|を加える/g, "");
    if (base === "kr") label = label.replace(/\s*추가(?=\s|\(|$)/g, "");
    return capitalizeDrawComponent(label.replace(/\s{2,}/g, " ").trim() || localized,language);
}

