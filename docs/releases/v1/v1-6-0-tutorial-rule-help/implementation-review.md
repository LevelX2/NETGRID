# V1.6.0 Implementation Review - Tutorial und Regelhilfe

Stand: 2026-05-08
Status: implemented

## Scope

V1.6.0 wurde nach grünem V1.5.0-Final-Gate umgesetzt. Der Release ergänzt einen getrennten lokalen Tutorialmodus mit LegalAction-basierter Regelhilfe, replaybarer StateHash-Prüfung und side-sicherem KI-Sparring, ohne neue Karten- oder Mechanikfreigaben.

## Umgesetzt

- Tutorial-Grundmodul in `apps/web/app/tutorial.ts`:
  - `TutorialScenario`-/`TutorialStep`-Vertrag gemäß V1.6.0-Spezifikation.
  - separater Modus `tutorial_local`.
  - lokale Session-Erzeugung über bestehende Engine-Verträge (`createGame`, `getLegalActions`, `applyAction`, `replayEvents`, `hashState`).
  - replaybare Tutorial-StateHash-Prüfung je Session.
  - LegalAction-basierte Hinweise (`hint.legalActionIds`, `hint.legalActionTypes`) ohne illegale Vorschläge.
  - KI-Sparring-Vorschlag ausschließlich aus aktuellen LegalActions.
- Kernlektionen für V1.6.0:
  - Setup/Mulligan
  - Klicks/Credits/Draw
  - Run
  - Encounter/Breaker
  - Access/Steal
  - Corp-Score
  - Game-End-Grundlagen
  - Damage/Flatline als geführter bestehender Scope-Fall
- Tutorial-Szenarioartefakt:
  - `data/scenarios/tutorial-v160-scenarios.json`
- Regelhilfe-Glossar:
  - `docs/releases/v1/v1-6-0-tutorial-rule-help/rule-help-glossary.md`
  - projektinterne Begriffe inkl. Scope-Hinweis auf LegalAction-/PlayerView-/side-gefilterte Projektion.
- Tutorial-UI:
  - `apps/web/app/tutorial/page.tsx`
  - getrennte Oberfläche unter `/tutorial` inklusive Lektionsauswahl, LegalAction-Hinweis, Replay/StateHash-Status, KI-Sparring-Anzeige und Glossar.
- Testabdeckung:
  - `apps/web/app/tutorial.test.ts`
  - Katalog, LegalAction-Hinweise, Replay-Check, KI-Sparring-Legalität und Glossar-Pflichtbegriffe.
- Browser-Smoke-Artefakte:
  - `docs/releases/v1/v1-6-0-tutorial-rule-help/artifacts/tutorial-smoke.json`
  - `docs/releases/v1/v1-6-0-tutorial-rule-help/artifacts/tutorial-smoke.png`

## Requirements-Abgleich

| Bereich | Ergebnis |
| --- | --- |
| V160-MUST-001 | pass: Start nach grünem V1.5.0-Final-Gate. |
| V160-MUST-002 | pass: Tutorialmodus ist getrennt (`tutorial_local`, Route `/tutorial`). |
| V160-MUST-003 | pass: Szenarien nutzen nur freigegebene Karten/Mechanikpfade. |
| V160-MUST-004 | pass: Hinweise referenzieren aktuelle LegalActions. |
| V160-MUST-005 | pass: keine illegalen Aktionsvorschläge. |
| V160-MUST-006 | pass: Replay/StateHash-Check je Tutorialsession. |
| V160-MUST-007 | pass: side-sichere Projektionen ohne Hidden-Info-Leak. |
| V160-MUST-008 | pass: Kernlektionen vollständig abgedeckt. |
| V160-MUST-009 | pass: Damage/Flatline nur als bestehender Scope-Sonderfall. |
| V160-MUST-010 | pass: spätere Mechaniken nur innerhalb freigegebener Szenarien/Scopes. |
| V160-MUST-011 | pass: projektinternes Glossar mit Scope-Hinweis. |
| V160-MUST-012 | pass: KI-Sparring bleibt LegalAction-/PlayerView-basiert. |
| V160-MUST-013 | pass: kein LLM-/Coach-Live-Actionpfad. |
| V160-MUST-014 | pass: keine Public-Plattform-/Account-/Ranking-/Turnierfunktionen. |
| V160-MUST-015 | pass: keine neue Karten-/Mechanik-/KI-Freigabe durch Tutorial. |

## Verifikation

- `corepack pnpm --filter @netgrid/web test -- tutorial.test.ts`: pass.
- `git diff --check`: pass (nur bekannte CRLF-Warnung in bestehender Datei).
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass (nur bekannte nicht-blockierende Turbopack-NFT-Warnung im bestehenden Katalogpfad).
- `corepack pnpm e2e`: pass.

Hinweis: Der erste E2E-Anlauf lief in einen lokalen Portkonflikt durch einen bereits laufenden `next dev`-Prozess; nach bereinigtem Prozesszustand war der verpflichtende E2E-Lauf grün.

## No-Scope-Bestätigung

Keine neuen Kartenfreigaben, keine neuen Mechanikfreigaben außerhalb der Spezifikation, kein Kartentextparser, keine Public-Plattformfunktionen, kein LLM/API-Live-Regelakteur und keine Hidden-Info-Leaks in Tutorial-Hinweisen, PlayerViews, WebSocket-, Reconnect-, Replay- oder Exportflächen.
