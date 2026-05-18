# V1.6.0 Test Matrix - Tutorial und Regelhilfe

Stand: 2026-05-08
Status: eingefroren

## Tutorial- und LegalAction-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V160-T001 | Abhängigkeit | V160-MUST-001 | Review: V1.5.0 Final Gate ist grün. |
| V160-T002 | Modusgrenze | V160-MUST-002 | UI/Server-Test: Tutorialmodus ist von normalen Matches getrennt. |
| V160-T003 | Szenariofreigabe | V160-MUST-003 | Artifact-Test: Tutorial nutzt nur freigegebene Karten/Mechaniken. |
| V160-T004 | LegalActions | V160-MUST-004, V160-MUST-005 | Tutorial-Test: Hinweise referenzieren nur aktuelle LegalActions. |
| V160-T005 | Replay/StateHash | V160-MUST-006 | Replay-Test: Tutorial-Szenarien sind deterministisch. |
| V160-T006 | Hidden Info | V160-MUST-007 | Redaction-Test: Hinweise leaken keine verdeckten Karten. |
| V160-T007 | Kernlektionen | V160-MUST-008 | Szenario-Test: erste Lektionen decken Kernabläufe ab. |
| V160-T008 | Damage/Flatline | V160-MUST-009 | Szenario-Test: nur bestehender Damage-/Flatline-Vertrag wird erklärt. |
| V160-T009 | bedingte Mechaniken | V160-MUST-010 | Artifact-Test: spätere Mechaniken nur mit freigegebenem Szenario. |

## Hilfe-, KI- und No-Scope-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V160-T010 | Glossar | V160-MUST-011 | Content-Test: Begriffe sind projektkonform. |
| V160-T011 | KI-Sparring | V160-MUST-012 | AI-Test: Sparring-KI nutzt nur erlaubte Inputs. |
| V160-T012 | Kein LLM-Actioner | V160-MUST-013 | No-Scope-Test: kein LLM erzeugt Live-Actions. |
| V160-T013 | Keine Public-Funktionen | V160-MUST-014 | No-Scope-Test: keine Accounts, Cloud, Matchmaking, Ranking, Turniere. |
| V160-T014 | Keine Freigaben | V160-MUST-015 | Catalog/Manifest-Test: keine neue Karte, Mechanik oder KI-Freigabe. |

## Browser-Smokes

- Tutorial-Liste öffnet.
- erstes Tutorial startet.
- aktueller LegalAction-Hinweis erscheint.
- falsche oder nicht aktuelle Aktion wird nicht als Empfehlung angezeigt.
- Tutorial-Replay ist nach Abschluss prüfbar.

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e` oder gezielter Tutorial-Browser-Smoke

## Gate-Auswertung

V1.6.0 darf finalisiert werden, wenn Kern-Tutorials lernbar, side-sicher, LegalAction-basiert und replaybar sind.
