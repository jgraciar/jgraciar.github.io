// Preflight only: never constructs or deletes elements, models or solver state.
export type CircuitImportIssue={kind:'xml'}|{kind:'component';name:string};
export function circuitImportIssue(text:string,xmlTypes:ReadonlyMap<string,string>,dumpTypes:ReadonlyMap<number,string>):CircuitImportIssue|null{
 const input=text.replace(/^\uFEFF/,'').trimStart();
 if(input.startsWith('<')){
  const doc=new DOMParser().parseFromString(input,'text/xml');
  if(doc.querySelector('parsererror')||doc.documentElement?.tagName!=='cir')return {kind:'xml'};
  const metadata=new Set(['o','dm','rlm','tm','mm','clm','ccm','h','adj','test','switchevent','scopedata']);
  for(const node of Array.from(doc.documentElement.children)){
   if(!metadata.has(node.tagName)&&!xmlTypes.has(node.tagName))return {kind:'component',name:node.tagName};
  }
  return null;
 }
 const metadata=new Set([...'oh$!%?B'].map(c=>c.charCodeAt(0)).concat([34,32,38,46]));
 for(const line of input.split(/\r\n|\r|\n/)){
  const token=line.trim().split(/\s+/)[0];if(!token)continue;
  const code=/^\d+$/.test(token)?Number(token):token.charCodeAt(0);
  if(!metadata.has(code)&&!dumpTypes.has(code))return {kind:'component',name:token};
 }
 return null;
}
const messages:Record<string,[string,string,string]>={
 en:['Unsupported circuit component','Invalid XML circuit','The current circuit has not been changed.'],
 es:['Componente de circuito no compatible','Circuito XML no válido','El circuito abierto no se ha modificado.'],
 ca:['Component de circuit no compatible','Circuit XML no vàlid','El circuit obert no s’ha modificat.'],
 'ca-es-valencia':['Component de circuit no compatible','Circuit XML no vàlid','El circuit obert no s’ha modificat.'],
 gl:['Compoñente de circuíto non compatible','Circuíto XML non válido','O circuíto aberto non se modificou.'],
 eu:['Zirkuituko osagaia ez da bateragarria','XML zirkuitua ez da baliozkoa','Irekitako zirkuitua ez da aldatu.'],
 fr:['Composant de circuit non pris en charge','Circuit XML non valide','Le circuit ouvert n’a pas été modifié.'],
 de:['Nicht unterstütztes Bauteil','Ungültige XML-Schaltung','Die geöffnete Schaltung wurde nicht verändert.'],
 it:['Componente del circuito non supportato','Circuito XML non valido','Il circuito aperto non è stato modificato.'],
 pt:['Componente de circuito não suportado','Circuito XML inválido','O circuito aberto não foi alterado.'],
 nl:['Niet-ondersteund circuitonderdeel','Ongeldig XML-circuit','Het geopende circuit is niet gewijzigd.'],
 sv:['Kretskomponent som inte stöds','Ogiltig XML-krets','Den öppna kretsen har inte ändrats.'],
 da:['Kredskomponent understøttes ikke','Ugyldigt XML-kredsløb','Det åbne kredsløb er ikke blevet ændret.'],
 nb:['Kretskomponent støttes ikke','Ugyldig XML-krets','Den åpne kretsen er ikke endret.'],
 fi:['Piirikomponenttia ei tueta','Virheellinen XML-piiri','Avointa piiriä ei ole muutettu.'],
 pl:['Nieobsługiwany element obwodu','Nieprawidłowy obwód XML','Otwarty obwód nie został zmieniony.'],
 csx:['Nepodporovaná součástka obvodu','Neplatný obvod XML','Otevřený obvod nebyl změněn.'],
 ru:['Неподдерживаемый компонент схемы','Некорректная схема XML','Открытая схема не изменена.'],
 zh:['不支持的电路元件','无效的 XML 电路','当前电路未被更改。'],
 'zh-tw':['不支援的電路元件','無效的 XML 電路','目前電路未變更。'],
 ja:['未対応の回路部品','無効な XML 回路','開いている回路は変更されていません。'],
 kr:['지원하지 않는 회로 부품','잘못된 XML 회로','열려 있는 회로는 변경되지 않았습니다.']
};
export function circuitImportMessage(issue:CircuitImportIssue,language:string):string{
 const m=messages[language]||messages.en;
 return (issue.kind==='xml'?m[1]:m[0]+': '+issue.name)+'\n'+m[2];
}
