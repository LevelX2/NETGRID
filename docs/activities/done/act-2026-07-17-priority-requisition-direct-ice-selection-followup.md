---
activityId: act-2026-07-17-priority-requisition-direct-ice-selection-followup
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt: 2026-07-17
completedAt: 2026-07-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/features/actions/ChoicePanels.tsx
  - apps/web/app/priority-requisition-field-choice.test.ts
checks:
  - Fokussierte Webtests: 1 Datei, 4 Tests grün
  - Vollständige Webtests: 48 Dateien, 611 Tests grün
  - Web-Typecheck grün
  - git diff --check grün
---

# Priority Requisition: ICE direkt im Fort auswählen

## Ziel

Beim Scoren von `Priority Requisition` soll die Korp das kostenlos zu rezzende ICE direkt an seiner tatsächlichen Position im Fort auswählen können. Das Actionboard führt die Auswahl mit Zähler, Bestätigung und Überspringen, ohne dass ein großes Kartenwahlfenster den Board-Kontext verdeckt.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-17: Die aktuelle Kartenwahl zeigt zwar Bilder der wählbaren ICE, verdeckt aber als Vordergrundfenster die Forts. Dadurch ist nicht ausreichend erkennbar, in welchem Fort und an welcher Position – erstes, zweites, drittes ICE – ein Ziel liegt und wie die Verteidigung dieses Forts insgesamt aussieht.
- Gewünschtes Bedienmuster: Auswahlknopf direkt unter dem jeweiligen ICE; im Actionboard ein Fortschritt wie `0/1`, danach eine eindeutige Bestätigung wie `OK` oder `Auswahl übernehmen`.
- Regeltext und aktuelle Engine-Umsetzung: `Priority Requisition` darf beim Scoren genau ein installiertes, noch nicht gerezztes ICE kostenlos rezzen oder den optionalen Effekt überspringen. Es wird kein neues ICE installiert.
- Follow-up zu den abgeschlossenen Activities:
  - `docs/activities/done/act-2026-05-21-generic-field-card-choice-ui.md` sollte unter anderem `Priority Requisition` in den generischen Feldkartenmodus aufnehmen.
  - `docs/activities/done/act-2026-05-22-priority-requisition-optional-free-rez.md` implementierte die ICE-Zielwahl samt expliziter Option `Überspringen`.
- Verifizierter aktueller UI-Blindfleck:
  - `packages/engine/src/game/corp/scored-agenda/scored-agenda-free-rez-sequence.ts` liefert eine `select_cards`-Choice aus ICE-Kartenoptionen plus der Nicht-Karten-Option `skip`.
  - `shouldUseFieldCardChoice` in `apps/web/app/action-board-ui.ts` verlangt derzeit, dass jede auswählbare Option auf eine sichtbare Feldkarte gemappt werden kann. Weil `skip` keine Feldkarte ist, fällt die gesamte Choice auf das große `CardChoicePanel` zurück.

## Scope

- Den Feldkartenmodus so eng erweitern, dass eine `select_cards`-Choice aus vollständig auf sichtbare Feldkarten abbildbaren Zieloptionen plus einer ausdrücklich darstellbaren Nicht-Karten-Option wie `Überspringen` weiterhin als Feldkartenwahl laufen kann.
- Für `Priority Requisition` alle legalen ICE-Zieloptionen ausschließlich aus der Engine-Choice auf die bereits sichtbaren ICE an ihren tatsächlichen Positionen in HQ, R&D, Archives oder einem Remote-Fort abbilden.
- Direkt am jeweiligen ICE einen klaren Auswahlknopf beziehungsweise Auswahlmarker anzeigen. Ein Klick setzt oder wechselt nur die lokale Einzelauswahl; gerezzt wird erst nach Bestätigung.
- Im Actionboard den Prompt, einen Zielzähler `0/1` beziehungsweise `1/1`, eine eindeutige Bestätigung und die vorhandene Option `Überspringen` anbieten.
- Beim Bestätigen unverändert die ausgewählte ICE-Option per bestehender `resolve_choice`-Action senden. Beim Überspringen unverändert ausschließlich die Engine-Option `skip` senden.
- Vergleichbare Feldkarten-Choices mit zusätzlichen Nicht-Karten-Optionen kurz auf denselben Blindfleck prüfen. Nur wenn dieselbe sichere generische Trennung ohne Mehrscope greift, den Helper allgemein halten; sonst kleine Folge-Activities anlegen.

## Nicht im Scope

