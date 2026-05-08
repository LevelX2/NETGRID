# V1.0.7 Test Matrix - Browser-E2E und Visual QA

Stand: 2026-05-06
Status: Requirements-Freeze-Testmatrix

## Coverage

| Test-ID | Bereich | Requirement-IDs | Erwartung |
| --- | --- | --- | --- |
| V107-T001 | Tooling/Gate | V107-MUST-001, V107-MUST-002 | Es gibt einen dokumentierten Browser-E2E-Befehl, der lokal wiederholbar läuft. |
| V107-T002 | Tooling Discovery | V107-MUST-001 | `tests/e2e` oder eine äquivalente Struktur enthält echte Browser-E2E-Tests statt nur Platzhalter. |
| V107-T003 | Harness | V107-MUST-002 | Web und Server werden kontrolliert gestartet oder ein bestehender lokaler Lauf wird eindeutig erkannt. |
| V107-T004 | Runtime Isolation | V107-MUST-003 | E2E verwendet temporäre/isolierte Matchdaten und schreibt nicht in die normale lokale Runtime-Datei. |
| V107-T005 | Browser Human-vs-KI | V107-MUST-004 | Human-vs-KI erreicht ein aktives Spiel, zeigt KI-Takt/Cue und erlaubt eine menschliche Aktion. |
| V107-T006 | Browser Human-vs-Human | V107-MUST-005 | Zwei getrennte Browser-Kontexte decken Host, Join, Deckauswahl, Ready-Lobby, Countdown und aktives Spiel ab. |
| V107-T007 | Browser Lifecycle/Reconnect | V107-MUST-006 | Cancel, Recreate, Leave, Forfeit, Fortsetzen/Reconnect und Verwerfen sind browserseitig erreichbar und side-sicher. |
| V107-T008 | Browser Board/Run | V107-MUST-007 | RunTimeline, Run-Ziel, zentrale Server, Runner-Rig, Cue-Position und Chronicle bleiben sichtbar und bedienbar. |
| V107-T009 | Visibility Rez/Unrez | V107-MUST-007, V107-MUST-012 | Runner sieht vor Rez keine ICE-/Root-Titel; Corp erkennt eigene ungerezzte Karten side-sicher. |
| V107-T010 | Browser V1.0.6 UI | V107-MUST-008 | Aktionen, Credits, Kostenchips, Card-Display-Modi, Tooltip/Fokus und Kompaktmodus funktionieren in echter Browseransicht. |
| V107-T011 | Viewport Matrix | V107-MUST-009, V107-MUST-010 | Desktop 1280x720, Tablet 1024x768 und Schmal 390x844 werden mindestens einmal mit aktiver Spielsituation geprüft. |
| V107-T012 | Textfit/Overlap | V107-MUST-010 | Buttons, Kostenchips, Action-Slots, Card Preview, Cue, RunTimeline und Panels laufen nicht unlesbar aus oder überlappen kritisch. |
| V107-T013 | Visual Artifacts | V107-MUST-011, V107-COULD-001 | Screenshots/Traces werden für relevante Flows und mindestens bei Fehlschlägen erzeugt; keine pixelgenauen Goldens erforderlich. |
| V107-T014 | Hidden Card DOM Leak | V107-MUST-012 | Verdeckte gegnerische Karten enthalten im DOM keine Titel, Definition-IDs, Bild-URLs, Card-Back-Routen, spezifischen Tooltips oder spezifische Klassen. |
| V107-T015 | Token/Payload/Storage Leak | V107-MUST-013 | Browser-Storage, sichtbare Payloads und DOM enthalten keine Tokens, Decklisten, Deckhashes, private Payloads oder falsche Hidden Info. |
| V107-T016 | Authority Boundary | V107-MUST-014 | Aktive Weboberfläche bleibt ohne Engine-Regelautorität; E2E ergänzt keine Client-Rule-Shortcuts. |
| V107-T017 | Current UI Adjustments QA | V107-MUST-015 | Direkte Server-Run-Actions, breakergebundene Kontextaktionen und Stärke-Bonusmarke werden als Lesbarkeits-/Leak-Ziele geprüft, sofern im Testzustand erreichbar. |
| V107-T018 | Scope Regression | V107-MUST-016 | Keine neuen Karten, Mechaniken, offiziellen Assets, Replay-/StateHash-Änderungen oder Plattformfeatures entstehen durch V1.0.7. |
| V107-T019 | E2E Helpers | V107-SHOULD-001 | Wiederkehrende Browserhandlungen sind in Hilfsfunktionen gekapselt und nicht fragil über lange Testskripte verteilt. |
| V107-T020 | Gate Report | V107-SHOULD-002 | Implementation/Final Review nennt Befehl, Viewports, Flows, Artefakte, Leaks und Restpunkte. |
| V107-T021 | Test Selectors | V107-SHOULD-003 | Neue Testselektoren enthalten keine Hidden Info, Tokens, Deckdaten oder technische Produkttexte. |

## Pflichtchecks für Implementierung

- Browser-E2E-Gate-Befehl für V1.0.7.
- `corepack pnpm --filter @netgrid/web test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `git diff --check`

## Mindest-Browser-Smokes

1. Human-vs-KI Desktop.
2. Human-vs-Human Desktop mit zwei Browser-Kontexten.
3. Lifecycle/Reconnect Desktop.
4. Aktive Spieloberfläche Tablet.
5. Aktive Spieloberfläche schmaler Viewport.
6. Hidden-Info-/Token-/DOM-Leak-Scan.

## Manuelle Ergänzung

Falls eine Stelle im ersten V1.0.7-Schnitt nicht robust automatisierbar ist, darf sie als dokumentierter manueller Smoke ergänzt werden. Das ist nur akzeptabel, wenn:

- der Grund im Implementation Review steht,
- der automatisierte Gate trotzdem den Hauptpfad abdeckt,
- die manuelle Stelle im Final Review mit Browser und Viewport bewertet wird.

## Requirements-Coverage

Alle Must-Anforderungen aus `docs/derived/V1_0_7_REQUIREMENTS.md` haben mindestens eine Testspur in dieser Matrix.
