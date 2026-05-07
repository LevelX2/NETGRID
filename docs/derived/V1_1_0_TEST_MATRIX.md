# V1.1.0 Test Matrix - Setup/Game-End M2 und NETGRID-Statusklarheit

Stand: 2026-05-07
Status: implemented

## Coverage

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V110-T001 | Explizites Setup | V110-MUST-001 | Engine-Test: `createGame` startet in `setup.mulligan.runner`. |
| V110-T002 | Runner-Mulligan side-safe | V110-MUST-002, V110-MUST-006 | Engine- und Multiplayer-Tests prüfen nur Runner sieht Runner-Choice. |
| V110-T003 | Korp-Mulligan side-safe | V110-MUST-002, V110-MUST-016 | Multiplayer-Reconnect-Test prüft Korp-Choice nach Runner-Keep. |
| V110-T004 | LegalActions-Vertrag | V110-MUST-003, V110-MUST-004 | Engine-Tests lösen Setup nur über `resolve_choice`. |
| V110-T005 | Deterministische Mulligan-Randomness | V110-MUST-005 | Engine-Test prüft RandomDrawRecords und Replay nach Mulligan. |
| V110-T006 | Hidden-Info-Barriere | V110-MUST-006 | Engine-/Server-Tests prüfen keine privaten Kartentitel in PublicEvents/opponentPayload. |
| V110-T007 | Replay/StateHash | V110-MUST-007 | Engine-Replay-Test und bestehende Replay-Suite. |
| V110-T008 | Agenda-Ziel 7 | V110-MUST-008, V110-MUST-009 | Engine-, Server-, Web- und Visibility-Tests prüfen Zielwert 7. |
| V110-T009 | Game-End Agenda | V110-MUST-010 | Multiplayer-Siegtest prüft `agenda_points`. |
| V110-T010 | Korp-Deckout | V110-MUST-010, V110-MUST-011 | Bestehende Engine-/Server-Deckout-Regressionen. |
| V110-T011 | Flatline | V110-MUST-010, V110-MUST-012 | V0.94-Engine-/Server-Flatline-Tests bleiben grün. |
| V110-T012 | Runner-Deckout Nicht-Aktivierung | V110-MUST-013 | Scope-Abgleich in Requirements/Final Review; keine neue Winner-Reason. |
| V110-T013 | Identity-PlayerViews | V110-MUST-014 | Engine-Tests und Web-Typecheck-Fixtures prüfen `own.identity`/`opponent.identity`. |
| V110-T014 | Archives-facedown-Grundlage | V110-MUST-015 | Bestehende Visibility-, Hidden-Install- und E2E-Leak-Scans. |
| V110-T015 | KI-Setup | V110-MUST-016, V110-MUST-017 | Server-KI-Tests und AI-Tests angepasst auf Setup-Vertrag. |
| V110-T016 | Reconnect | V110-MUST-016 | Multiplayer-Test prüft Korp-Reconnect mit privater Choice und rotiertem Session-Token. |
| V110-T017 | UI Schreibweise Korp | V110-MUST-018 | Web-Tests, Visibility-Contract und E2E-Screens prüfen sichtbare UI-Texte. |
| V110-T018 | NETGRID-Icons | V110-MUST-019, V110-MUST-020 | Web-Typecheck, Web-Tests und Browser-E2E decken Rendering ab. |
| V110-T019 | Setup-UI side-safe | V110-MUST-021 | Browser-E2E-Helfer löst Setup aus Nutzerperspektive; Server-Test prüft gegnerische Payload. |
| V110-T020 | Full Regression | alle | `corepack pnpm lint`, `typecheck`, `test`, `build`, `e2e`. |

## Pflicht-Gates

| Befehl | Ergebnis am 2026-05-07 |
| --- | --- |
| `corepack pnpm lint` | pass |
| `corepack pnpm typecheck` | pass |
| `corepack pnpm test` | pass |
| `corepack pnpm build` | pass, bekannte Turbopack-NFT-Warnung |
| `corepack pnpm e2e` | pass, 7 Browser-E2E-Tests |

## Scope-Regression

Die Tests und Reviews bestätigen: keine neue Kartenbreite, keine neue Runner-Deckout-Siegbedingung, keine Prevention/Replacement-/Core-Damage-/Full-Archives-Access-Funktion und keine neue Browser- oder KI-Regelautorität.
