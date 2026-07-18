# Runtime Port Architecture

Status: migration foundation

## Problem

Die aktuelle Runtime-Komposition leitet 430 Funktionen über fünf Wrapperdateien
mit `(...args: any[]): any` und einen dynamischen String-Lookup weiter. Dadurch
prüft TypeScript genau an der zentralen Routinggrenze weder Parameter noch
Rückgabewerte zuverlässig.

## Zielvertrag

`runtime-port-contracts.ts` leitet jede Portgruppe direkt mit `ReturnType` aus
der konkreten Factory ab. Es gibt damit keine zweite handgeschriebene Signatur
und keine generische String-/Function-Schnittstelle. `RuntimePortRegistry`
installiert eine typisierte Auswahl genau einmal und meldet fehlende Gruppen
explizit.

Die Portgruppen entsprechen zunächst den existierenden Factory-Grenzen. Diese
Stabilität erlaubt die schrittweise Migration ohne Regel- oder
Initialisierungsänderung:

1. E05 migriert State, Economy, Counter und Zone.
2. E06 migriert Turn, Action, Corp und Card Lifecycle.
3. E07 migriert Run, Access, Choice, Hidden Info, Damage und Trace.
4. E08 entfernt den verbliebenen Delegate-Store und die Altwrapper.

Während E04 ist die Grundlage bewusst noch parallel und ohne produktiven
Consumer. So bleibt die aktuelle Bootstrap-Reihenfolge unverändert; jeder
Folgeschritt kann eine kleine Portauswahl installieren und separat testen.

## Invarianten

- Portverträge enthalten kein `any`.
- Factory-Signaturen bleiben die einzige Typquelle.
- Fehlende Gruppen werfen vor dem ersten Funktionsaufruf einen benannten Fehler.
- Eine installierte Registry kann nicht während eines Spiels rekomponiert
  werden.
- Hidden Info, LegalAction-Revalidierung, Replay und Zufall werden durch die
  reine Kompositionsgrundlage nicht verändert.
