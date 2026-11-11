// Características incorporadas a Circuit JGR respecto a CircuitJS1 5.0.5ts.
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
  // Un único bloque por función, con el mismo contenido en los 22 idiomas.
  const improvements={
  "en": [
    "Improvements over CircuitJS1 5.0.5ts",
    "Extended wattmeter: active (P), fundamental reactive (Q) and apparent (S) power, phase-displacement cosine, true power factor and selectable reading modes; voltage and current THD and non-fundamental residual D*.",
    "AC impedance Z: R ± jX, magnitude/phase and equivalent R, L and C representations.",
    "Photovoltaic inverter element, with grid-connected and stand-alone modes.",
    "Regional number input and display: decimal and thousands separators, configurable precision and initial preferences. Electrical display with four decimal places by default, no unnecessary trailing decimal zeros, automatic or selectable unit prefixes, and numeric input with scientific notation, SI prefixes and RMS values.",
    "Nonlinear loads: configurable single-phase bridge with LED and computer power-supply examples without PFC, unit multiplier and three-phase six-pulse rectifier for drive input stages (without inverter or motor).",
    "TTL and CMOS digital ICs: 45 numbered references, including gates, flip-flops, counters, registers, encoders, multiplexers, memories and ALU; explicit supply pins on the new DIP models.",
    "IC information from the context menu: physical pinouts where defined, internal gates or functional blocks, operation tables and instantaneous voltages; double-click retains parameter editing.",
    "Reorganization of menus and submenus",
    "Improved and expanded translation into 22 languages"
  ],
  "ca-es-valencia": [
    "Millores respecte de CircuitJS1 5.0.5ts",
    "Vatímetre ampliat: potències activa (P), reactiva fonamental (Q) i aparent (S), cosinus del desfasament, factor de potència real i modes de lectura seleccionables; THD de tensió i corrent i residual no fonamental D*.",
    "Impedància Z en CA: R ± jX, mòdul/argument i representacions equivalents de R, L i C.",
    "Element inversor fotovoltaic, amb modes de connexió a xarxa i funcionament aïllat.",
    "Entrada i visualització numèrica regional: separadors decimals i de milers, precisió configurable i preferències inicials. Presentació elèctrica amb quatre decimals per defecte, sense zeros decimals innecessaris, prefixos d’unitats automàtics o seleccionables i entrada amb notació científica, prefixos SI i valors RMS.",
    "Càrregues no lineals: pont monofàsic configurable amb exemples de LED i fonts d'alimentació d'ordinador sense PFC, multiplicador d'unitats i rectificador trifàsic de sis polsos per a l'entrada dels variadors (sense inversor ni motor).",
    "Integrats digitals TTL i CMOS: 45 referències numerades, incloent-hi portes, biestables, comptadors, registres, codificadors, multiplexors, memòries i ALU; alimentació explícita en els nous models DIP.",
    "Informació dels integrats des del menú contextual: patillatges físics quan estan definits, portes o blocs interns, taules de funcionament i tensions instantànies; el doble clic conserva l’edició de paràmetres.",
    "Reorganització de menús i submenús",
    "Traducció millorada i ampliada a 22 idiomes"
  ],
  "es": [
    "Mejoras respecto a CircuitJS1 5.0.5ts",
    "Vatímetro ampliado: potencias activa (P), reactiva fundamental (Q) y aparente (S), coseno del desfase, factor de potencia real y modos de lectura seleccionables; THD de tensión y corriente y residual no fundamental D*.",
    "Impedancia Z en CA: R ± jX, módulo/argumento y representaciones equivalentes de R, L y C.",
    "Elemento inversor fotovoltaico, con funcionamiento conectado a red y aislado.",
    "Formato numérico regional con separadores decimales y de miles, cuatro decimales por defecto y supresión de ceros innecesarios; prefijos de unidades automáticos o seleccionables y entrada con notación científica, prefijos SI y valores RMS.",
    "Cargas no lineales: puente monofásico configurable con ejemplos de LED y fuentes de ordenador sin PFC, multiplicador de unidades y rectificador trifásico de seis pulsos para la entrada de variadores (sin inversor ni motor).",
    "Integrados digitales TTL y CMOS: 45 referencias numeradas, incluidas puertas, biestables, contadores, registros, codificadores, multiplexores, memorias y ALU; encapsulados alimentados en los nuevos modelos DIP.",
    "Información de integrados desde el menú contextual: patillajes físicos cuando están definidos, puertas o bloques internos, tablas de funcionamiento y tensiones instantáneas; el doble clic conserva la edición de parámetros.",
    "Reorganización de menús y submenús",
    "Traducción mejorada y ampliada a 22 idiomas"
  ],
  "ca": [
    "Millores respecte de CircuitJS1 5.0.5ts",
    "Vatímetre ampliat: potències activa (P), reactiva fonamental (Q) i aparent (S), cosinus del desfasament, factor de potència real i modes de lectura seleccionables; THD de tensió i corrent i residual no fonamental D*.",
    "Impedància Z en CA: R ± jX, mòdul/argument i representacions equivalents de R, L i C.",
    "Element inversor fotovoltaic, amb modes de connexió a la xarxa i funcionament aïllat.",
    "Entrada i visualització numèrica regional: separadors decimals i de milers, precisió configurable i preferències inicials. Presentació elèctrica amb quatre decimals per defecte, sense zeros decimals innecessaris, prefixos d’unitats automàtics o seleccionables i entrada amb notació científica, prefixos SI i valors RMS.",
    "Càrregues no lineals: pont monofàsic configurable amb exemples de LED i fonts d'alimentació d'ordinador sense PFC, multiplicador d'unitats i rectificador trifàsic de sis polsos per a l'entrada dels variadors (sense inversor ni motor).",
    "Integrats digitals TTL i CMOS: 45 referències numerades, incloent portes, biestables, comptadors, registres, codificadors, multiplexors, memòries i ALU; alimentació explícita als nous models DIP.",
    "Informació dels integrats des del menú contextual: patillatges físics quan estan definits, portes o blocs interns, taules de funcionament i tensions instantànies; el doble clic conserva l’edició de paràmetres.",
    "Reorganització de menús i submenús",
    "Traducció millorada i ampliada a 22 idiomes"
  ],
  "gl": [
    "Melloras respecto de CircuitJS1 5.0.5ts",
    "Vatímetro ampliado: potencias activa (P), reactiva fundamental (Q) e aparente (S), coseno do desfasamento, factor de potencia real e modos de lectura seleccionables; THD de tensión e corrente e residual non fundamental D*.",
    "Impedancia Z en CA: R ± jX, módulo/argumento e representacións equivalentes de R, L e C.",
    "Elemento inversor fotovoltaico, con funcionamento conectado á rede e illado.",
    "Entrada e visualización numérica rexional: separadores decimais e de millares, precisión configurable e preferencias iniciais. Presentación eléctrica con catro decimais por defecto, sen ceros decimais innecesarios, prefixos automáticos ou seleccionables e entrada con notación científica, prefixos SI e valores RMS.",
    "Cargas non lineais: ponte monofásica configurable con exemplos LED e fontes de ordenador sen PFC, multiplicador de unidades e rectificador trifásico de seis pulsos para a entrada dos variadores (sen inversor nin motor).",
    "Integrados dixitais TTL e CMOS: 45 referencias numeradas, con portas, biestables, contadores, rexistros, codificadores, multiplexores, memorias e ALU; alimentación explícita nos novos modelos DIP.",
    "Información dos integrados no menú contextual: patillaxes físicas cando están definidas, portas ou bloques internos, táboas de funcionamento e tensións instantáneas; o dobre clic conserva a edición de parámetros.",
    "Reorganización de menús e submenús",
    "Tradución mellorada e ampliada a 22 idiomas"
  ],
  "eu": [
    "CircuitJS1 5.0.5ts bertsioarekiko hobekuntzak",
    "Wattmetro hedatua: potentzia aktiboa (P), oinarrizko erreaktiboa (Q) eta itxurazkoa (S), desfasearen kosinua, benetako potentzia-faktorea eta hauta daitezkeen irakurketa-moduak; tentsioaren eta korrontearen THD eta D* hondar ez-funtsezkoa.",
    "Korronte alternoko Z inpedantzia: R ± jX, modulua/argumentua eta R, L eta C adierazpen baliokideak.",
    "Inbertsore fotovoltaikoaren elementua, sarera konektatzeko eta isolatuta funtzionatzeko moduekin.",
    "Eskualdeko zenbaki-formatua sartzean eta bistaratzean: hamartar eta milako bereizleak, doitu daitekeen zehaztasuna eta hasierako hobespenak. Aurkezpen elektrikoa lau hamartarrekin lehenespenez, alferrikako amaierako zerorik gabe, unitate-aurrizki automatiko edo hautagarriekin eta notazio zientifiko, SI aurrizki eta RMS balioen sarrerarekin.",
    "Karga ez-linealak: PFCrik gabeko LED eta ordenagailu-iturrien adibideak dituen zubi monofasiko konfiguragarria, unitate-biderkatzailea eta sei pultsuko zuzentzaile trifasikoa eragingailuen sarreran (inbertsorerik eta motorrik gabe).",
    "TTL eta CMOS zirkuitu integratu digitalak: 45 erreferentzia zenbakitu, ateak, biegonkorrak, kontagailuak, erregistroak, kodetzaileak, multiplexadoreak, memoriak eta ALU barne; elikadura-pin esplizituak DIP eredu berrietan.",
    "Integratuen informazioa testuinguru-menuan: pin fisikoak definituta daudenean, barneko ateak edo blokeak, funtzionamendu-taulak eta uneko tentsioak; klik bikoitzak parametroen edizioa mantentzen du.",
    "Menuen eta azpimenuen berrantolaketa",
    "Itzulpen hobetua eta 22 hizkuntzatara zabaldua"
  ],
  "fr": [
    "Améliorations par rapport à CircuitJS1 5.0.5ts",
    "Wattmètre étendu : puissances active (P), réactive fondamentale (Q) et apparente (S), cosinus du déphasage, facteur de puissance réel et modes de mesure sélectionnables; THD de tension et de courant et résidu non fondamental D*.",
    "Impédance Z en courant alternatif : R ± jX, module/argument et représentations équivalentes R, L et C.",
    "Élément onduleur photovoltaïque avec modes raccordé au réseau et autonome.",
    "Saisie et affichage régionaux des nombres : séparateurs décimal et des milliers, précision réglable et préférences initiales. Affichage électrique avec quatre décimales par défaut, sans zéros décimaux superflus, préfixes automatiques ou sélectionnables et saisie en notation scientifique, préfixes SI et valeurs RMS.",
    "Charges non linéaires : pont monophasé configurable avec exemples de LED et alimentations d'ordinateur sans PFC, multiplicateur d'appareils et redresseur triphasé à six impulsions pour l'entrée des variateurs (sans onduleur ni moteur).",
    "Circuits intégrés numériques TTL et CMOS : 45 références numérotées, avec portes, bascules, compteurs, registres, codeurs, multiplexeurs, mémoires et ALU ; alimentation explicite des nouveaux modèles DIP.",
    "Informations des circuits intégrés par le menu contextuel : brochages physiques définis, portes ou blocs internes, tables de fonctionnement et tensions instantanées ; le double-clic conserve l’édition des paramètres.",
    "Réorganisation des menus et sous-menus",
    "Traduction améliorée et étendue à 22 langues"
  ],
  "de": [
    "Erweiterungen gegenüber CircuitJS1 5.0.5ts",
    "Erweitertes Wattmeter: Wirk- (P), Grundschwingungsblind- (Q) und Scheinleistung (S), Verschiebungsfaktor, tatsächlicher Leistungsfaktor und wählbare Messmodi; Spannungs- und Strom-THD sowie nichtfundamentalem Rest D*.",
    "Wechselstromimpedanz Z: R ± jX, Betrag/Winkel und äquivalente R-, L- und C-Darstellungen.",
    "Photovoltaik-Wechselrichter als Bauteil mit netzgekoppeltem und Inselbetrieb.",
    "Regionale Zahleneingabe und -anzeige: Dezimal- und Tausendertrennzeichen, einstellbare Genauigkeit und Starteinstellungen. Elektrische Anzeige mit standardmäßig vier Dezimalstellen, ohne unnötige nachgestellte Nullen, automatischen oder wählbaren Einheitenpräfixen und Eingabe mit wissenschaftlicher Notation, SI-Präfixen und RMS-Werten.",
    "Nichtlineare Lasten: konfigurierbare einphasige Gleichrichterbrücke mit LED- und PC-Netzteilbeispielen ohne PFC, Gerätemultiplikator und dreiphasiger Sechspuls-Gleichrichter als Eingangsstufe von Antrieben (ohne Wechselrichter und Motor).",
    "Digitale TTL- und CMOS-ICs: 45 nummerierte Typen mit Gattern, Flipflops, Zählern, Registern, Codierern, Multiplexern, Speichern und ALU; explizite Versorgungspins bei neuen DIP-Modellen.",
    "IC-Informationen im Kontextmenü: definierte physische Pinbelegungen, interne Gatter oder Funktionsblöcke, Funktionstabellen und Momentanspannungen; Doppelklick bearbeitet weiterhin die Parameter.",
    "Neuordnung der Menüs und Untermenüs",
    "Verbesserte und auf 22 Sprachen erweiterte Übersetzung"
  ],
  "it": [
    "Miglioramenti rispetto a CircuitJS1 5.0.5ts",
    "Wattmetro esteso: potenze attiva (P), reattiva fondamentale (Q) e apparente (S), coseno dello sfasamento, fattore di potenza reale e modalità di lettura selezionabili; THD di tensione e corrente e residuo non fondamentale D*.",
    "Impedenza Z in CA: R ± jX, modulo/argomento e rappresentazioni equivalenti R, L e C.",
    "Elemento inverter fotovoltaico con funzionamento connesso alla rete e in isola.",
    "Inserimento e visualizzazione numerica regionale: separatori decimali e delle migliaia, precisione configurabile e preferenze iniziali. Visualizzazione elettrica con quattro decimali predefiniti, senza zeri decimali superflui, prefissi automatici o selezionabili e immissione con notazione scientifica, prefissi SI e valori RMS.",
    "Carichi non lineari: ponte monofase configurabile con esempi LED e alimentatori per computer senza PFC, moltiplicatore delle unità e raddrizzatore trifase a sei impulsi per l'ingresso degli azionamenti (senza inverter o motore).",
    "Integrati digitali TTL e CMOS: 45 riferimenti numerati, con porte, flip-flop, contatori, registri, codificatori, multiplexer, memorie e ALU; alimentazione esplicita nei nuovi modelli DIP.",
    "Informazioni sugli integrati dal menu contestuale: piedinature fisiche definite, porte o blocchi interni, tabelle di funzionamento e tensioni istantanee; il doppio clic mantiene la modifica dei parametri.",
    "Riorganizzazione di menu e sottomenu",
    "Traduzione migliorata e ampliata a 22 lingue"
  ],
  "pt": [
    "Melhorias face ao CircuitJS1 5.0.5ts",
    "Vatímetro ampliado: potências ativa (P), reativa fundamental (Q) e aparente (S), cosseno do desfasamento, fator de potência real e modos de leitura selecionáveis; THD de tensão e corrente e residual não fundamental D*.",
    "Impedância Z em CA: R ± jX, módulo/argumento e representações equivalentes R, L e C.",
    "Elemento inversor fotovoltaico com funcionamento ligado à rede e isolado.",
    "Introdução e apresentação numérica regional: separadores decimais e de milhares, precisão configurável e preferências iniciais. Apresentação elétrica com quatro casas decimais por defeito, sem zeros decimais desnecessários, prefixos automáticos ou selecionáveis e entrada com notação científica, prefixos SI e valores RMS.",
    "Cargas não lineares: ponte monofásica configurável com exemplos LED e fontes de computador sem PFC, multiplicador de unidades e retificador trifásico de seis pulsos para a entrada dos variadores (sem inversor nem motor).",
    "Integrados digitais TTL e CMOS: 45 referências numeradas, com portas, biestáveis, contadores, registos, codificadores, multiplexadores, memórias e ALU; alimentação explícita nos novos modelos DIP.",
    "Informações dos integrados no menu de contexto: pinagens físicas definidas, portas ou blocos internos, tabelas de funcionamento e tensões instantâneas; o duplo clique mantém a edição de parâmetros.",
    "Reorganização de menus e submenus",
    "Tradução melhorada e alargada a 22 idiomas"
  ],
  "nl": [
    "Verbeteringen ten opzichte van CircuitJS1 5.0.5ts",
    "Uitgebreide wattmeter: actief (P), fundamenteel reactief (Q) en schijnbaar (S) vermogen, cosinus van de faseverschuiving, werkelijke arbeidsfactor en instelbare meetmodi; spannings- en stroom-THD en niet-fundamenteel residu D*.",
    "Wisselstroomimpedantie Z: R ± jX, grootte/fasehoek en equivalente R-, L- en C-weergaven.",
    "Fotovoltaïsche omvormer met netgekoppelde en autonome bedrijfsmodi.",
    "Regionale numerieke invoer en weergave: decimaal- en duizendtalscheidingstekens, instelbare precisie en beginvoorkeuren. Elektrische weergave met standaard vier decimalen, zonder overbodige eindnullen, automatische of instelbare eenheidsprefixen en invoer met wetenschappelijke notatie, SI-prefixen en RMS-waarden.",
    "Niet-lineaire belastingen: instelbare eenfasige gelijkrichterbrug met LED- en computervoedingvoorbeelden zonder PFC, vermenigvuldiging van eenheden en driefasige zespulsgelijkrichter voor aandrijvingen (zonder omvormer of motor).",
    "Digitale TTL- en CMOS-IC’s: 45 genummerde typen, met poorten, flipflops, tellers, registers, encoders, multiplexers, geheugens en ALU; expliciete voedingspinnen op nieuwe DIP-modellen.",
    "IC-informatie via het contextmenu: gedefinieerde fysieke pinaansluitingen, interne poorten of blokken, functietabellen en momentane spanningen; dubbelklikken blijft parameters bewerken.",
    "Herindeling van menu’s en submenu’s",
    "Verbeterde en uitgebreide vertaling naar 22 talen"
  ],
  "sv": [
    "Förbättringar jämfört med CircuitJS1 5.0.5ts",
    "Utökad wattmeter: aktiv (P), grundtonens reaktiva (Q) och skenbara (S) effekt, fasförskjutningens cosinus, verklig effektfaktor och valbara mätlägen; spännings- och ström-THD samt icke-grundtonens residual D*.",
    "Växelströmsimpedans Z: R ± jX, belopp/fasvinkel och motsvarande R-, L- och C-visningar.",
    "Solcellsväxelriktare med nätanslutet och fristående driftläge.",
    "Regional inmatning och visning av tal: decimal- och tusentalsavgränsare, valbar precision och startinställningar. Elektrisk visning med fyra decimaler som standard, utan onödiga avslutande nollor, automatiska eller valbara enhetsprefix samt inmatning med vetenskaplig notation, SI-prefix och RMS-värden.",
    "Icke-linjära laster: konfigurerbar enfasig likriktarbrygga med LED- och datornätaggregat utan PFC, multiplikator för antal enheter samt trefasig sexpuls-likriktare för frekvensomriktarens ingång (utan växelriktare och motor).",
    "Digitala TTL- och CMOS-kretsar: 45 numrerade typer med grindar, vippor, räknare, register, kodare, multiplexrar, minnen och ALU; uttryckliga matningsstift på nya DIP-modeller.",
    "Kretsinformation i snabbmenyn: definierade fysiska stift, interna grindar eller block, funktionstabeller och momentanspänningar; dubbelklick behåller parameterredigeringen.",
    "Omorganisering av menyer och undermenyer",
    "Förbättrad och utökad översättning till 22 språk"
  ],
  "da": [
    "Forbedringer i forhold til CircuitJS1 5.0.5ts",
    "Udvidet wattmeter: aktiv (P), grundtonens reaktive (Q) og tilsyneladende (S) effekt, cosinus til faseforskydningen, reel effektfaktor og valgbare måletilstande; spændings- og strøm-THD samt ikke-fundamental rest D*.",
    "Vekselstrømsimpedans Z: R ± jX, størrelse/fasevinkel og tilsvarende R-, L- og C-visninger.",
    "Solcelleinverter med nettilsluttet og selvstændig drift.",
    "Regional indtastning og visning af tal: decimal- og tusindtalsseparatorer, justerbar præcision og startindstillinger. Elektrisk visning med fire decimaler som standard, uden unødvendige afsluttende nuller, automatiske eller valgbare enhedspræfikser og indtastning med videnskabelig notation, SI-præfikser og RMS-værdier.",
    "Ikke-lineære belastninger: konfigurerbar enfaset ensretterbro med LED- og computerforsyningseksempler uden PFC, multiplikator for antal enheder og trefaset sekspuls-ensretter til frekvensomformerens indgang (uden inverter og motor).",
    "Digitale TTL- og CMOS-kredse: 45 nummererede typer med porte, flip-flops, tællere, registre, kodere, multipleksere, hukommelser og ALU; eksplicit forsyning på nye DIP-modeller.",
    "Kredsinformation i genvejsmenuen: definerede fysiske ben, interne porte eller blokke, funktionstabeller og øjebliksspændinger; dobbeltklik bevarer parameterredigering.",
    "Omorganisering af menuer og undermenuer",
    "Forbedret og udvidet oversættelse til 22 sprog"
  ],
  "nb": [
    "Forbedringer sammenlignet med CircuitJS1 5.0.5ts",
    "Utvidet wattmeter: aktiv (P), grunnfrekvensens reaktive (Q) og tilsynelatende (S) effekt, cosinus til faseforskyvningen, reell effektfaktor og valgbare målemoduser; spennings- og strøm-THD og ikke-fundamental rest D*.",
    "Vekselstrømsimpedans Z: R ± jX, størrelse/fasevinkel og tilsvarende R-, L- og C-visninger.",
    "Solcellevekselretter med nettilkoblet og frittstående drift.",
    "Regional tallinntasting og visning: desimal- og tusenskilletegn, justerbar presisjon og startinnstillinger. Elektrisk visning med fire desimaler som standard, uten unødvendige avsluttende nuller, automatiske eller valgbare enhetsprefikser og inntasting med vitenskapelig notasjon, SI-prefikser og RMS-verdier.",
    "Ikke-lineære laster: konfigurerbar enfaset likeretterbro med LED- og datamaskinstrømforsyningseksempler uten PFC, multiplikator for antall enheter og trefaset sekspuls-likeretter på frekvensomformerens inngang (uten vekselretter og motor).",
    "Digitale TTL- og CMOS-kretser: 45 nummererte typer med porter, vipper, tellere, registre, kodere, multipleksere, minner og ALU; eksplisitt forsyning på nye DIP-modeller.",
    "Kretsinformasjon i kontekstmenyen: definerte fysiske pinner, interne porter eller blokker, funksjonstabeller og øyeblikksspenninger; dobbeltklikk beholder parameterredigeringen.",
    "Omorganisering av menyer og undermenyer",
    "Forbedret og utvidet oversettelse til 22 språk"
  ],
  "fi": [
    "CircuitJS1 5.0.5ts -versioon tehdyt parannukset",
    "Laajennettu wattimittari: pätöteho (P), perustaajuuden loisteho (Q) ja näennäisteho (S), vaihe-eron kosini, todellinen tehokerroin ja valittavat mittaustilat; jännitteen ja virran THD sekä ei-perustaajuinen jäännös D*.",
    "Vaihtovirran impedanssi Z: R ± jX, itseisarvo/vaihekulma sekä vastaavat R-, L- ja C-esitykset.",
    "Aurinkosähköinvertteri, jossa on verkkoon kytketty ja saareketila.",
    "Alueellinen lukujen syöttö ja näyttö: desimaali- ja tuhaterottimet, säädettävä tarkkuus ja aloitusasetukset. Sähkösuureiden näyttö oletuksena neljällä desimaalilla, ilman tarpeettomia loppunollia, automaattisin tai valittavin yksikköetuliittein sekä syöttö tieteellisellä esitystavalla, SI-etuliitteillä ja RMS-arvoilla.",
    "Epälineaariset kuormat: säädettävä yksivaiheinen tasasuuntaussilta LED- ja tietokonevirtalähde-esimerkeillä ilman PFC:tä, yksikkökertoimella sekä kolmivaiheinen kuusipulssitasasuuntaaja taajuusmuuttajan tuloon (ilman vaihtosuuntaajaa ja moottoria).",
    "Digitaaliset TTL- ja CMOS-piirit: 45 numeroitua tyyppiä, kuten portit, kiikut, laskurit, rekisterit, kooderit, multiplekserit, muistit ja ALU; erilliset syöttönastat uusissa DIP-malleissa.",
    "Piiritiedot pikavalikosta: määritellyt fyysiset nastat, sisäiset portit tai lohkot, toimintataulukot ja hetkelliset jännitteet; kaksoisnapsautus säilyttää parametrien muokkauksen.",
    "Valikoiden ja alivalikoiden uudelleenjärjestely",
    "Parannettu ja 22 kieleen laajennettu käännös"
  ],
  "pl": [
    "Ulepszenia względem CircuitJS1 5.0.5ts",
    "Rozszerzony watomierz: moc czynna (P), bierna składowej podstawowej (Q) i pozorna (S), cosinus przesunięcia fazowego, rzeczywisty współczynnik mocy i wybieralne tryby pomiaru; THD napięcia i prądu oraz pozostałość niesinusoidalna D*.",
    "Impedancja Z dla prądu przemiennego: R ± jX, moduł/kąt oraz równoważne przedstawienia R, L i C.",
    "Falownik fotowoltaiczny z trybem pracy sieciowej i wyspowej.",
    "Regionalne wprowadzanie i wyświetlanie liczb: separatory dziesiętne i tysięcy, regulowana precyzja i ustawienia początkowe. Wyświetlanie elektryczne domyślnie z czterema miejscami dziesiętnymi, bez zbędnych końcowych zer, automatycznymi lub wybieranymi przedrostkami i wprowadzaniem notacji naukowej, przedrostków SI oraz wartości RMS.",
    "Obciążenia nieliniowe: konfigurowalny mostek jednofazowy z przykładami LED i zasilaczy komputerowych bez PFC, mnożnik liczby urządzeń i trójfazowy prostownik sześciopulsowy na wejściu napędu (bez falownika i silnika).",
    "Cyfrowe układy TTL i CMOS: 45 numerowanych typów, w tym bramki, przerzutniki, liczniki, rejestry, kodery, multipleksery, pamięci i ALU; jawne piny zasilania w nowych modelach DIP.",
    "Informacje o układach w menu kontekstowym: zdefiniowane fizyczne wyprowadzenia, wewnętrzne bramki lub bloki, tablice działania i napięcia chwilowe; dwukrotne kliknięcie nadal edytuje parametry.",
    "Reorganizacja menu i podmenu",
    "Ulepszone i rozszerzone tłumaczenie na 22 języki"
  ],
  "csx": [
    "Vylepšení oproti CircuitJS1 5.0.5ts",
    "Rozšířený wattmetr: činný (P), jalový výkon základní harmonické (Q) a zdánlivý výkon (S), kosinus fázového posunu, skutečný účiník a volitelné režimy měření; THD napětí a proudu a nezákladní zbytek D*.",
    "Impedance Z pro střídavý proud: R ± jX, velikost/fázový úhel a ekvivalentní zobrazení R, L a C.",
    "Fotovoltaický střídač se síťovým a ostrovním režimem provozu.",
    "Regionální zadávání a zobrazení čísel: oddělovače desetinných míst a tisíců, nastavitelná přesnost a úvodní nastavení. Elektrické zobrazení standardně se čtyřmi desetinnými místy, bez zbytečných koncových nul, automatickými či volitelnými předponami a zadáváním vědeckého zápisu, předpon SI a hodnot RMS.",
    "Nelineární zátěže: nastavitelný jednofázový usměrňovací můstek s příklady LED a počítačových zdrojů bez PFC, násobičem počtu jednotek a třífázový šestipulzní usměrňovač pro vstup pohonů (bez střídače a motoru).",
    "Digitální obvody TTL a CMOS: 45 číslovaných typů, včetně hradel, klopných obvodů, čítačů, registrů, kodérů, multiplexorů, pamětí a ALU; explicitní napájecí vývody nových modelů DIP.",
    "Informace o obvodech v místní nabídce: definované fyzické vývody, vnitřní hradla nebo bloky, funkční tabulky a okamžitá napětí; dvojklik zachovává úpravu parametrů.",
    "Reorganizace nabídek a podnabídek",
    "Vylepšený a rozšířený překlad do 22 jazyků"
  ],
  "ru": [
    "Улучшения по сравнению с CircuitJS1 5.0.5ts",
    "Расширенный ваттметр: активная (P), реактивная по основной гармонике (Q) и полная (S) мощность, косинус фазового сдвига, действительный коэффициент мощности и выбираемые режимы измерения; THD напряжения и тока и неосновной остаток D*.",
    "Импеданс Z для переменного тока: R ± jX, модуль/фаза и эквивалентные представления R, L и C.",
    "Фотоэлектрический инвертор с сетевым и автономным режимами.",
    "Региональные форматы ввода и отображения чисел: десятичный разделитель и разделитель тысяч, настраиваемая точность и начальные параметры. Электрические величины по умолчанию с четырьмя десятичными знаками, без лишних конечных нулей, с автоматическими или выбираемыми приставками и вводом научной записи, приставок SI и значений RMS.",
    "Нелинейные нагрузки: настраиваемый однофазный диодный мост с примерами светодиодных устройств и компьютерных блоков питания без PFC, множителем числа устройств и трёхфазный шестипульсный выпрямитель для входа преобразователя частоты (без инвертора и двигателя).",
    "Цифровые микросхемы TTL и CMOS: 45 нумерованных типов, включая вентили, триггеры, счётчики, регистры, кодеры, мультиплексоры, память и ALU; явные выводы питания у новых моделей DIP.",
    "Информация о микросхемах в контекстном меню: заданная физическая цоколёвка, внутренние вентили или блоки, таблицы работы и мгновенные напряжения; двойной щелчок сохраняет редактирование параметров.",
    "Реорганизация меню и подменю",
    "Улучшенный и расширенный перевод на 22 языка"
  ],
  "zh": [
    "相对于 CircuitJS1 5.0.5ts 的改进",
    "扩展功率表：有功功率 (P)、基波无功功率 (Q)、视在功率 (S)、位移功率因数、真实功率因数及可选读数模式; 电压和电流 THD 及非基波剩余量 D*.",
    "交流阻抗 Z：R ± jX、幅值/相位角及等效 R、L、C 表示。",
    "新增光伏逆变器元件，支持并网及离网模式。",
    "区域化数字输入与显示：小数及千位分隔符、可调精度和初始设置。 电气量默认显示四位小数，省略无意义的末尾零，支持自动或手动单位前缀，以及科学计数法、SI 前缀和 RMS 数值输入。",
    "非线性负载：可配置单相整流桥，包含无 PFC 的 LED 与计算机电源示例、设备数量倍增功能，以及用于变频器输入级的三相六脉波整流器（不含逆变器和电动机）。",
    "TTL 和 CMOS 数字集成电路：45 个编号型号，包括逻辑门、触发器、计数器、寄存器、编码器、多路选择器、存储器和 ALU；新增 DIP 模型具有明确的电源引脚。",
    "通过右键菜单查看芯片信息：已定义的物理引脚、内部逻辑门或功能框图、功能表和瞬时电压；双击仍用于编辑参数。",
    "菜单和子菜单重新组织",
    "改进并扩展至 22 种语言的翻译"
  ],
  "zh-tw": [
    "相對於 CircuitJS1 5.0.5ts 的改進",
    "擴充功率表：有功功率 (P)、基波無功功率 (Q)、視在功率 (S)、位移功率因數、真實功率因數及可選讀值模式; 電壓和電流 THD 及非基波殘餘量 D*.",
    "交流阻抗 Z：R ± jX、大小／相位角及等效 R、L、C 表示。",
    "新增太陽能逆變器元件，支援併網及離網模式。",
    "區域化數字輸入與顯示：小數及千位分隔符、可調精度和初始設定。 電氣量預設顯示四位小數，省略無意義的末尾零，支援自動或手動單位前綴，以及科學記號、SI 前綴和 RMS 數值輸入。",
    "非線性負載：可設定單相整流橋，包含無 PFC 的 LED 與電腦電源範例、設備數量倍增功能，以及用於變頻器輸入級的三相六脈波整流器（不含逆變器和馬達）。",
    "TTL 和 CMOS 數位積體電路：45 個編號型號，包括邏輯閘、正反器、計數器、暫存器、編碼器、多工器、記憶體和 ALU；新增 DIP 模型具有明確的電源接腳。",
    "透過右鍵選單查看晶片資訊：已定義的實體接腳、內部邏輯閘或功能方塊圖、功能表和瞬時電壓；雙擊仍用於編輯參數。",
    "選單和子選單重新整理",
    "改進並擴充至 22 種語言的翻譯"
  ],
  "ja": [
    "CircuitJS1 5.0.5ts からの改良点",
    "拡張電力計：有効電力 (P)、基本波無効電力 (Q)、皮相電力 (S)、位相差の余弦、真の力率、選択可能な測定モード; 電圧・電流 THD と非基本波残差 D*.",
    "交流インピーダンス Z：R ± jX、絶対値／位相角、等価な R・L・C 表示。",
    "系統連系モードと独立運転モードを備えた太陽光発電インバーター素子。",
    "地域別の数値入力・表示：小数点と桁区切り、精度設定、起動時設定。 電気量は標準で小数点以下4桁とし、不要な末尾ゼロを省略。単位接頭辞の自動・手動選択、科学表記、SI 接頭辞、RMS 値の入力に対応。",
    "非線形負荷：PFCなしのLEDとパソコン電源の例を備えた設定可能な単相整流ブリッジ、台数倍率の設定、インバーター入力部向けの三相6パルス整流器（インバーター本体とモーターは含まない）。",
    "TTL・CMOS デジタル IC：論理ゲート、フリップフロップ、カウンタ、レジスタ、エンコーダ、マルチプレクサ、メモリ、ALU を含む番号付き45品種。新しい DIP モデルには電源端子を明示。",
    "コンテキストメニューの IC 情報：定義された物理ピン配置、内部ゲートや機能ブロック、動作表、瞬時電圧を表示。ダブルクリックによるパラメータ編集を維持。",
    "メニューとサブメニューの再編成",
    "翻訳を改善し22言語に拡充"
  ],
  "kr": [
    "CircuitJS1 5.0.5ts 대비 개선 사항",
    "확장 전력계: 유효전력 (P), 기본파 무효전력 (Q), 피상전력 (S), 위상차 코사인, 실제 역률 및 선택 가능한 측정 모드; 전압·전류 THD 및 비기본파 잔여량 D*.",
    "교류 임피던스 Z: R ± jX, 크기/위상각 및 등가 R·L·C 표시.",
    "계통 연계 및 독립 운전 모드를 지원하는 태양광 인버터 부품.",
    "지역별 숫자 입력 및 표시: 소수점과 천 단위 구분 기호, 정밀도 설정 및 시작 환경설정. 전기량을 기본 소수점 네 자리로 표시하고 불필요한 끝자리 0을 생략합니다. 자동 또는 선택 단위 접두어와 과학 표기법, SI 접두어, RMS 값 입력을 지원합니다.",
    "비선형 부하: PFC 없는 LED 및 컴퓨터 전원공급장치 예제를 갖춘 단상 브리지 정류기, 기기 수 배율 설정, 주파수 변환기 입력단용 3상 6펄스 정류기(인버터 및 모터 제외).",
    "TTL 및 CMOS 디지털 IC: 게이트, 플립플롭, 카운터, 레지스터, 인코더, 멀티플렉서, 메모리 및 ALU를 포함한 번호형 45종. 새 DIP 모델에 전원 핀을 명시합니다.",
    "상황별 메뉴의 IC 정보: 정의된 실제 핀 배치, 내부 게이트 또는 기능 블록, 동작표와 순간 전압을 표시하며 더블 클릭 매개변수 편집을 유지합니다.",
    "메뉴 및 하위 메뉴 재구성",
    "22개 언어로 개선 및 확장된 번역"
  ]
};
  const strings=improvements[lang]||improvements.en;
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
