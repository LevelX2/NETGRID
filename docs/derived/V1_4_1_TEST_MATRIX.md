# V1.4.1 Test Matrix - Planbasierte Runner-KI

Stand: 2026-05-08
Status: eingefroren

## Planmodell- und Evaluator-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V141-T001 | Abhängigkeit | V141-MUST-001 | Review/Test-Setup: V1.4.0-Final-Gate ist grün. |
| V141-T002 | Planmodell | V141-MUST-002, V141-MUST-003 | AI-Test: Runner-Pläne referenzieren nur aktuelle LegalActions. |
| V141-T003 | applyAction Gate | V141-MUST-004 | Engine/AI-Test: ausgeführte Aktion wird normal revalidiert. |
| V141-T004 | Inputvertrag | V141-MUST-005, V141-MUST-006 | Hidden-Info-Test: AIInput enthält keinen FullState und keine verdeckten Corpkarten. |
| V141-T005 | Planarten | V141-MUST-007 | AI-Test: alle acht Runner-Planarten können in Fixtures erzeugt oder begründet übersprungen werden. |
| V141-T006 | Evaluatoren | V141-MUST-008 bis V141-MUST-012 | Unit-Tests für RunnerRig, RunCost, ServerAccessValue, RemoteThreat und CorpScoringThreat. |
| V141-T007 | Jack-out | V141-MUST-013 | Szenario: Jack-out wird als legale Risikoentscheidung bewertet. |
| V141-T008 | Asset Trash | V141-MUST-014 | Szenario: sichtbares Asset mit bekannten Trash-Kosten wird korrekt bewertet. |

## Hints-, Debug- und Pacing-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V141-T009 | AI-supported Gate | V141-MUST-015 | AI-Test: nicht AI-supported Runnerkarten werden nicht strategisch vorausgesetzt. |
| V141-T010 | DecisionDebug | V141-MUST-016 | Redaction-Test: Debug nennt Unsicherheit und keine verdeckten Korp-Titel. |
| V141-T011 | Fallback | V141-MUST-017 | Timeout-/NoPlan-Test: legaler Fallback ohne Hänger. |
| V141-T012 | Rez/Pacing | V141-MUST-018 | Server/Web-Test: Human-Corp-vs-Runner-KI wartet an Rezfenstern korrekt. |

## Szenario-, Benchmark- und Regressionstests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V141-T013 | R&D-Druck | V141-MUST-019 | Szenario: Runner erzeugt sinnvollen R&D-Druck. |
| V141-T014 | HQ-Druck | V141-MUST-019 | Szenario: Runner erzeugt HQ-Druck ohne echte HQ-Titel. |
| V141-T015 | Remote-Contest | V141-MUST-019 | Szenario: Runner contestet gefährlichen Remote. |
| V141-T016 | Rig-Aufbau | V141-MUST-019 | Szenario: Runner baut fehlende Breaker/MU/Economy auf. |
| V141-T017 | Economy Recovery | V141-MUST-019 | Szenario: Runner nimmt Credits statt schlechten Run. |
| V141-T018 | Safe Probe | V141-MUST-019 | Szenario: Runner nutzt günstigen Probe Run mit sichtbarer Unsicherheit. |
| V141-T019 | Sinnlose Runs | V141-MUST-020 | Negativfixture: Runner vermeidet klar schlechte Runs. |
| V141-T020 | KI-Smokes | V141-MUST-021 | Runner gegen Basic Corp und planbasierte Corp. |
| V141-T021 | Hidden Invariance | V141-MUST-022 | Zwei States mit gleicher Runner-Sicht erzeugen gleiche Entscheidung. |
| V141-T022 | Corp Regression | V141-MUST-023 | V1.4.0-Corp-Plan-Szenarien bleiben grün. |

## No-Scope-Tests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V141-T023 | No-Scope | V141-MUST-024 | Regression: kein Belief State, keine FullState-Simulation, keine neuen Karten/Mechaniken, kein LLM-Akteur. |

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e`
- gezielte AI-, Hidden-Info-, Run-/Pacing-, Simulation-, Server- und Web-Tests

## Gate-Auswertung

V1.4.1 darf finalisiert werden, wenn:

- Runner-Pläne nur LegalActions referenzieren,
- schlechte Runs in definierten Fixtures vermieden werden,
- Run-, Rig- und Remote-Contest-Szenarien besser oder nachvollziehbar stabil sind,
- Hidden-State-Invariance grün ist,
- Corp-Plan-KI nicht regressiert,
- Human-Corp-vs-Runner-KI-Pacing robust bleibt.
