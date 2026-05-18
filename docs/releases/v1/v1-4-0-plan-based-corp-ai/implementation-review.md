# V1.4.0 Implementation Review - Planbasierte Corp-KI

Stand: 2026-05-08
Status: implemented

## Scope

V1.4.0 wurde nach grünem V1.3.1-Final-Gate umgesetzt. Der Release führt eine AI-Level-2-Planbewertung für die Corp ein. Planung bleibt Bewertung, nicht Regelautorität: Die ausgeführte Aktion ist weiterhin eine normale `LegalAction`/`PlayerAction`, die von `applyAction` erneut validiert wird.

## Umgesetzt

- Planmodell in `packages/ai/src/corp-plans.ts` mit `CorpPlanKind`, `CorpPlanCandidate`, `CorpPlanStep`, `CorpPlanScore`, `CorpPlanDecision` und side-sicherem `CorpPlanDebug`.
- Planarten `score_now`, `score_next_turn`, `build_scoring_remote`, `protect_hq`, `protect_rnd`, `recover_economy` und `bait_runner`.
- Evaluatoren `AgendaRisk`, `ServerThreat`, `EconomyReserve`, `IceRez`, `ScoringWindow` und `RemoteIntentMemory`.
- Corp-Entscheidungsintegration in `chooseCorpAction`; reaktive Fenster wie Choice, Trace, Mandatory Draw, Rez, Resource-Trash und Purge bleiben auf der bewährten Heuristik.
- `chooseCorpBaselineAction` als alte Corp-Heuristik für Vergleichsbenchmarks.
- `AiDecision.decisionDebug` als optionaler side-sicherer Debug-Vertrag.
- Versionierte Planprofile in `data/ai/corp-plan-profiles-1.4.0.json`.
- Benchmark- und Szenarioartefakte in `data/reports/ai-corp-plan-benchmark-1.4.0.json` und `data/scenarios/ai-v140-corp-plan-smokes.json`.

## Requirements-Abgleich

| Bereich | Ergebnis |
| --- | --- |
| V1.3.1-Gate | pass: `docs/releases/v1/v1-3-1-card-data-pipeline-v2/final-review.md` ist grün und V1.4.0 wurde erst danach begonnen. |
| Planmodell und Planarten | pass: alle sieben Planarten sind modelliert und über Tests/Szenarien abgedeckt. |
| LegalActions-Vertrag | pass: Kandidaten referenzieren nur aktuelle `input.legalActions`; Fallback wählt ausschließlich legale Actions. |
| Evaluatoren | pass: AgendaRisk, ServerThreat, EconomyReserve, IceRez, ScoringWindow und RemoteIntentMemory sind eigene deterministische Funktionen. |
| DecisionDebug | pass: Debug enthält Plan-ID, Planart, Score, Confidence, sichtbare Gründe, Fallback, Seed, Profil und Zeitbudget ohne Karten-/FullState-Leaks. |
| Zeitbudget/Fallback | pass: Zero-Budget-Fallback wird getestet und bleibt legal. |
| AI-supported-Gate | pass: Planrollen werden nur aus AI-supported Runtime-Karten abgeleitet; human-only Karten werden nicht strategisch vorausgesetzt. |
| Benchmarks | pass: Planentscheidungen werden gegen `chooseCorpBaselineAction` verglichen und dokumentiert. |
| Smokes | pass: Human-vs-Corp-KI- und KI-vs-KI-Smokes laufen über die planbasierte Corp-KI. |
| Runner-KI | pass: Runner bleibt in V1.4.0 auf der bisherigen Heuristik ohne Plan-Debug. |

## Tests

- `corepack pnpm --filter @netgrid/ai test`: pass, 44 Tests.
- `corepack pnpm typecheck`: pass.

Die vollständigen Pflichtchecks sind im Final Review dokumentiert.

## No-Scope-Bestätigung

Keine neuen Karten, keine neuen Mechaniken, kein Kartentextparser, kein Belief State, keine FullState-Simulation, kein LLM-Regelakteur, keine offiziellen Assets und keine Public-Plattformfunktionen wurden eingeführt.

