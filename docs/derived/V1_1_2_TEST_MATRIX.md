# V1.1.2 Test Matrix - Full Archives Access und Matchstart Entry UX

Stand: 2026-05-07
Status: eingefroren

## Track A - Full Archives Access

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V112A-T001 | Queue-Aufbau | V112A-MUST-001, V112A-MUST-002 | Engine-Test: Run auf Archives baut Queue aus allen `corp.archives`-Karten in Array-Reihenfolge. |
| V112A-T002 | Runner-View vor Access | V112A-MUST-003, V112A-MUST-004 | Engine-PlayerView-Test: Runner sieht faceup Archives-Karten, aber keine facedown Titel/DefinitionIds. |
| V112A-T003 | Korp-View | V112A-MUST-005 | Engine-PlayerView-Test: Korp sieht eigene faceup/facedown Archives vollständig. |
| V112A-T004 | Hidden-Klassifikation | V112A-MUST-006 | Engine-Test: facedown Archives-Karten werden beim Breach-Start faceup; Queue-Einträge sind danach nicht mehr hidden. |
| V112A-T005 | Reveal beim Breach-Start | V112A-MUST-006, V112A-MUST-008 | Engine-Test: Run/Breach auf Archives revealt alle bestehenden facedown Archives-Karten vor dem ersten Access. |
| V112A-T006 | Keine künftigen Leaks | V112A-MUST-007, V112A-MUST-008, V112A-MUST-009, V112A-MUST-010 | Engine/Visibility-Test: PublicEvents und accessedSummaries enthalten keine weiterhin facedown Titel. |
| V112A-T007 | Agenda-Steal | V112A-MUST-011 | Engine-Test: Agenda aus Archives wird beim Access gestohlen und Queue-Fortschritt bleibt korrekt. |
| V112A-T008 | Trash aus Archives | V112A-MUST-012 | Engine-Test: Karte aus Archives bietet keine `trash_accessed_card`-LegalAction; defensiver Trash-Versuch wird abgelehnt. |
| V112A-T009 | Decline/Weiter/Auto-Fortsetzung | V112A-MUST-013 | Engine-Test: Decline schließt aktuellen Eintrag; Karten ohne Runner-Entscheidung können automatisch zusammengefasst werden. |
| V112A-T010 | Undo-Barriere | V112A-MUST-014, V112A-MUST-015 | Server/Engine-Test: Archives-Breach-Start-Reveal blockiert Undo bei geöffneten facedown Karten; faceup-only Access-Verhalten ist dokumentiert. |
| V112A-T011 | Replay/StateHash | V112A-MUST-016 | Engine-Replay-Test: Archives-Breach reproduziert finalen StateHash. |
| V112A-T012 | Reconnect | V112A-MUST-017 | Server-Test: Reconnect während Archives-Breach zeigt nur side-sicheren Fortschritt. |
| V112A-T013 | Submit/Idempotency/Stale | V112A-MUST-018 | Server-Test: duplicate `access_card` und stale StateVersion erzeugen keinen Doppel-Access. |
| V112A-T014 | KI-Input | V112A-MUST-019 | AI-/Visibility-Test: Runner-KI erhält keine facedown Archives-Titel vor Access. |
| V112A-T015 | Web UI | V112A-MUST-020 | Web-Test: Archives Count, bekannte Karten, Breach-Fortschritt und Access-Reveal rendern. |
| V112A-T016 | Redaction Regression | V112A-MUST-021 | Visibility-Spec: HQ/F&E-Redaction bleibt unverändert grün. |
| V112A-T017 | No-Scope | V112A-MUST-022 | Regression: keine Prevention/Avoid/Interrupt/Replacement-, Runner-Deckout-, Kartenpool- oder Asset-Erweiterung. |

