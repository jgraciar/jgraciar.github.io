// Nuevas cadenas exclusivas del rectificador trifásico de seis pulsos.
// El resto de textos (R, C, Rs, número de unidades) están compartidos con
// FilteredBridgeElm; no se duplican en este catálogo.
export const sixPulseKeys=[
 "Carga no lineal: rectificador trifásico de 6 pulsos",
 "Rectificador trifásico de seis pulsos con filtro C",
 "Modelo de entrada: no incluye inversor ni motor"
] as const;
export const sixPulseTranslations:Record<string,readonly string[]>={
 en:["Nonlinear load: three-phase six-pulse rectifier","Three-phase six-pulse rectifier with capacitor filter","Input-stage model: does not include the inverter or motor"],
 es:["Carga no lineal: rectificador trifásico de 6 pulsos","Rectificador trifásico de seis pulsos con filtro C","Modelo de entrada: no incluye inversor ni motor"],
 "ca-es-valencia":["Càrrega no lineal: rectificador trifàsic de 6 polsos","Rectificador trifàsic de sis polsos amb filtre C","Model de l'etapa d'entrada: no inclou l'inversor ni el motor"],
 ca:["Càrrega no lineal: rectificador trifàsic de 6 polsos","Rectificador trifàsic de sis polsos amb filtre C","Model de l'etapa d'entrada: no inclou l'inversor ni el motor"],
 gl:["Carga non lineal: rectificador trifásico de 6 pulsos","Rectificador trifásico de seis pulsos con filtro C","Modelo da etapa de entrada: non inclúe o inversor nin o motor"],
 eu:["Karga ez-lineala: sei pultsuko zuzentzaile trifasikoa","Sei pultsuko zuzentzaile trifasikoa C iragazkiarekin","Sarrerako etaparen eredua: ez du inbertsorerik edo motorrik"],
 de:["Nichtlineare Last: dreiphasiger Sechspuls-Gleichrichter","Dreiphasiger Sechspuls-Gleichrichter mit C-Filter","Modell der Eingangsstufe: ohne Wechselrichter und Motor"],
 fr:["Charge non linéaire : redresseur triphasé à six impulsions","Redresseur triphasé à six impulsions avec filtre C","Modèle de l'étage d'entrée : sans onduleur ni moteur"],
 it:["Carico non lineare: raddrizzatore trifase a sei impulsi","Raddrizzatore trifase a sei impulsi con filtro C","Modello dello stadio d'ingresso: non include inverter o motore"],
 pt:["Carga não linear: retificador trifásico de seis pulsos","Retificador trifásico de seis pulsos com filtro C","Modelo da etapa de entrada: não inclui inversor nem motor"],
 nl:["Niet-lineaire last: driefasenbrug met zes pulsen","Driefasenbrug met zes pulsen en C-filter","Model van de ingangstrap: zonder omvormer of motor"],
 sv:["Icke-linjär last: trefasig sexpuls-likriktare","Trefasig sexpuls-likriktare med C-filter","Modell för ingångssteget: omfattar inte växelriktare eller motor"],
 da:["Ikke-lineær belastning: trefaset sekspuls-ensretter","Trefaset sekspuls-ensretter med C-filter","Model af indgangstrinnet: uden inverter eller motor"],
 nb:["Ikke-lineær last: trefaset sekspuls-likeretter","Trefaset sekspuls-likeretter med C-filter","Modell for inngangstrinnet: uten vekselretter eller motor"],
 fi:["Epälineaarinen kuorma: kolmivaiheinen kuusipulssitasasuuntaaja","Kolmivaiheinen kuusipulssitasasuuntaaja C-suodattimella","Tulovaiheen malli: ei sisällä vaihtosuuntaajaa tai moottoria"],
 pl:["Obciążenie nieliniowe: trójfazowy prostownik sześciopulsowy","Trójfazowy prostownik sześciopulsowy z filtrem C","Model stopnia wejściowego: bez falownika i silnika"],
 csx:["Nelineární zátěž: třífázový šestipulzní usměrňovač","Třífázový šestipulzní usměrňovač s filtrem C","Model vstupního stupně: bez střídače a motoru"],
 ru:["Нелинейная нагрузка: трёхфазный шестипульсный выпрямитель","Трёхфазный шестипульсный выпрямитель с C-фильтром","Модель входного каскада: без инвертора и двигателя"],
 zh:["非线性负载：三相六脉波整流器","带 C 滤波的三相六脉波整流器","输入级模型：不包含逆变器或电动机"],
 "zh-tw":["非線性負載：三相六脈波整流器","附 C 濾波的三相六脈波整流器","輸入級模型：不包含逆變器或馬達"],
 ja:["非線形負荷：三相6パルス整流器","Cフィルター付き三相6パルス整流器","入力段のモデル：インバーターとモーターは含みません"],
 kr:["비선형 부하: 3상 6펄스 정류기","C 필터가 있는 3상 6펄스 정류기","입력단 모델: 인버터와 모터는 포함하지 않습니다"]
};
