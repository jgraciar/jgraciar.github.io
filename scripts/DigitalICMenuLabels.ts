// SPDX-License-Identifier: GPL-3.0-or-later
const heads:Record<string,string[]>={
 en:['Logic gates','Flip-flops and latches','Shift registers','Counters','Encoders and decoders','Multiplexers','Memory and arithmetic','Other digital components'],
 es:['Puertas lógicas','Biestables y latch','Registros de desplazamiento','Contadores','Codificadores y decodificadores','Multiplexores','Memoria y aritmética','Otros componentes digitales'],
 ca:['Portes lògiques','Biestables i latch','Registres de desplaçament','Comptadors','Codificadors i descodificadors','Multiplexors','Memòria i aritmètica','Altres components digitals'],
 gl:['Portas lóxicas','Biestables e latch','Rexistros de desprazamento','Contadores','Codificadores e descodificadores','Multiplexores','Memoria e aritmética','Outros compoñentes dixitais'],
 eu:['Ate logikoak','Biegonkorrak eta latch','Desplazamendu-erregistroak','Kontagailuak','Kodetzaileak eta deskodetzaileak','Multiplexadoreak','Memoria eta aritmetika','Beste osagai digitalak'],
 fr:['Portes logiques','Bascules et verrous','Registres à décalage','Compteurs','Codeurs et décodeurs','Multiplexeurs','Mémoire et arithmétique','Autres composants numériques'],
 de:['Logikgatter','Flipflops und Latches','Schieberegister','Zähler','Codierer und Decodierer','Multiplexer','Speicher und Arithmetik','Weitere Digitalbausteine'],
 it:['Porte logiche','Flip-flop e latch','Registri a scorrimento','Contatori','Codificatori e decodificatori','Multiplexer','Memoria e aritmetica','Altri componenti digitali'],
 pt:['Portas lógicas','Biestáveis e latches','Registos de deslocamento','Contadores','Codificadores e descodificadores','Multiplexadores','Memória e aritmética','Outros componentes digitais'],
 nl:['Logische poorten','Flipflops en latches','Schuifregisters','Tellers','Encoders en decoders','Multiplexers','Geheugen en rekenkunde','Overige digitale componenten'],
 sv:['Logikgrindar','Vippor och låskretsar','Skiftregister','Räknare','Kodare och avkodare','Multiplexrar','Minne och aritmetik','Övriga digitala komponenter'],
 da:['Logiske porte','Flipflops og latches','Skifteregistre','Tællere','Kodere og dekodere','Multipleksere','Hukommelse og aritmetik','Andre digitale komponenter'],
 nb:['Logiske porter','Vipper og låsekretser','Skiftregistre','Tellere','Kodere og dekodere','Multipleksere','Minne og aritmetikk','Andre digitale komponenter'],
 fi:['Logiikkaportit','Kiikut ja salvat','Siirtorekisterit','Laskurit','Kooderit ja dekooderit','Multiplekserit','Muisti ja aritmetiikka','Muut digitaaliset komponentit'],
 pl:['Bramki logiczne','Przerzutniki i zatrzaski','Rejestry przesuwne','Liczniki','Kodery i dekodery','Multipleksery','Pamięć i arytmetyka','Pozostałe elementy cyfrowe'],
 csx:['Logická hradla','Klopné obvody a západky','Posuvné registry','Čítače','Kodéry a dekodéry','Multiplexory','Paměť a aritmetika','Ostatní digitální součástky'],
 ru:['Логические элементы','Триггеры и защёлки','Сдвиговые регистры','Счётчики','Кодеры и декодеры','Мультиплексоры','Память и арифметика','Другие цифровые компоненты'],
 zh:['逻辑门','触发器和锁存器','移位寄存器','计数器','编码器和解码器','多路选择器','存储器和算术','其他数字元件'],
 'zh-tw':['邏輯閘','正反器與鎖存器','移位暫存器','計數器','編碼器與解碼器','多工器','記憶體與算術','其他數位元件'],
 ja:['論理ゲート','フリップフロップとラッチ','シフトレジスタ','カウンタ','エンコーダとデコーダ','マルチプレクサ','メモリと算術','その他のデジタル部品'],
 kr:['논리 게이트','플립플롭과 래치','시프트 레지스터','카운터','인코더와 디코더','멀티플렉서','메모리와 산술','기타 디지털 부품']
};
const groups=['gate','latch','register','counter','codec','mux','memory','other'];
const schmittHeads:Record<string,string>={
 en:'Schmitt triggers (integrated circuits)',
 es:'Disparadores Schmitt (circuitos integrados)',
 ca:'Disparadors Schmitt (circuits integrats)',
 gl:'Disparadores Schmitt (circuítos integrados)',
 eu:'Schmitt abiarazleak (zirkuitu integratuak)',
 fr:'Déclencheurs de Schmitt (circuits intégrés)',
 de:'Schmitt-Trigger (integrierte Schaltungen)',
 it:'Trigger di Schmitt (circuiti integrati)',
 pt:'Disparadores Schmitt (circuitos integrados)',
 nl:'Schmitt-triggers (geïntegreerde schakelingen)',
 sv:'Schmitt-triggerkretsar (integrerade kretsar)',
 da:'Schmitt-triggere (integrerede kredsløb)',
 nb:'Schmitt-triggere (integrerte kretser)',
 fi:'Schmitt-liipaisimet (integroidut piirit)',
 pl:'Przerzutniki Schmitta (układy scalone)',
 csx:'Schmittovy klopné obvody (integrované obvody)',
 ru:'Триггеры Шмитта (интегральные схемы)',
 zh:'施密特触发器（集成电路）',
 'zh-tw':'施密特觸發器（積體電路）',
 ja:'シュミットトリガー（集積回路）',
 kr:'슈미트 트리거 (집적 회로)'
};
export function digitalICGroup(group:string,language:string):string{const lang=language==='ca-es-valencia'?'ca':language;return group==='schmitt'?(schmittHeads[lang]||schmittHeads.en):(heads[lang]||heads.en)[groups.indexOf(group)];}
const english:Record<string,string>={
 '74373':'Octal D latch (3-state)','7475':'Quad D latch (Q, /Q)','74194':'4-bit universal shift register','74164':'8-bit SIPO shift register','74165':'8-bit PISO shift register','74190':'BCD up/down counter','74192':'BCD up/down counter (dual clock)','74168':'Synchronous BCD up/down counter','7447':'BCD → 7 segments (open collector)','74147':'Priority encoder 10 → 4','74138':'Decoder 3 → 8','74151':'Multiplexer 8 → 1 (Y, /Y)','54151':'Multiplexer 8 → 1 (Y, /Y)','74152':'Inverting multiplexer 8 → 1','74150':'Inverting multiplexer 16 → 1','74181':'4-bit ALU','74189':'RAM 16 × 4 (inverting, 3-state)'
};
export function digitalICName(part:string,spanish:string,language:string):string{return part+' '+(language==='es'?spanish:english[part]||spanish);}
