# V1.4.0 Test Matrix - Planbasierte Corp-KI

Stand: 2026-05-08
Status: eingefroren

## Planmodell- und Evaluator-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V140-T001 | Abhängigkeit | V140-MUST-001 | Review/Test-Setup: V1.3.1-Final-Gate ist grün. |
| V140-T002 | Planmodell | V140-MUST-002, V140-MUST-003 | AI-Test: PlanCandidates referenzieren nur aktuelle LegalActions. |
| V140-T003 | applyAction Gate | V140-MUST-004 | Engine/AI-Test: ausgeführte Aktion wird normal revalidiert. |
| V140-T004 | Inputvertrag | V140-MUST-005, V140-MUST-006 | Hidden-Info-Test: AIInput enthält keinen FullState und keine Runner-Hidden-Daten. |
| V140-T005 | Difficulty | V140-MUST-007 | AI-Test: Difficulty ändert Scores/Planbreite, nicht Inputdaten. |
| V140-T006 | Planarten | V140-MUST-008 | AI-Test: alle sieben Planarten können in Fixtures erzeugt oder begründet übersprungen werden. |
| V140-T007 | Evaluatoren | V140-MUST-009 bis V140-MUST-014 | Unit-Tests für AgendaRisk, ServerThreat, EconomyReserve, IceRez, ScoringWindow und RemoteIntentMemory. |

## Karten-, Hints- und DecisionDebug-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V140-T008 | Card Roles | V140-MUST-015 | AI-Test: Rollen stammen aus validierten Hints/Card-Role-Daten. |
| V140-T009 | AI-supported Gate | V140-MUST-016 | AI-Test: nicht AI-supported Karten werden nicht strategisch vorausgesetzt. |
| V140-T010 | DecisionDebug | V140-MUST-017 | Redaction-Test: Debug nennt Plan und sichtbare Gründe, aber keine Hidden Info. |
| V140-T011 | Fallback | V140-MUST-018 | Timeout-/NoPlan-Test: legaler Fallback ohne Hänger. |

## Szenario-, Benchmark- und Soak-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V140-T012 | Score Now | V140-MUST-019 | Szenario: Corp scored, wenn LegalAction und Risiko klar sind. |
| V140-T013 | Score Next Turn | V140-MUST-019 | Szenario: Corp bereitet Score vor, statt zufällig zu klicken. |
| V140-T014 | Remote Build | V140-MUST-019 | Szenario: Corp baut schützbaren Scoring-Remote. |
| V140-T015 | HQ/R&D-Schutz | V140-MUST-019 | Szenario: Corp schützt bedrohten Zentralserver. |
| V140-T016 | Economy Recovery | V140-MUST-019 | Szenario: Corp priorisiert Wirtschaft bei niedrigen Credits. |
| V140-T017 | Baseline | V140-MUST-020 | Benchmark: Vergleich gegen alte Corp-KI mit dokumentierten Metriken. |
| V140-T018 | Soak | V140-MUST-021 | Soak: keine illegalen Actions, Timeouts, Hänger, Replay-Fehler oder Leaks. |
| V140-T019 | Spielbarkeit | V140-MUST-022 | Human-vs-Corp-KI und KI-vs-KI-Smoke. |

## No-Scope-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V140-T020 | Runner bleibt alt | V140-MUST-023 | Regression: Runner-KI nutzt kein neues Planmodell. |
| V140-T021 | No-Scope | V140-MUST-024 | Regression: keine Karten, Mechaniken, Belief State, FullState-Simulation oder LLM-Akteur. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte AI-, Hidden-Info-, Simulation-, Server- und Web-Pacing-Tests

## Gate-Auswertung

V1.4.0 darf finalisiert werden, wenn:

- Corp-Pläne nur LegalActions referenzieren,
- DecisionDebug side-sicher ist,
- definierte Corp-Szenariometriken besser oder nachvollziehbar stabil sind,
- Fallbacks legal bleiben,
- alte Human-vs-KI- und KI-vs-KI-Flows nicht hängen,
- kein zusätzlicher Hidden-Info-Zugriff entsteht.
