# V1.4.1 Implementation Review - Planbasierte Runner-KI

Stand: 2026-05-08
Status: implemented

## Scope

V1.4.1 wurde nach grünem V1.4.0-Final-Gate umgesetzt. Der Release hebt die Runner-KI auf eine planbasierte AI-Level-2-Bewertung für Run-, Rig-, Economy-, Remote-Contest-, Asset-Trash- und Safe-Probe-Entscheidungen.

## Umgesetzt

- Runner-Planmodell in `packages/ai/src/runner-plans.ts` mit `RunnerPlanKind`, `RunnerPlanCandidate`, `RunnerPlanStep`, `RunnerPlanScore`, `RunnerPlanDecision` und side-sicherem `RunnerPlanDebug`.
- Planarten `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset` und `safe_probe_run`.
- Evaluatoren `RunnerRig`, `RunCost`, `ServerAccessValue`, `RemoteThreat` und `CorpScoringThreat`.
- Runner-Entscheidungsintegration in `chooseRunnerAction`; reaktive Spezialfenster wie Choice, Access, Steal, Breaker-Pump/Break und Tag-Remove bleiben auf der bestehenden Heuristik.
- `chooseRunnerBaselineAction` als alte Runner-Heuristik für Vergleichsbenchmarks.
- DecisionDebug mit expliziter Unsicherheit für unbekannte Korp-Karten statt Hidden-Info-Behauptungen.
- Versionierte Planprofile in `data/ai/runner-plan-profiles-1.4.1.json`.
- Benchmark- und Szenarioartefakte in `data/reports/ai-runner-plan-benchmark-1.4.1.json` und `data/scenarios/ai-v141-runner-plan-smokes.json`.

## Requirements-Abgleich

| Bereich | Ergebnis |
| --- | --- |
| V1.4.0-Gate | pass: `docs/derived/V1_4_0_FINAL_REVIEW.md` ist grün und V1.4.1 wurde erst danach begonnen. |
| Planmodell und Planarten | pass: alle acht Runner-Planarten sind modelliert und über Tests/Szenarien abgedeckt. |
| LegalActions-Vertrag | pass: Kandidaten referenzieren nur aktuelle `input.legalActions`; Fallback wählt ausschließlich legale Actions. |
| Evaluatoren | pass: RunnerRig, RunCost, ServerAccessValue, RemoteThreat und CorpScoringThreat sind eigene deterministische Funktionen. |
| Jack-out, Access, Trash | pass: Jack-out wird als Safe-Probe-Plan bewertet; Access-Trash nutzt `trash_asset`. |
| DecisionDebug | pass: Debug enthält Plan-ID, Planart, Score, Confidence, sichtbare Gründe, Unsicherheit, Fallback, Seed, Profil und Zeitbudget. |
| Hidden-State-Invariance | pass: gleiche Runner-sichtbare Projektion erzeugt gleiche Planentscheidung. |
| AI-supported-Gate | pass: Planrollen werden nur aus AI-supported Runtime-Karten abgeleitet; human-only Karten werden nicht strategisch vorausgesetzt. |
| Smokes | pass: Runner-KI läuft gegen Basic Corp und planbasierte Corp; V1.4.0-Corp-Plan-KI regressiert nicht. |

## Tests

- `corepack pnpm --filter @netgrid/ai test`: pass, 50 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: pass.

Die vollständigen Pflichtchecks sind im Final Review dokumentiert.

## No-Scope-Bestätigung

Keine neuen Karten, keine neuen Mechaniken, kein Kartentextparser, kein Belief State, keine FullState-Simulation, kein LLM-Regelakteur, keine offiziellen Assets und keine Public-Plattformfunktionen wurden eingeführt.

