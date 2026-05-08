# V1.3.1 Test Matrix - Card Data Pipeline v2

Stand: 2026-05-08
Status: eingefroren

## Pipeline- und Snapshot-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V131-T001 | Abhängigkeit | V131-MUST-001 | Review/Test-Setup: V1.3.0-Final-Gate ist grün. |
| V131-T002 | Source Registry | V131-MUST-002 | Daten-/Schema-Test: Registry v2 enthält Quelle, Provenienz, Nutzungsentscheidung und Review-Status. |
| V131-T003 | Snapshot | V131-MUST-003, V131-MUST-004 | Snapshot-Test: deterministische Sortierung und stabiler Hash bei gleicher Eingabe. |
| V131-T004 | Keine Runtime-Quelle | V131-MUST-004 | Code-/Config-Test: Spielruntime macht keine externe Kartendatenbankabfrage. |
| V131-T005 | Statusmodell | V131-MUST-005 | Catalog-Test: Statusfelder bleiben getrennt und einzeln auswertbar. |
| V131-T006 | Keine Auto-Freigabe | V131-MUST-006 | Pipeline-Test: Import/Text/Bild/Hint setzt keine Spielbarkeit. |

## Card-Support- und Reviewtests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V131-T007 | Required Mechanics | V131-MUST-007, V131-MUST-009 | Manifest-Test: fehlende/ungedeckte Mechanik blockiert Freigabe. |
| V131-T008 | ResolverRefs | V131-MUST-008, V131-MUST-010 | Manifest-Test: Engine-Support ohne Resolver/Ability wird blockiert. |
| V131-T009 | AI-Hints | V131-MUST-011, V131-MUST-012, V131-MUST-013 | AI-Datentest: Hints validieren Side, Typ, Rollen, Mechaniken und Wertebereiche. |
| V131-T010 | Statusreport | V131-MUST-016 | Report-Test: blockierte Karten und KI-Blocker werden vollständig genannt. |
| V131-T011 | Errata/Text | V131-MUST-017 | Diff-Test: Textänderung wird reviewpflichtig, verändert aber keinen Resolver. |

## Diff-, Rollback- und Redaction-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V131-T012 | Import-Diff | V131-MUST-014 | Diff-Test: Text-, Numeric-, Status-, Mechanik-, Resolver-, Asset- und Hint-Änderungen werden klassifiziert. |
| V131-T013 | Rollback | V131-MUST-015 | Rollback-Test: bekannter Snapshot wird wieder aktiv, laufende Match-Snapshots bleiben unverändert. |
| V131-T014 | Redaction | V131-MUST-018, V131-MUST-019 | Leak-Test: keine Tokens, lokalen privaten Pfade, Hidden Cards oder gegnerischen Decklisten in Reports/API. |
| V131-T015 | V1.3.0 Regression | V131-MUST-020 | Deck-/Server-Test: Deckvalidierung und Matchstart-Revalidierung bleiben grün. |

## No-Scope- und Pflichtchecks

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V131-T016 | Testabdeckung | V131-MUST-021 | Review: alle Musts sind durch Tests oder Review-Spur abgedeckt. |
| V131-T017 | No-Scope | V131-MUST-022 | Regression: kein Parser, keine Kartenfreigabe, keine Mechanik, keine Public-Funktion, keine Assets. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte Catalog-, Deck-, AI-Daten-, Pipeline-, Report- und Redaction-Tests

## Gate-Auswertung

V1.3.1 darf finalisiert werden, wenn:

- Pipeline-Snapshots reproduzierbar sind,
- Statusübergänge nicht automatisch Spielbarkeit erzeugen,
- AI-Hints validiert, aber nicht freigabeautoritativ sind,
- Diff und Rollback testbar sind,
- V1.3.0-Deck- und Matchstart-Gates grün bleiben,
- keine privaten Daten oder Hidden Info leaken.