- Keine Änderung am Kartentext, Score-Timing, optionalen Charakter oder kostenlosen Rez-Effekt von `Priority Requisition`.
- Keine Engine-Änderung an `pendingChoice`, `LegalActions`, `resolve_choice`, Zielvalidierung, Replay oder StateHash.
- Keine automatische Zielauswahl und kein sofortiges Rezzen beim Klick auf das ICE.
- Kein Redesign aller Kartenwahl-, Such-, Reorder- oder Hidden-Zone-Fenster.
- Keine pauschale Einstufung beliebiger nicht auf Karten abbildbarer Optionen als sichere Nebenaktion; der bisherige Fallback bleibt für unbekannte oder gemischte Choice-Strukturen erhalten.
- Keine Offenlegung verdeckter ICE-Definitionen, Kartentitel oder anderer Hidden-Info gegenüber dem Runner.

## Akzeptanzkriterien

- [x] Beim Scoren von `Priority Requisition` mit mindestens einem legalen ICE-Ziel erscheint kein großes Kartenwahlfenster über dem Board.
- [x] Jedes laut `pendingChoice.options` legale ICE ist genau an seiner tatsächlichen Fort- und Reihenposition direkt auswählbar; nicht legale ICE erhalten keinen Auswahlknopf.
- [x] Das Actionboard zeigt vor der Wahl `0/1`, nach der Wahl `1/1` und eine eindeutige Bestätigung; vor dieser Bestätigung wird kein ICE gerezzt.
- [x] Bei maximal einer Auswahl wechselt ein Klick auf ein anderes legales ICE die lokale Markierung nachvollziehbar; Abwahl beziehungsweise Korrektur vor Bestätigung ist möglich.
- [x] `Überspringen` bleibt als getrennte Actionboard-Aktion erreichbar, zählt nicht als ausgewähltes ICE und löst ausschließlich die bestehende `skip`-Option auf.
- [x] Bestätigen sendet genau die Engine-Option des ausgewählten ICE; normale Revalidierung von Choice-ID, StateVersion, Ziel und Rezzed-Zustand bleibt wirksam.
- [x] Unbekannte gemischte `select_cards`-Choices sowie Hand-, Stack-, R&D-, HQ-, Archives-, Heap- und Reorder-Choices behalten ihren sicheren bisherigen Darstellungsweg.
- [x] Die Runner-Ansicht erhält durch Auswahlmarker, Labels, Payloads, Reconnect, Chronik oder Logs keine zusätzlichen Informationen über verdeckte ICE.
- [x] Fokussierte Webtests decken `Priority Requisition` mit mindestens zwei ICE in unterschiedlichen Forts, die `skip`-Nebenoption, Zähler/Bestätigung und den sicheren Fallback ab; Web-Typecheck und `git diff --check` sind grün.

## Umsetzungshinweise

- Wahrscheinliche Einstiegspunkte sind `shouldUseFieldCardChoice`, `fieldCardChoiceOptionsForCard`, `fieldCardChoiceInfo` und die Actionboard-Choice-Darstellung in `apps/web/app/action-board-ui.ts` beziehungsweise `apps/web/app/page.tsx`.
- Kartenoptionen und zusätzliche Nicht-Karten-Optionen explizit trennen. Nur Optionen, deren `value` oder kanonische Karten-ID auf eine sichtbare Feldkarte zeigt, dürfen Auswahlmarker am Board erzeugen.
- Die Engine modelliert die Optionalität derzeit absichtlich über `minSelections: 1`, `maxSelections: 1` und die Option `skip`. Der UI-Zähler soll dennoch die ICE-Zielwahl als `0/1` darstellen; `skip` ist eine alternative Auflösung, kein ausgewähltes ICE.
- Das abgeschlossene generische Feldkartenpaket nicht nachträglich ändern; dieses Paket ist dessen gezieltes Regressions-Follow-up.

## Ergebnisnotiz

`Priority Requisition` nutzt nun trotz der zusätzlichen Engine-Option `skip` den vorhandenen Feldkartenmodus: legale ICE bleiben an ihrer Fortposition auswählbar, der Zähler berücksichtigt nur ICE, und `Überspringen` löst als getrennte Actionboard-Aktion ausschließlich die bestehende `skip`-Option auf. Die Ausnahme ist eng auf diese Choice-Quelle und das kanonische Skip-Label begrenzt; unbekannte Misch-Choices behalten den bisherigen sicheren Fallback. Eine Suche nach weiteren `select_cards`-Choices mit `skip` ergab keine vergleichbare aktuelle Choice.
