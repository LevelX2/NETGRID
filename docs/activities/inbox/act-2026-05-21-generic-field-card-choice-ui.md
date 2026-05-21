---
activityId: act-2026-05-21-generic-field-card-choice-ui
status: inbox
kind: architecture
area: web
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Generische Feldkarten-Auswahl im Spielfeld

## Ziel

`select_cards`-Choices, deren Optionen auf aktuell gerenderte Feldkarten zeigen, sollen nicht mehr als großes Kartenwahl-Fenster über dem Board erscheinen. Stattdessen soll der Webclient einen generischen Feldkarten-Auswahlmodus nutzen: Zähler und Bestätigung im Actionboard, Auswahlmarker direkt auf den betroffenen Karten.

## Kontext und Quellen

- Nutzerfund vom 2026-05-21 nach Playtest mit `Hunt Club BBS`: Das aktuelle modale Kartenwahl-Fenster überdeckt das Board und macht es schwer, die installierten Korp-Karten im räumlichen Kontext zu wählen.
- Gewünschtes Muster: ähnlich wie die bestehende Discard-Auswahl bei Handlimit, mit Auswahlstatus im Actionboard und direkter Auswahl an den Karten.
- Bestehende technische Anker:
  - `apps/web/app/page.tsx`: `DiscardChoicePanel`, `discardShortcut`, `CardChoicePanel`, `CardView`.
  - `apps/web/app/action-board-ui.ts`: `shouldUseCardChoicePanel`.
  - `packages/engine/src/index.ts`: `pendingChoice.kind === "select_cards"` und `resolve_choice` mit `selectedChoices.selectedOptionIds`.
- Die Rules Engine bleibt alleinige Regelautorität. Die UI darf Legalität nicht aus Board-Heuristiken ableiten, sondern nur aus `pendingChoice.options`.

## Scope

- Einen generischen Webclient-Erkennungspfad für Feldkarten-Choices definieren:
  - `pendingChoice.kind === "select_cards"`,
  - Choice-Optionen haben `option.value` als Karten-`instanceId`,
  - diese Karten sind im aktuellen PlayerView als Feldkarten gerendert.
- Feldkarten-Choices im Actionboard als kompakten Auswahlzustand darstellen:
  - Prompt,
  - Auswahlzähler wie `0/3`,
  - `Auswahl übernehmen`,
  - optional `Auswahl leeren`.
- Auf betroffenen Karten einen kleinen Auswahlknopf oder Marker rendern.
- Klick auf Karte oder Marker toggelt die lokale Auswahl, ohne die Choice sofort aufzulösen.
- Beim Bestätigen unverändert die bestehende `resolve_choice`-Action mit `selectedChoices.choiceId` und `selectedOptionIds` senden.
- Mindestens folgende Choice-Familien als Kandidaten prüfen und, soweit sie Feldkarten sind, über das generische Modell bedienen:
  - `Hunt Club BBS`: installierte Korp-Karten auswählen.
  - `Forged Activation Orders`: unrezzed ICE wählen.
  - `Security Code WORM Chip`: unrezzed ICE wählen.
  - `Anonymous Tip`: gerezztes Black ICE wählen.
  - `Core Command: Jettison Ice`: gerezztes ICE wählen.
  - `Priority Requisition`: installiertes ICE zum kostenlosen Rezzen wählen.
  - `Ice Transmutation`: gerezztes ICE wählen.
  - `Pattel's Virus`: ICE für Pattel-Counter wählen.
  - `Power Grid Overload`: installierte Runner-Hardware wählen.
  - `Viral 15`: installiertes Runner-Programm wählen.
  - `Self-Modifying Code` bei MU-Mangel: installierte Programme zum Freimachen wählen.
  - `Chimera`: Daemon wählen.
  - `Misc. For Sale`: installierte Runner-Karten wählen.
  - generische Runner-Hosting-Choice: installiertes Programm wählen.
  - `Hammer`: Stealth-Verlust auf installierte Karten verteilen.
  - `Data Fort Reclamation` Rez-Schritt: frisch installierte Karten zum Rezzen wählen, sofern sie im Feld gerendert sind.

## Nicht im Scope

- Keine Engine-Regeländerung, keine neuen PlayerAction-Typen.
- Keine Änderung an Replay, StateHash, LegalAction-Erzeugung oder `applyAction`-Revalidierung.
- Keine automatische Umstellung von Stack-, R&D-, HQ-, Archives-, Heap-, Grip- oder Reorder-Choices auf dieses Feldkartenmodell.
- Keine dauerhafte Offenlegung verdeckter Karten.
- Keine Redesign-Arbeit an allen Choice-Dialogen.

## Akzeptanzkriterien

- [ ] Feldkarten-Choices erscheinen nicht mehr als großes modales `CardChoicePanel`, wenn alle auswählbaren Optionen direkt auf gerenderte Feldkarten gemappt werden können.
- [ ] Actionboard zeigt Prompt, Auswahlzähler und Bestätigung für Feldkarten-Choices.
- [ ] Betroffene Karten zeigen einen klaren Auswahlmarker oder Auswahlknopf.
- [ ] Mehrfachauswahl, optionale Auswahl mit `minSelections: 0` und exakte Auswahl mit `minSelections === maxSelections` funktionieren.
- [ ] Auswahl kann vor dem Bestätigen geändert werden; vor dem Bestätigen wird keine Karte aufgedeckt, getrasht, gerezzt oder anderweitig aufgelöst.
- [ ] Die UI nutzt ausschließlich `pendingChoice.options` als Legalitätsquelle.
- [ ] Hidden-Info bleibt geschützt: verdeckte Kartentitel erscheinen nicht durch die Auswahlmarkierung.
- [ ] Fokussierte Web-Tests decken mindestens `Hunt Club BBS`, eine ICE-Ziel-Choice und eine Runner-Rig-Ziel-Choice ab.
- [ ] Checks: `corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts`, passende Web-Komponententests, `corepack pnpm --filter @netgrid/web typecheck`, `git diff --check`.

## Umsetzungshinweise

- Das bestehende Discard-Muster ist der wichtigste UI-Anker, sollte aber zu einem generischen lokalen Choice-State abstrahiert werden statt nur für `discard_phase` kopiert zu werden.
- `CardView` hat bereits `choiceSelected`; ein generischer `choiceShortcut` oder eine Verallgemeinerung von `discardShortcut` kann reichen.
- Der Mapping-Helper sollte klar zwischen Feldkarten und Nicht-Feldkarten unterscheiden. Wenn Mapping unsicher ist, beim bestehenden Choice-Panel bleiben.
- Bei verdeckten Korp-Karten darf der Marker nur Standort und Auswählbarkeit anzeigen, nicht Titel oder Definition.

## Ergebnisnotiz

Noch offen.
