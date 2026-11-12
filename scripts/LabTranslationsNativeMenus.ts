// Traducciones de los comandos que faltan en los catálogos originales de CircuitJS.
// Se limitan a la interfaz de Falstad/CircuitJS; no se modifica la web del laboratorio.
const keys = [
  "Add Controlled Voltage Source (2-terminal)",
  "Add Controlled Current Source (2-terminal)",
  "Export As Image...",
  "Export As SVG...",
  "Find Component/Command...",
  "Show Cursor Cross Hairs",
  "Command Palette",
  "Please select one or more subcircuits.",
  "Are you sure you want to delete "
];
const translations: Record<string,string[]> = {
  "csx": [
    "Řízený zdroj napětí (2 svorky)",
    "Řízený zdroj proudu (2 svorky)",
    "Exportovat jako obrázek...",
    "Exportovat jako SVG...",
    "Najít součástku nebo příkaz...",
    "Zobrazit kříž kurzoru",
    "Paleta příkazů",
    "Vyberte alespoň jeden podobvod.",
    "Opravdu chcete odstranit "
  ],
  "da": [
    "Styret spændingskilde (2 terminaler)",
    "Styret strømkilde (2 terminaler)",
    "Eksportér som billede...",
    "Eksportér som SVG...",
    "Find komponent eller kommando...",
    "Vis markørens trådkors",
    "Kommandopalet",
    "Vælg mindst ét delkredsløb.",
    "Er du sikker på, at du vil slette "
  ],
  "de": [
    "Gesteuerte Spannungsquelle (2 Anschlüsse)",
    "Gesteuerte Stromquelle (2 Anschlüsse)",
    "Als Bild exportieren...",
    "Als SVG exportieren...",
    "Bauteil oder Befehl suchen...",
    "Fadenkreuz am Cursor anzeigen",
    "Befehlspalette",
    "Bitte mindestens einen Teilschaltkreis auswählen.",
    "Möchten Sie Folgendes wirklich löschen: "
  ],
  "fi": [
    "Ohjattu jännitelähde (2 napaa)",
    "Ohjattu virtalähde (2 napaa)",
    "Vie kuvana...",
    "Vie SVG-muodossa...",
    "Etsi komponentti tai komento...",
    "Näytä kohdistimen ristikkäisviivat",
    "Komentopaletti",
    "Valitse vähintään yksi alipiiri.",
    "Haluatko varmasti poistaa kohteen: "
  ],
  "fr": [
    "Source de tension commandée (2 bornes)",
    "Source de courant commandée (2 bornes)",
    "Exporter comme image...",
    "Exporter en SVG...",
    "Rechercher un composant ou une commande...",
    "Afficher le réticule du curseur",
    "Palette de commandes",
    "Sélectionnez au moins un sous-circuit.",
    "Confirmer la suppression de "
  ],
  "it": [
    "Generatore di tensione controllato (2 terminali)",
    "Generatore di corrente controllato (2 terminali)",
    "Esporta come immagine...",
    "Esporta come SVG...",
    "Cerca componente o comando...",
    "Mostra il mirino del cursore",
    "Tavolozza dei comandi",
    "Seleziona almeno un sottocircuito.",
    "Confermi l'eliminazione di "
  ],
  "ja": [
    "制御電圧源（2端子）",
    "制御電流源（2端子）",
    "画像としてエクスポート...",
    "SVGとしてエクスポート...",
    "部品またはコマンドを検索...",
    "カーソルの十字線を表示",
    "コマンドパレット",
    "サブ回路を1つ以上選択してください。",
    "次を削除しますか: "
  ],
  "kr": [
    "제어 전압원(2단자)",
    "제어 전류원(2단자)",
    "이미지로 내보내기...",
    "SVG로 내보내기...",
    "부품 또는 명령 검색...",
    "커서 십자선 표시",
    "명령 팔레트",
    "하나 이상의 하위 회로를 선택하세요.",
    "다음 항목을 삭제하시겠습니까? "
  ],
  "nb": [
    "Styrt spenningskilde (2 terminaler)",
    "Styrt strømkilde (2 terminaler)",
    "Eksporter som bilde...",
    "Eksporter som SVG...",
    "Finn komponent eller kommando...",
    "Vis markørkryss",
    "Kommandopalett",
    "Velg minst én delkrets.",
    "Er du sikker på at du vil slette "
  ],
  "pl": [
    "Sterowane źródło napięcia (2 zaciski)",
    "Sterowane źródło prądu (2 zaciski)",
    "Eksportuj jako obraz...",
    "Eksportuj jako SVG...",
    "Znajdź element lub polecenie...",
    "Pokaż celownik kursora",
    "Paleta poleceń",
    "Wybierz co najmniej jeden podobwód.",
    "Czy na pewno usunąć: "
  ],
  "pt": [
    "Fonte de tensão controlada (2 terminais)",
    "Fonte de corrente controlada (2 terminais)",
    "Exportar como imagem...",
    "Exportar como SVG...",
    "Procurar componente ou comando...",
    "Mostrar retículo do cursor",
    "Paleta de comandos",
    "Selecione pelo menos um subcircuito.",
    "Tem a certeza de que pretende eliminar "
  ],
  "ru": [
    "Управляемый источник напряжения (2 вывода)",
    "Управляемый источник тока (2 вывода)",
    "Экспортировать как изображение...",
    "Экспортировать как SVG...",
    "Найти компонент или команду...",
    "Показать перекрестие курсора",
    "Палитра команд",
    "Выберите хотя бы одну подсхему.",
    "Вы уверены, что хотите удалить "
  ],
  "zh-tw": [
    "受控電壓源（雙端）",
    "受控電流源（雙端）",
    "匯出為圖片...",
    "匯出為 SVG...",
    "尋找元件或指令...",
    "顯示游標十字線",
    "命令面板",
    "請選取至少一個子電路。",
    "確定要刪除 "
  ],
  "zh": [
    "受控电压源（双端）",
    "受控电流源（双端）",
    "导出为图片...",
    "导出为 SVG...",
    "查找元件或命令...",
    "显示光标十字线",
    "命令面板",
    "请至少选择一个子电路。",
    "确定要删除 "
  ]
};
export const nativeMenuExtensions: Record<string,Record<string,string>> = {};
for(const [lang,values] of Object.entries(translations)){
 if(values.length!==keys.length)throw Error("Traducciones incompletas del menú "+lang);
 nativeMenuExtensions[lang]=Object.fromEntries(keys.map((key,index)=>[key,values[index]]));
}
const additional: Record<string,Record<string,string>> = {
  "kr": {
    "Show Conductance": "컨덕턴스 표시"
  }
};
for(const [code,values] of Object.entries(additional))Object.assign(nativeMenuExtensions[code],values);
// Categorías de los ejemplos docentes; los títulos de los archivos se conservan.
const teachingGroupKeys=['Suma de productos (SOP)','Producto de sumas (POS)','Mapas de Karnaugh','Circuitos lógicos'];
const teachingGroups:Record<string,string>={
 en:'Sum of products (SOP)|Product of sums (POS)|Karnaugh maps|Logic circuits',
 es:'Suma de productos (SOP)|Producto de sumas (POS)|Mapas de Karnaugh|Circuitos lógicos',
 ca:'Suma de productes (SOP)|Producte de sumes (POS)|Mapes de Karnaugh|Circuits lògics',
 'ca-es-valencia':'Suma de productes (SOP)|Producte de sumes (POS)|Mapes de Karnaugh|Circuits lògics',
 gl:'Suma de produtos (SOP)|Produto de sumas (POS)|Mapas de Karnaugh|Circuítos lóxicos',
 eu:'Biderkaduren batura (SOP)|Baturen biderkadura (POS)|Karnaugh mapak|Zirkuitu logikoak',
 fr:'Somme de produits (SOP)|Produit de sommes (POS)|Tableaux de Karnaugh|Circuits logiques',
 de:'Summe von Produkten (SOP)|Produkt von Summen (POS)|Karnaugh-Diagramme|Logikschaltungen',
 it:'Somma di prodotti (SOP)|Prodotto di somme (POS)|Mappe di Karnaugh|Circuiti logici',
 pt:'Soma de produtos (SOP)|Produto de somas (POS)|Mapas de Karnaugh|Circuitos lógicos',
 nl:'Som van producten (SOP)|Product van sommen (POS)|Karnaughdiagrammen|Logische schakelingen',
 sv:'Summa av produkter (SOP)|Produkt av summor (POS)|Karnaughdiagram|Logikkretsar',
 da:'Sum af produkter (SOP)|Produkt af summer (POS)|Karnaughdiagrammer|Logiske kredsløb',
 nb:'Sum av produkter (SOP)|Produkt av summer (POS)|Karnaughdiagrammer|Logiske kretser',
 fi:'Tulojen summa (SOP)|Summien tulo (POS)|Karnaugh-kartat|Logiikkapiirit',
 pl:'Suma iloczynów (SOP)|Iloczyn sum (POS)|Mapy Karnaugha|Układy logiczne',
 csx:'Součet součinů (SOP)|Součin součtů (POS)|Karnaughovy mapy|Logické obvody',
 ru:'Сумма произведений (SOP)|Произведение сумм (POS)|Карты Карно|Логические схемы',
 zh:'与或式 (SOP)|或与式 (POS)|卡诺图|逻辑电路',
 'zh-tw':'與或式 (SOP)|或與式 (POS)|卡諾圖|邏輯電路',
 ja:'積和形 (SOP)|和積形 (POS)|カルノー図|論理回路',
 kr:'곱의 합 (SOP)|합의 곱 (POS)|카르노 맵|논리 회로'
};
for(const [code,row] of Object.entries(teachingGroups)){
 const values=row.split('|');
 if(values.length!==teachingGroupKeys.length)throw Error('Categorías docentes incompletas: '+code);
 Object.assign(nativeMenuExtensions[code]??={},Object.fromEntries(teachingGroupKeys.map((key,i)=>[key,values[i]])));
}
