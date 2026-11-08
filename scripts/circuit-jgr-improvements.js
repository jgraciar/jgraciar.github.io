// Características incorporadas a Circuit JGR respecto a CircuitJS1 5.0.4ts.
// Nombres y atribuciones originales se conservan fuera de este bloque.
(() => {
  const requested=new URLSearchParams(location.search).get("lang")||
    (navigator.languages?.[0]||navigator.language||"en");
  const value=requested.toLowerCase().replace(/_/g,"-");
  const lang=value.startsWith("ca-es-valencia")?"ca-es-valencia":
    ["zh-tw","zh-hant","zh-hk","zh-mo"].some(x=>value.startsWith(x))?"zh-tw":
    value.startsWith("cs")?"csx":value.startsWith("ko")?"kr":
    ["no","nn","nb"].some(x=>value===x||value.startsWith(x+"-"))?"nb":
    value.split("-")[0];
  // [Título, vatímetro, impedancia, inversor, configuración, idiomas, circuito inicial].
  const changes={
    en:[
      "Improvements over CircuitJS1 5.0.4ts",
      "Extended wattmeter: active (P), fundamental reactive (Q) and apparent (S) power, phase-displacement cosine, true power factor and selectable reading modes.",
      "AC impedance Z: R ± jX, magnitude/phase and equivalent R, L and C representations.",
      "Photovoltaic inverter element, with grid-connected and stand-alone modes.",
      "Regional number input and display: decimal and thousands separators, configurable precision and initial preferences.",
      "Extended localization of menus, component editors, oscilloscope and About dialog across 22 languages.",
      "Three-phase teaching circuit included at simulator startup."
    ],
    "ca-es-valencia":[
      "Millores respecte de CircuitJS1 5.0.4ts",
      "Vatímetre ampliat: potències activa (P), reactiva fonamental (Q) i aparent (S), cosinus del desfasament, factor de potència real i modes de lectura seleccionables.",
      "Impedància Z en CA: R ± jX, mòdul/argument i representacions equivalents de R, L i C.",
      "Element inversor fotovoltaic, amb modes de connexió a xarxa i funcionament aïllat.",
      "Entrada i visualització numèrica regional: separadors decimals i de milers, precisió configurable i preferències inicials.",
      "Ampliació de les traduccions de menús, edició de components, oscil·loscopi i «Quant a» a 22 idiomes.",
      "Circuit trifàsic didàctic incorporat a l'inici del simulador."
    ],
    es:[
      "Mejoras respecto a CircuitJS1 5.0.4ts",
      "Vatímetro ampliado: potencias activa (P), reactiva fundamental (Q) y aparente (S), coseno del desfase, factor de potencia real y modos de lectura seleccionables.",
      "Impedancia Z en CA: R ± jX, módulo/argumento y representaciones equivalentes de R, L y C.",
      "Elemento inversor fotovoltaico, con funcionamiento conectado a red y aislado.",
      "Entrada y visualización numérica regional: separadores decimales y de miles, precisión configurable y preferencias iniciales.",
      "Ampliación de las traducciones de menús, edición de componentes, osciloscopio y «Acerca de» a 22 idiomas.",
      "Circuito trifásico didáctico incorporado al inicio del simulador."
    ],
    ca:[
      "Millores respecte de CircuitJS1 5.0.4ts",
      "Vatímetre ampliat: potències activa (P), reactiva fonamental (Q) i aparent (S), cosinus del desfasament, factor de potència real i modes de lectura seleccionables.",
      "Impedància Z en CA: R ± jX, mòdul/argument i representacions equivalents de R, L i C.",
      "Element inversor fotovoltaic, amb modes de connexió a la xarxa i funcionament aïllat.",
      "Entrada i visualització numèrica regional: separadors decimals i de milers, precisió configurable i preferències inicials.",
      "Ampliació de les traduccions dels menús, editors de components, oscil·loscopi i «Quant a» a 22 idiomes.",
      "Circuit trifàsic didàctic inclòs a l'inici del simulador."
    ],
    gl:[
      "Melloras respecto de CircuitJS1 5.0.4ts",
      "Vatímetro ampliado: potencias activa (P), reactiva fundamental (Q) e aparente (S), coseno do desfasamento, factor de potencia real e modos de lectura seleccionables.",
      "Impedancia Z en CA: R ± jX, módulo/argumento e representacións equivalentes de R, L e C.",
      "Elemento inversor fotovoltaico, con funcionamento conectado á rede e illado.",
      "Entrada e visualización numérica rexional: separadores decimais e de millares, precisión configurable e preferencias iniciais.",
      "Ampliación das traducións dos menús, editores de compoñentes, osciloscopio e «Acerca de» a 22 idiomas.",
      "Circuíto trifásico didáctico incluído ao iniciar o simulador."
    ],
    eu:[
      "CircuitJS1 5.0.4ts bertsioarekiko hobekuntzak",
      "Wattmetro hedatua: potentzia aktiboa (P), oinarrizko erreaktiboa (Q) eta itxurazkoa (S), desfasearen kosinua, benetako potentzia-faktorea eta hauta daitezkeen irakurketa-moduak.",
      "Korronte alternoko Z inpedantzia: R ± jX, modulua/argumentua eta R, L eta C adierazpen baliokideak.",
      "Inbertsore fotovoltaikoaren elementua, sarera konektatzeko eta isolatuta funtzionatzeko moduekin.",
      "Eskualdeko zenbaki-formatua sartzean eta bistaratzean: hamartar eta milako bereizleak, doitu daitekeen zehaztasuna eta hasierako hobespenak.",
      "Menuen, osagaien editoreen, osziloskopioaren eta «Honi buruz» leihoaren itzulpenak 22 hizkuntzatara zabaldu dira.",
      "Simulagailua abiatzean zirkuitu trifasiko didaktikoa kargatzen da."
    ],
    fr:[
      "Améliorations par rapport à CircuitJS1 5.0.4ts",
      "Wattmètre étendu : puissances active (P), réactive fondamentale (Q) et apparente (S), cosinus du déphasage, facteur de puissance réel et modes de mesure sélectionnables.",
      "Impédance Z en courant alternatif : R ± jX, module/argument et représentations équivalentes R, L et C.",
      "Élément onduleur photovoltaïque avec modes raccordé au réseau et autonome.",
      "Saisie et affichage régionaux des nombres : séparateurs décimal et des milliers, précision réglable et préférences initiales.",
      "Traduction étendue des menus, éditeurs de composants, oscilloscope et fenêtre «À propos» en 22 langues.",
      "Circuit triphasé pédagogique chargé au démarrage du simulateur."
    ],
    de:[
      "Erweiterungen gegenüber CircuitJS1 5.0.4ts",
      "Erweitertes Wattmeter: Wirk- (P), Grundschwingungsblind- (Q) und Scheinleistung (S), Verschiebungsfaktor, tatsächlicher Leistungsfaktor und wählbare Messmodi.",
      "Wechselstromimpedanz Z: R ± jX, Betrag/Winkel und äquivalente R-, L- und C-Darstellungen.",
      "Photovoltaik-Wechselrichter als Bauteil mit netzgekoppeltem und Inselbetrieb.",
      "Regionale Zahleneingabe und -anzeige: Dezimal- und Tausendertrennzeichen, einstellbare Genauigkeit und Starteinstellungen.",
      "Erweiterte Übersetzung von Menüs, Bauteileditoren, Oszilloskop und Infofenster in 22 Sprachen.",
      "Didaktische Drehstromschaltung beim Start des Simulators."
    ],
    it:[
      "Miglioramenti rispetto a CircuitJS1 5.0.4ts",
      "Wattmetro esteso: potenze attiva (P), reattiva fondamentale (Q) e apparente (S), coseno dello sfasamento, fattore di potenza reale e modalità di lettura selezionabili.",
      "Impedenza Z in CA: R ± jX, modulo/argomento e rappresentazioni equivalenti R, L e C.",
      "Elemento inverter fotovoltaico con funzionamento connesso alla rete e in isola.",
      "Inserimento e visualizzazione numerica regionale: separatori decimali e delle migliaia, precisione configurabile e preferenze iniziali.",
      "Traduzioni ampliate di menu, editor dei componenti, oscilloscopio e finestra «Informazioni» in 22 lingue.",
      "Circuito trifase didattico caricato all'avvio del simulatore."
    ],
    pt:[
      "Melhorias face ao CircuitJS1 5.0.4ts",
      "Vatímetro ampliado: potências ativa (P), reativa fundamental (Q) e aparente (S), cosseno do desfasamento, fator de potência real e modos de leitura selecionáveis.",
      "Impedância Z em CA: R ± jX, módulo/argumento e representações equivalentes R, L e C.",
      "Elemento inversor fotovoltaico com funcionamento ligado à rede e isolado.",
      "Introdução e apresentação numérica regional: separadores decimais e de milhares, precisão configurável e preferências iniciais.",
      "Tradução ampliada dos menus, editores de componentes, osciloscópio e janela «Acerca de» para 22 idiomas.",
      "Circuito trifásico didático carregado ao iniciar o simulador."
    ],
    nl:[
      "Verbeteringen ten opzichte van CircuitJS1 5.0.4ts",
      "Uitgebreide wattmeter: actief (P), fundamenteel reactief (Q) en schijnbaar (S) vermogen, cosinus van de faseverschuiving, werkelijke arbeidsfactor en instelbare meetmodi.",
      "Wisselstroomimpedantie Z: R ± jX, grootte/fasehoek en equivalente R-, L- en C-weergaven.",
      "Fotovoltaïsche omvormer met netgekoppelde en autonome bedrijfsmodi.",
      "Regionale numerieke invoer en weergave: decimaal- en duizendtalscheidingstekens, instelbare precisie en beginvoorkeuren.",
      "Uitgebreide vertaling van menu's, componenteditors, oscilloscoop en het infovenster in 22 talen.",
      "Didactisch driefasencircuit bij het starten van de simulator."
    ],
    sv:[
      "Förbättringar jämfört med CircuitJS1 5.0.4ts",
      "Utökad wattmeter: aktiv (P), grundtonens reaktiva (Q) och skenbara (S) effekt, fasförskjutningens cosinus, verklig effektfaktor och valbara mätlägen.",
      "Växelströmsimpedans Z: R ± jX, belopp/fasvinkel och motsvarande R-, L- och C-visningar.",
      "Solcellsväxelriktare med nätanslutet och fristående driftläge.",
      "Regional inmatning och visning av tal: decimal- och tusentalsavgränsare, valbar precision och startinställningar.",
      "Utökade översättningar av menyer, komponentredigerare, oscilloskop och informationsfönster till 22 språk.",
      "Pedagogisk trefaskrets som laddas vid simulatorns start."
    ],
    da:[
      "Forbedringer i forhold til CircuitJS1 5.0.4ts",
      "Udvidet wattmeter: aktiv (P), grundtonens reaktive (Q) og tilsyneladende (S) effekt, cosinus til faseforskydningen, reel effektfaktor og valgbare måletilstande.",
      "Vekselstrømsimpedans Z: R ± jX, størrelse/fasevinkel og tilsvarende R-, L- og C-visninger.",
      "Solcelleinverter med nettilsluttet og selvstændig drift.",
      "Regional indtastning og visning af tal: decimal- og tusindtalsseparatorer, justerbar præcision og startindstillinger.",
      "Udvidet oversættelse af menuer, komponenteditorer, oscilloskop og informationsvindue til 22 sprog.",
      "Didaktisk trefaset kredsløb indlæses ved simulatorstart."
    ],
    nb:[
      "Forbedringer sammenlignet med CircuitJS1 5.0.4ts",
      "Utvidet wattmeter: aktiv (P), grunnfrekvensens reaktive (Q) og tilsynelatende (S) effekt, cosinus til faseforskyvningen, reell effektfaktor og valgbare målemoduser.",
      "Vekselstrømsimpedans Z: R ± jX, størrelse/fasevinkel og tilsvarende R-, L- og C-visninger.",
      "Solcellevekselretter med nettilkoblet og frittstående drift.",
      "Regional tallinntasting og visning: desimal- og tusenskilletegn, justerbar presisjon og startinnstillinger.",
      "Utvidede oversettelser av menyer, komponentredigerere, oscilloskop og informasjonsside til 22 språk.",
      "Pedagogisk trefasekrets lastes ved oppstart av simulatoren."
    ],
    fi:[
      "CircuitJS1 5.0.4ts -versioon tehdyt parannukset",
      "Laajennettu wattimittari: pätöteho (P), perustaajuuden loisteho (Q) ja näennäisteho (S), vaihe-eron kosini, todellinen tehokerroin ja valittavat mittaustilat.",
      "Vaihtovirran impedanssi Z: R ± jX, itseisarvo/vaihekulma sekä vastaavat R-, L- ja C-esitykset.",
      "Aurinkosähköinvertteri, jossa on verkkoon kytketty ja saareketila.",
      "Alueellinen lukujen syöttö ja näyttö: desimaali- ja tuhaterottimet, säädettävä tarkkuus ja aloitusasetukset.",
      "Valikoiden, komponenttieditorien, oskilloskoopin ja Tietoja-ikkunan käännökset 22 kielelle.",
      "Opetuskäyttöön tarkoitettu kolmivaihepiiri ladataan simulaattorin käynnistyessä."
    ],
    pl:[
      "Ulepszenia względem CircuitJS1 5.0.4ts",
      "Rozszerzony watomierz: moc czynna (P), bierna składowej podstawowej (Q) i pozorna (S), cosinus przesunięcia fazowego, rzeczywisty współczynnik mocy i wybieralne tryby pomiaru.",
      "Impedancja Z dla prądu przemiennego: R ± jX, moduł/kąt oraz równoważne przedstawienia R, L i C.",
      "Falownik fotowoltaiczny z trybem pracy sieciowej i wyspowej.",
      "Regionalne wprowadzanie i wyświetlanie liczb: separatory dziesiętne i tysięcy, regulowana precyzja i ustawienia początkowe.",
      "Rozszerzone tłumaczenia menu, edytorów elementów, oscyloskopu i okna Informacje na 22 języki.",
      "Dydaktyczny obwód trójfazowy ładowany przy uruchomieniu symulatora."
    ],
    csx:[
      "Vylepšení oproti CircuitJS1 5.0.4ts",
      "Rozšířený wattmetr: činný (P), jalový výkon základní harmonické (Q) a zdánlivý výkon (S), kosinus fázového posunu, skutečný účiník a volitelné režimy měření.",
      "Impedance Z pro střídavý proud: R ± jX, velikost/fázový úhel a ekvivalentní zobrazení R, L a C.",
      "Fotovoltaický střídač se síťovým a ostrovním režimem provozu.",
      "Regionální zadávání a zobrazení čísel: oddělovače desetinných míst a tisíců, nastavitelná přesnost a úvodní nastavení.",
      "Rozšířené překlady nabídek, editorů součástek, osciloskopu a okna O programu do 22 jazyků.",
      "Výukový třífázový obvod načítaný při spuštění simulátoru."
    ],
    ru:[
      "Улучшения по сравнению с CircuitJS1 5.0.4ts",
      "Расширенный ваттметр: активная (P), реактивная по основной гармонике (Q) и полная (S) мощность, косинус фазового сдвига, действительный коэффициент мощности и выбираемые режимы измерения.",
      "Импеданс Z для переменного тока: R ± jX, модуль/фаза и эквивалентные представления R, L и C.",
      "Фотоэлектрический инвертор с сетевым и автономным режимами.",
      "Региональные форматы ввода и отображения чисел: десятичный разделитель и разделитель тысяч, настраиваемая точность и начальные параметры.",
      "Расширенные переводы меню, редакторов элементов, осциллографа и окна «О программе» на 22 языка.",
      "Учебная трёхфазная схема загружается при запуске симулятора."
    ],
    zh:[
      "相对于 CircuitJS1 5.0.4ts 的改进",
      "扩展功率表：有功功率 (P)、基波无功功率 (Q)、视在功率 (S)、位移功率因数、真实功率因数及可选读数模式。",
      "交流阻抗 Z：R ± jX、幅值/相位角及等效 R、L、C 表示。",
      "新增光伏逆变器元件，支持并网及离网模式。",
      "区域化数字输入与显示：小数及千位分隔符、可调精度和初始设置。",
      "扩展菜单、元件编辑器、示波器和“关于”窗口的翻译，支持 22 种语言。",
      "仿真器启动时加载教学用三相电路。"
    ],
    "zh-tw":[
      "相對於 CircuitJS1 5.0.4ts 的改進",
      "擴充功率表：有功功率 (P)、基波無功功率 (Q)、視在功率 (S)、位移功率因數、真實功率因數及可選讀值模式。",
      "交流阻抗 Z：R ± jX、大小／相位角及等效 R、L、C 表示。",
      "新增太陽能逆變器元件，支援併網及離網模式。",
      "區域化數字輸入與顯示：小數及千位分隔符、可調精度和初始設定。",
      "擴充選單、元件編輯器、示波器及「關於」視窗的翻譯，支援 22 種語言。",
      "模擬器啟動時載入教學用三相電路。"
    ],
    ja:[
      "CircuitJS1 5.0.4ts からの改良点",
      "拡張電力計：有効電力 (P)、基本波無効電力 (Q)、皮相電力 (S)、位相差の余弦、真の力率、選択可能な測定モード。",
      "交流インピーダンス Z：R ± jX、絶対値／位相角、等価な R・L・C 表示。",
      "系統連系モードと独立運転モードを備えた太陽光発電インバーター素子。",
      "地域別の数値入力・表示：小数点と桁区切り、精度設定、起動時設定。",
      "メニュー、部品編集画面、オシロスコープ、「バージョン情報」の翻訳を22言語に拡充。",
      "起動時に教材用の三相回路を読み込みます。"
    ],
    kr:[
      "CircuitJS1 5.0.4ts 대비 개선 사항",
      "확장 전력계: 유효전력 (P), 기본파 무효전력 (Q), 피상전력 (S), 위상차 코사인, 실제 역률 및 선택 가능한 측정 모드.",
      "교류 임피던스 Z: R ± jX, 크기/위상각 및 등가 R·L·C 표시.",
      "계통 연계 및 독립 운전 모드를 지원하는 태양광 인버터 부품.",
      "지역별 숫자 입력 및 표시: 소수점과 천 단위 구분 기호, 정밀도 설정 및 시작 환경설정.",
      "메뉴, 부품 편집기, 오실로스코프와 정보 창의 번역을 22개 언어로 확장.",
      "시뮬레이터 시작 시 교육용 3상 회로를 불러옵니다."
    ]
  };
  const strings=changes[lang]||changes.en;
  if(strings.length!==7)throw Error("Incomplete improvements translations for "+lang);
  const heading=document.getElementById("jgr-improvements-title");
  const list=document.getElementById("jgr-improvements-list");
  if(!heading||!list)return;
  heading.textContent=strings[0];
  list.replaceChildren(...strings.slice(1).map(item=>{
    const li=document.createElement("li");
    li.textContent=item;
    return li;
  }));
})();
