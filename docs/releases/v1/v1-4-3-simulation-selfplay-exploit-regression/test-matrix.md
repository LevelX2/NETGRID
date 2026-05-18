# V1.4.3 Test Matrix - Simulation, Selfplay und Exploit-Regression

Stand: 2026-05-08
Status: eingefroren

## Simulationstests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V143-T001 | Abhängigkeit | V143-MUST-001 | Review: V1.4.2 Final Gate ist grün. |
| V143-T002 | Inputvertrag | V143-MUST-002 | Hidden-Info-Test: Simulation erhält keinen echten Hidden State. |
| V143-T003 | State-Isolation | V143-MUST-003 | Unit/Test: echter Matchstate, Storage, EventLog und StateHash bleiben unverändert. |
| V143-T004 | LegalActions | V143-MUST-004 | Simulationstest: LegalActions werden pro hypothetischem State neu berechnet. |
| V143-T005 | RNG | V143-MUST-005 | Determinismus-Test: Simulations-RNG ist seedbar und getrennt. |
| V143-T006 | Choices/Fallback | V143-MUST-006 | Timeout-Test: ChoiceRequests hängen nicht. |
| V143-T007 | Mechanikfilter | V143-MUST-007 | Deckpool-Test: nicht simulierbare Mechaniken werden blockiert. |

## Benchmark- und Soaktests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V143-T008 | Benchmark-Versionen | V143-MUST-008 | Artifact-Test: Profile sind versioniert. |
| V143-T009 | Holdout | V143-MUST-009 | Report-Test: Trainings- und Holdout-Seeds sind getrennt. |
| V143-T010 | Soak-Metriken | V143-MUST-010 | Soak: illegale Actions, Timeouts, Fallbacks, Winrate, Agenda und Replayfehler werden gemessen. |
| V143-T011 | Exploit-Fixtures | V143-MUST-011 | Regression: Exploitfälle bleiben dauerhaft testbar. |
| V143-T012 | DecisionDebug | V143-MUST-012 | Redaction-Test: gespeicherte Debugs leaken keine Hidden Info. |
| V143-T013 | Tuning-Gate | V143-MUST-013 | Review-Test: Verbesserung oder Tradeoff ist dokumentiert. |

## No-Scope-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V143-T014 | Keine Kartenfreigabe | V143-MUST-014 | Catalog/Manifest-Test: keine neue Karte wird spielbar oder `ai_supported`. |
| V143-T015 | Keine Public-Funktionen | V143-MUST-015 | No-Scope-Regression: keine Public-Replay-, Spectator-, Account-, Ranking- oder Turnierfläche. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- gezielte AI-, Simulation-, Hidden-Info-, Artifact- und No-Scope-Tests

## Gate-Auswertung

V1.4.3 darf finalisiert werden, wenn der definierte Soak 0 illegale KI-Aktionen, 0 Hidden-Info-Leaks und nachvollziehbare Metriken liefert.
