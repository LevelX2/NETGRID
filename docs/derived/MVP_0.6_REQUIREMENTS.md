# MVP 0.6 Requirements

Status: frozen_for_implementation  
Stand: 2026-05-03  
Scope: Deck Editor und Match Setup Foundation

## Scope-Entscheidung

MVP 0.6 baut Decks als eigene lokale Produktobjekte und verbindet sie mit Matchstart. Die Phase startet keine V0.7-UI-Neugestaltung und macht keine nicht implementierten Karten spielbar.

Leitsatz:

> Decks werden editierbar, aber Matches starten nur mit validierten, reproduzierbaren Deck-Snapshots.

## Quellen und Annahmen

- V0.6 nutzt den V0.5-Katalogstatus und die versionierten Demo-Decks aus `data/decks/demo-decks.json` und `data/decks/demo-decks-0.4.json`.
- V0.6 führt ein allgemeines Deckmodell parallel zu bestehenden Demo-Deck-IDs ein.
- Private lokale Deckentwürfe gehören nicht in versionierte Projektartefakte.
- Gegnerische Decklisten bleiben standardmäßig privat.
- Gegner darf nur erlaubte Metadaten sehen: Side, Identity, Deckname, Kartenpool-/Formatversion und Snapshot-Hash.

## Nicht-Ziele

- finale UI-Neugestaltung,
- vollständige offizielle Turnierlegalität,
- Rotation, Banlisten oder Influence als Vollumfang,
- Spielbarkeit nicht implementierter Karten,
- öffentliche Decklistenplattform,
- Accounts, Cloud-Sync, Matchmaking oder Rankings,
- neue Regelmechaniken als Hauptziel.

## Must Requirements

| ID | Requirement | Akzeptanzkriterium | Test-/Szenario-Abdeckung |
|---|---|---|---|
| V06-MUST-001 | Deck-Spezifikation | `DECK_EDITOR_0.6_SPEC.md` beschreibt Deckmodell, Snapshots, Import/Export und Editorfunktionen. | T-V06-DOC-001 |
| V06-MUST-002 | Allgemeines Deckmodell | Decks sind versionierte Deckobjekte mit Side, Identity, Kartenliste, Kartenpool-Version und Formatprofil. | T-V06-MODEL-001 |
| V06-MUST-003 | Deck-Snapshot-Hash | Jeder validierte Deck-Snapshot hat deterministischen Hash und unveränderliche Daten. | T-V06-SNAPSHOT-001 |
| V06-MUST-004 | Deckvalidierung v2 | Validierung prüft Side, Identity, Kartenstatus, Mengen, Agenda Points, Mindestanforderungen und lokales Formatprofil. | T-V06-VALID-001 |
| V06-MUST-005 | Nicht-spielbare Karten gesperrt | `imported`/`catalog_ready` ohne `playable`/`deck_legal` blockiert spielbare Matches. | T-V06-VALID-002 |
| V06-MUST-006 | Funktionaler Deckeditor | Decks können lokal erstellt, bearbeitet, gespeichert, geladen, dupliziert und gelöscht werden. | T-V06-UI-001 |
| V06-MUST-007 | Import/Export | Decks können in lokalem JSON-Format importiert und exportiert werden. | T-V06-IO-001 |
| V06-MUST-008 | Matchstart mit Deckauswahl | Human-vs-Human, Human-vs-KI und KI-vs-KI starten mit validierten Deck-Snapshots. | T-V06-MATCH-001 |
| V06-MUST-009 | Replay/StateHash-Schutz | Matchstart dokumentiert Deck-Snapshot-Hashes; laufende Matches hängen nicht an editierbaren Deckentwürfen. | T-V06-REPLAY-001 |
| V06-MUST-010 | Visibility-Schutz | Gegnerische Decklisten leaken nicht über Bootstrap, WebSocket, Reconnect, Errors, Logs oder PublicEvents. | T-V06-VIS-001 |
| V06-MUST-011 | Legacy-Kompatibilität | Demo-Decks bleiben startbar und MVP-0.1 bis MVP-0.5-Tests bleiben grün. | T-V06-REG-001 |

## Should Requirements

| ID | Requirement | Akzeptanzkriterium |
|---|---|---|
| V06-SHOULD-001 | Decklisten-Ansicht | Lokale Decks haben Liste, Suche, Side-Filter und Validierungsstatus. |
| V06-SHOULD-002 | Validierungsdetails | Fehler nennen Karte, Regel und Behebung ohne versteckte Matchdaten. |
| V06-SHOULD-003 | Demo-Deck-Kopien | Bestehende Demo-Decks können als editierbare Kopie angelegt werden. |
| V06-SHOULD-004 | KI-Smoke mit Decks | KI-vs-KI läuft mit ausgewählten validierten Decks über mehrere Seeds. |

## Artefakte

Derived Docs:

- `docs/derived/DECK_EDITOR_0.6_SPEC.md`
- `docs/derived/DECK_VALIDATION_0.6_SPEC.md`
- `docs/derived/MATCH_SETUP_0.6_SPEC.md`
- `docs/derived/DECK_STORAGE_0.6_SPEC.md`
- `docs/derived/MVP_0.6_TEST_MATRIX.md`
- `docs/derived/MVP_0.6_REQUIREMENTS_REVIEW.md`

Daten:

- `data/decks/deck-format-profiles-0.6.json`
- `data/decks/deck-templates-0.6.json`
- `data/decks/deck-snapshots-0.6.json`
- `data/manifests/deck-validation-manifest-0.6.json`

Tests:

- `tests/specs/deck-editor-0.6-acceptance-tests.todo.md`
- V0.6-Artefaktprüfungen in `tests/specs/phase1-artifacts.test.ts`

## Gate

`ready_for_implementation: true`

Begründung: Formatprofil, Template-Decks, Snapshot-Daten, Hashes und Manifest-Gates sind ausführbar angelegt. V0.6 kann implementiert werden, ohne V0.7-Design, offizielle Legalität oder nicht implementierte Karten in den Scope zu ziehen.
