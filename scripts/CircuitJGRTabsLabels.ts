// SPDX-License-Identifier: GPL-3.0-or-later
const keys=['open','select','close','new','hide','show','saveTitle','question','loss','save','discard','cancel'];
export const workspaceTranslations:Record<string,string>={
 en:'Open circuits|Select {name}|Close {name}|New blank circuit|Hide side panel|Show side panel|Save changes|Do you want to save the changes to “{name}”?|If you do not save, your changes will be lost.|Save|Don’t save|Cancel',
 es:'Circuitos abiertos|Seleccionar {name}|Cerrar {name}|Nuevo circuito en blanco|Ocultar panel lateral|Mostrar panel lateral|Guardar cambios|¿Quieres guardar los cambios realizados en «{name}»?|Si no guardas los cambios, se perderán.|Guardar|No guardar|Cancelar',
 ca:'Circuits oberts|Selecciona {name}|Tanca {name}|Circuit nou en blanc|Amaga el panell lateral|Mostra el panell lateral|Desa els canvis|Vols desar els canvis de «{name}»?|Si no deses els canvis, es perdran.|Desa|No desis|Cancel·la',
 'ca-es-valencia':'Circuits oberts|Selecciona {name}|Tanca {name}|Circuit nou en blanc|Amaga el panell lateral|Mostra el panell lateral|Guarda els canvis|Vols guardar els canvis de «{name}»?|Si no guardes els canvis, es perdran.|Guarda|No guardes|Cancel·la',
 gl:'Circuítos abertos|Seleccionar {name}|Pechar {name}|Novo circuíto en branco|Ocultar panel lateral|Mostrar panel lateral|Gardar cambios|Queres gardar os cambios de «{name}»?|Se non gardas os cambios, perderanse.|Gardar|Non gardar|Cancelar',
 eu:'Zirkuitu irekiak|Hautatu {name}|Itxi {name}|Zirkuitu huts berria|Ezkutatu alboko panela|Erakutsi alboko panela|Gorde aldaketak|«{name}» fitxategiko aldaketak gorde nahi dituzu?|Gordetzen ez badituzu, aldaketak galduko dira.|Gorde|Ez gorde|Utzi',
 fr:'Circuits ouverts|Sélectionner {name}|Fermer {name}|Nouveau circuit vide|Masquer le panneau latéral|Afficher le panneau latéral|Enregistrer les modifications|Voulez-vous enregistrer les modifications de « {name} » ?|Sans enregistrement, vos modifications seront perdues.|Enregistrer|Ne pas enregistrer|Annuler',
 de:'Geöffnete Schaltungen|{name} auswählen|{name} schließen|Neue leere Schaltung|Seitenleiste ausblenden|Seitenleiste einblenden|Änderungen speichern|Möchten Sie die Änderungen an „{name}“ speichern?|Ohne Speichern gehen Ihre Änderungen verloren.|Speichern|Nicht speichern|Abbrechen',
 it:'Circuiti aperti|Seleziona {name}|Chiudi {name}|Nuovo circuito vuoto|Nascondi pannello laterale|Mostra pannello laterale|Salva modifiche|Vuoi salvare le modifiche a «{name}»?|Se non salvi, le modifiche andranno perse.|Salva|Non salvare|Annulla',
 pt:'Circuitos abertos|Selecionar {name}|Fechar {name}|Novo circuito em branco|Ocultar painel lateral|Mostrar painel lateral|Guardar alterações|Quer guardar as alterações de «{name}»?|Se não guardar, as alterações serão perdidas.|Guardar|Não guardar|Cancelar',
 nl:'Geopende schakelingen|{name} selecteren|{name} sluiten|Nieuwe lege schakeling|Zijpaneel verbergen|Zijpaneel tonen|Wijzigingen opslaan|Wilt u de wijzigingen in “{name}” opslaan?|Als u niet opslaat, gaan uw wijzigingen verloren.|Opslaan|Niet opslaan|Annuleren',
 sv:'Öppna kretsar|Välj {name}|Stäng {name}|Ny tom krets|Dölj sidopanel|Visa sidopanel|Spara ändringar|Vill du spara ändringarna i ”{name}”?|Om du inte sparar går ändringarna förlorade.|Spara|Spara inte|Avbryt',
 da:'Åbne kredsløb|Vælg {name}|Luk {name}|Nyt tomt kredsløb|Skjul sidepanel|Vis sidepanel|Gem ændringer|Vil du gemme ændringerne i ”{name}”?|Hvis du ikke gemmer, går ændringerne tabt.|Gem|Gem ikke|Annuller',
 nb:'Åpne kretser|Velg {name}|Lukk {name}|Ny tom krets|Skjul sidepanel|Vis sidepanel|Lagre endringer|Vil du lagre endringene i «{name}»?|Hvis du ikke lagrer, går endringene tapt.|Lagre|Ikke lagre|Avbryt',
 fi:'Avoimet piirit|Valitse {name}|Sulje {name}|Uusi tyhjä piiri|Piilota sivupaneeli|Näytä sivupaneeli|Tallenna muutokset|Haluatko tallentaa tiedoston ”{name}” muutokset?|Jos et tallenna, muutokset menetetään.|Tallenna|Älä tallenna|Peruuta',
 pl:'Otwarte obwody|Wybierz {name}|Zamknij {name}|Nowy pusty obwód|Ukryj panel boczny|Pokaż panel boczny|Zapisz zmiany|Czy zapisać zmiany w „{name}”?|Jeśli nie zapiszesz, zmiany zostaną utracone.|Zapisz|Nie zapisuj|Anuluj',
 csx:'Otevřené obvody|Vybrat {name}|Zavřít {name}|Nový prázdný obvod|Skrýt postranní panel|Zobrazit postranní panel|Uložit změny|Chcete uložit změny v „{name}“?|Pokud je neuložíte, změny budou ztraceny.|Uložit|Neukládat|Zrušit',
 ru:'Открытые схемы|Выбрать {name}|Закрыть {name}|Новая пустая схема|Скрыть боковую панель|Показать боковую панель|Сохранить изменения|Сохранить изменения в «{name}»?|Если не сохранить, изменения будут потеряны.|Сохранить|Не сохранять|Отмена',
 zh:'已打开的电路|选择 {name}|关闭 {name}|新建空白电路|隐藏侧边栏|显示侧边栏|保存更改|是否保存“{name}”的更改？|如果不保存，更改将丢失。|保存|不保存|取消',
 'zh-tw':'已開啟的電路|選擇 {name}|關閉 {name}|新增空白電路|隱藏側邊欄|顯示側邊欄|儲存變更|是否儲存「{name}」的變更？|若不儲存，變更將遺失。|儲存|不儲存|取消',
 ja:'開いている回路|{name} を選択|{name} を閉じる|新しい空の回路|サイドパネルを隠す|サイドパネルを表示|変更を保存|「{name}」の変更を保存しますか？|保存しない場合、変更は失われます。|保存|保存しない|キャンセル',
 kr:'열린 회로|{name} 선택|{name} 닫기|새 빈 회로|사이드 패널 숨기기|사이드 패널 표시|변경 사항 저장|“{name}”의 변경 사항을 저장하시겠습니까?|저장하지 않으면 변경 사항이 손실됩니다.|저장|저장 안 함|취소'
};
export function workspaceLabel(key:string,language:string):string {
 const index=keys.indexOf(key);if(index<0)return key;
 return (workspaceTranslations[language]||workspaceTranslations.en).split('|')[index];
}
