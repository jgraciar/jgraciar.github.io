// SPDX-License-Identifier: GPL-3.0-or-later
const rows:Record<string,string>={
 en:'7-segment display|Digital, no common terminal|Common cathode|Common anode',
 es:'Display de 7 segmentos|Digital, sin terminal común|Cátodo común|Ánodo común',
 ca:'Display de 7 segments|Digital, sense terminal comú|Càtode comú|Ànode comú',
 'ca-es-valencia':'Display de 7 segments|Digital, sense terminal comú|Càtode comú|Ànode comú',
 gl:'Display de 7 segmentos|Dixital, sen terminal común|Cátodo común|Ánodo común',
 eu:'7 segmentuko pantaila|Digitala, terminal komunik gabe|Katodo komuna|Anodo komuna',
 fr:'Afficheur à 7 segments|Numérique, sans borne commune|Cathode commune|Anode commune',
 de:'7-Segment-Anzeige|Digital, ohne gemeinsamen Anschluss|Gemeinsame Kathode|Gemeinsame Anode',
 it:'Display a 7 segmenti|Digitale, senza terminale comune|Catodo comune|Anodo comune',
 pt:'Display de 7 segmentos|Digital, sem terminal comum|Cátodo comum|Ânodo comum',
 nl:'7-segmentdisplay|Digitaal, zonder gemeenschappelijke aansluiting|Gemeenschappelijke kathode|Gemeenschappelijke anode',
 sv:'7-segmentsdisplay|Digital, utan gemensam anslutning|Gemensam katod|Gemensam anod',
 da:'7-segmentdisplay|Digital, uden fælles terminal|Fælles katode|Fælles anode',
 nb:'7-segmentsdisplay|Digital, uten felles terminal|Felles katode|Felles anode',
 fi:'7-segmenttinäyttö|Digitaalinen, ei yhteistä liitintä|Yhteinen katodi|Yhteinen anodi',
 pl:'Wyświetlacz 7-segmentowy|Cyfrowy, bez wspólnego wyprowadzenia|Wspólna katoda|Wspólna anoda',
 csx:'7segmentový displej|Digitální, bez společného vývodu|Společná katoda|Společná anoda',
 ru:'7-сегментный индикатор|Цифровой, без общего вывода|Общий катод|Общий анод',
 zh:'七段显示器|数字，无公共端|共阴极|共阳极',
 'zh-tw':'七段顯示器|數位，無公共端|共陰極|共陽極',
 ja:'7セグメント表示器|デジタル、共通端子なし|カソードコモン|アノードコモン',
 kr:'7세그먼트 디스플레이|디지털, 공통 단자 없음|공통 캐소드|공통 애노드'
};
export function sevenSegMenuLabel(key:string,language:string):string|undefined {
 const keys=['Add 7 Segment LED','Add 7 Segment LED (common cathode)','Add 7 Segment LED (common anode)'];
 const index=keys.indexOf(key);
 if(index<0)return undefined;
 const labels=(rows[language]||rows.en).split('|');
 return `${labels[0]} (${labels[index+1]})`;
}
