# Final Review: Expose-Feedback für Ice and Data Special Report

Status: Final im Arbeitsbranch verifiziert

## Ergebnis

`Ice and Data Special Report` macht nach der Auswahl eines einzelnen Data
Forts die betroffenen Karten jetzt in beiden geforderten Darstellungskanälen
eindeutig sichtbar:

- Die Chronik nennt die Anzahl, jede exposed Karte und ihre Fort-Position,
  etwa `Simple Barrier ICE (Remote 1 ICE 1)`.
- Das Board markiert ausschließlich die öffentlich exposed und im PlayerView
  sichtbaren Karten mit einem farbigen Rahmen.
- Die Markierung endet lokal nach zehn Sekunden oder unmittelbar beim nächsten
  `turnSerial`.
- Die lokale Option `Exposed-Karten hervorheben` ist standardmäßig aktiv und
  persistiert im vorhandenen Gameplay-Settings-Speicher.

## Visibility- und Regelvertrag

Der Expose-Resolver ergänzt die öffentliche Auflösung des einzelnen
Data-Fort-Expose um `exposedCardInstanceIds`. Diese IDs stammen ausschließlich
aus der bereits gewählten und public exposed Kartenmenge. Sie werden über den
bestehenden Public-Context weitergegeben; weder Full GameState noch fremde
private Choices oder verdeckte Karten werden an die UI gereicht.

Die UI verarbeitet die IDs nur als lokalen Hinweis. Der Timer, die Option und
der Rahmen ändern keinen Match-State, keine LegalActions, keine Engine-Regeln,
keinen Replay-Log und keinen StateHash.

## Regressionen und Checks

- `rule-contract-baseline-utilities.test.ts`: 20 Tests grün; der
  Ice-and-Data-Flow prüft die öffentliche Karteninstanz, Kartenidentität und
  Fort-Position nach einer legalen Auswahl.
- `chronicle.test.ts` und `action-board-ui.test.ts`: 293 Tests grün; sie
  prüfen den vollständigen Chronicle-Text sowie die strikte Auswahl nur aus
  passenden Public-Expose-Events.
- `corepack pnpm --filter @netgrid/engine typecheck`: grün.
- `corepack pnpm --filter @netgrid/web typecheck`: grün.
- `corepack pnpm typecheck`: alle sieben Workspace-Projekte grün.
- `corepack pnpm check:package-boundaries`: 1.787 Dateien geprüft, grün.
- `corepack pnpm format:changed` und `git diff --check`: grün.

## Restpunkte

Keine. Das Verhalten ist auf die lokale Darstellung begrenzt und kann bei
einem späteren allgemeinen Expose-Feedback bewusst als eigener Vertrag
verallgemeinert werden.