## Track B - Matchstart Entry UX

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V112B-T001 | Startkonsole | V112B-MUST-001 | Web/E2E-Screenshot: Startscreen wirkt nicht mehr als lange Formularliste. |
| V112B-T002 | Spielart-Kacheln | V112B-MUST-002, V112B-MUST-003 | Web-Test: Kacheln setzen `playMode`, `deriveMatchStart` bleibt maßgeblich. |
| V112B-T003 | Format-Kacheln | V112B-MUST-004, V112B-MUST-005 | Web-Test: Regelmatch/Matchserie auswählbar, kein Deckziel-Text. |
| V112B-T004 | Human-vs-Human Default | V112B-MUST-006 | E2E: Standard zeigt Name, eigene Decks, Summary und Lobby-Erstellen. |
| V112B-T005 | Erweiterte Optionen | V112B-MUST-007, V112B-MUST-008 | Web/E2E: Seitenwahl, Countdown, Seed, Testkonstellation und KI-Optionen erreichbar. |
| V112B-T006 | Join-Link Parser | V112B-MUST-009, V112B-MUST-010 | Unit-Test in `match-start.test.ts`: gültige/ungültige Links und manuelle Eingabe. |
| V112B-T007 | Token-Sicherheit | V112B-MUST-011, V112B-MUST-013 | Visibility/E2E-Leak-Scan: Tokens nicht in Storage/Summary/Notice außerhalb erlaubter Inputs. |
| V112B-T008 | Startzusammenfassung | V112B-MUST-012, V112B-MUST-013 | Web-Test: Summary zeigt nur side-safe Status. |
| V112B-T009 | Accessibility/Test-IDs | V112B-MUST-014 | Web-Test oder E2E: neue Test-IDs und Tastaturfokus funktionieren. |
| V112B-T010 | Responsive Visual QA | V112B-MUST-015, V112B-MUST-016 | E2E-Screenshots Desktop/Tablet/390x844; kein Textüberlauf, kein horizontaler Scroll. |
| V112B-T011 | Flow Regression | V112B-MUST-008 | E2E: Human-vs-Human, Human-vs-KI, KI-vs-KI, Join per Link und manuell. |

## Kombinierte E2E-Smokes

| Test-ID | Flow | Erwartung |
| --- | --- | --- |
| V112-E2E-001 | Archives-Breach Desktop | Runner greift gemischte Archives an; bestehende facedown Karten werden beim Breach-Start sichtbar. |
| V112-E2E-002 | Archives-Breach Reconnect | Reconnect während Access zeigt Fortschritt ohne weiterhin hidden Titel. |
| V112-E2E-003 | Archives Leak Scan | DOM/Storage/Payload enthalten keine facedown Archives-Titel vor dem Archives-Breach-Start-Reveal. |
| V112-E2E-004 | Startscreen Desktop | Kacheln, Summary, Deckslots, Primärbutton sichtbar. |
| V112-E2E-005 | Startscreen schmal | 390x844 ohne horizontalen Scroll und ohne Textüberlauf. |
| V112-E2E-006 | Join per Link | Join-Link-Feld füllt Match/Token intern; Beitritt mit Decks funktioniert. |
| V112-E2E-007 | Manual Join | Manuelle Felder bleiben erreichbar und funktionieren. |

## Pflichtchecks

- `corepack pnpm --filter @netgrid/shared typecheck`
- `corepack pnpm --filter @netgrid/engine test -- --run`
- `corepack pnpm --filter @netgrid/server test -- --run`
- `corepack pnpm --filter @netgrid/ai test -- --run`
- `corepack pnpm --filter @netgrid/web test -- --run`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`

## Gate-Auswertung

V1.1.2 darf nur finalisiert werden, wenn:

- alle Track-A-Tests grün sind,
- Track-B-Tests entweder grün sind oder Track B bewusst aus dem Release verschoben und dokumentiert wurde,
- Visibility- und E2E-Leak-Scans grün sind,
- keine No-Scope-Funktion versehentlich freigeschaltet wurde.
