# MVP 0.6 Requirements Review

Status: pass  
Stand: 2026-05-03

## Review-Ergebnis

`ready_for_implementation: true`

V0.6 ist ausreichend klar für die Implementierung. Die Requirements leiten Deckmodell, Snapshotting, Validierung, Speicherung, Match Setup und Visibility-Gates aus dem bestandenen V0.5-Katalogstand ab.

## Geprüfte Gates

| Gate | Ergebnis | Notiz |
|---|---|---|
| V0.5 Voraussetzung | pass | `MVP_0.5_done: true`; Katalogstatus und Statusmanifest vorhanden. |
| Allgemeines Deckmodell | pass | Deckobjekte und Snapshots sind als Artefakte angelegt. |
| Snapshot-Stabilität | pass | Vier Demo-Snapshots haben deterministische Hashes. |
| Nicht-spielbare Karten gesperrt | pass | Formatprofil verlangt `playable` und `deck_legal`. |
| Hidden-Info-Schutz | pass | Manifest beschränkt öffentliche Deckmetadaten. |
| Testabdeckung | pass | Jede Must-Anforderung ist einer Testmatrix-ID zugeordnet. |
| V0.7 außerhalb Scope | pass | UI bleibt funktionaler Deckeditor und Match Setup. |

## Annahmen

- V0.6 nutzt zunächst JSON/LocalStorage-nahe lokale Speicherung; SQLite bleibt eine spätere Härtungsoption.
- Die vier Demo-Decks sind gültige V0.6-Templates und Snapshots.
- Vollständige offizielle Legalität bleibt außerhalb des Scopes.

## Risiken

- Der bestehende Engine-Typ `DemoDeckId` ist eng und muss für Snapshots erweitert werden, ohne Legacy-IDs zu brechen.
- Matchstart darf nicht nur clientseitiger Validierung vertrauen.
- UI-Komfort darf nicht in V0.7-Redesign kippen.

## Nächster Schritt

Phase 2: V0.6 Implementierung mit `packages/decks`, lokalem Deckmodell, Deckvalidierung v2, Snapshots, Import/Export, Deckeditor-UI und Match-Setup-Erweiterung.
