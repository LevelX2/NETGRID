# V1.9.22 Data Fort Reclamation Runtime Contract

Stand: 2026-05-14 17:52 CEST
Status: implemented WIP contract, no catalog/AI/release promotion

## Zweck

Dieser Vertrag beschreibt den naechsten engen, nicht-promotenden Runtime-Schnitt fuer `Data Fort Reclamation` (`onr_v1_197_data-fort-reclamation`). Er ersetzt keine Release-Promotion und fuehrt keine AI- oder Webclient-Freigabe ein.

## Lokale Fakten

- Agenda: Advancement 4, Agenda Points 2, Gray Ops.
- On score: Die Korp erhaelt 10 temporaere Credits fuer diesen Effekt.
- Die Korp waehlt bis zu 4 Karten aus HQ.
- Der Effekt erstellt ein neues Data Fort.
- Die gewaehlten Karten werden nacheinander installiert; ICE wird auf das neue Fort installiert, Root-Karten werden in die Root installiert.
- Die Korp darf beim Installieren/Rezzing zusaetzlich eigene Credits aus dem Creditpool verwenden.
- Der Effekt erzeugt keine zusaetzlichen Aktionen.
- Ungenutzte temporaere Credits werden nach der Sequenz verworfen.

## WIP-Sequenz

1. Beim Scoren wird die Agenda normal in die Score Area gelegt.
2. Wenn HQ installierbare Karten enthaelt, oeffnet die Engine eine Korp-private `select_cards`-Choice.
3. Die Choice erlaubt 0 bis 4 HQ-Karten, beschraenkt auf installierbare Korp-Karten.
4. Beim Resolve wird genau ein neues Remote erstellt.
5. Die ausgewaehlten Karten werden in stabiler Choice-Reihenfolge verarbeitet.
6. ICE wird als Server-ICE am neuen Remote installiert; Asset, Agenda und Upgrade werden in die Root installiert.
7. Installkosten werden aus einem temporaeren Effektpool von 10 Credits und danach aus Korp-Credits bezahlt.
8. Nach der Install-Sequenz oeffnet die Engine bei rezbaren neu installierten Karten eine zweite Korp-private `select_cards`-Choice.
9. Beim Rez-Resolve werden Rez-Kosten zuerst aus dem temporaeren 10-Credit-Pool und danach aus Korp-Credits bezahlt.
10. PublicPayload nennt nur Counts, Server-ID, verbrauchte temporaere Credits, verbrauchte Korp-Credits und installierte Public-Card-Definitionen soweit durch Installation public sichtbar. HQ-Auswahl und Rez-Auswahl bleiben nicht im PublicPayload.
11. Replay/StateHash muss stabil sein; keine verdeckten HQ-Listen, Karteninstanz-Maps oder nicht ausgewaehlten HQ-Karten duerfen leaken.

## LegalAction und ApplyAction

- `score_agenda` bleibt der ausloesende LegalAction-Pfad.
- `resolve_choice` validiert Choice-ID, Side, StateVersion, min/max und Option-IDs erneut.
- Beim Resolve wird erneut validiert:
  - Quelle ist `Data Fort Reclamation` in der Corp Score Area.
  - Ausgewaehlte Karten liegen noch in HQ.
  - Jede Karte ist fuer Korp installierbar.
  - Kosten sind mit temporaerem Pool plus Korp-Credits zahlbar.
  - Es ist keine andere Choice offen.

## Testpflicht

- Score oeffnet private Korp-Choice mit bis zu 4 HQ-Optionen.
- Wrong-Side und Stale-State fuer `score_agenda` und `resolve_choice`.
- Choice installiert ICE und Root-Karte in ein neues Remote.
- Temporaerer Creditpool bezahlt zuerst, Korp-Credits danach.
- PublicPayload enthaelt keine HQ-Liste und keine nicht gewaehlten Karten.
- Rez-Choice oeffnet Korp-privat fuer neu installierte rezbare Karten.
- Temporaerer Creditpool bezahlt Rez-Kosten zuerst, Korp-Credits danach.
- Replay/StateHash stabil.
- Keine Catalog-, AI-, Webclient- oder Release-Promotion.

## Nicht Teil dieses WIP

- Zielserver-Auswahl durch Spieler.
- AI-Hints oder AI-Smokes.
- Finale Completion-Gate-Promotion.
