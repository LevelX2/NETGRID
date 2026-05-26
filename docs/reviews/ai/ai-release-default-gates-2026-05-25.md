# AI Release Default Gates 2026-05-25

Status: Gate-Checkliste und Profilpolicy
Scope: Dokumentation und Testabsicherung, keine Profilumschaltung
Branch: `codex/ai-legal-action-diagnosis`

## Kurzfazit

Der aktuelle KI-Optimierungsstand ist aus Review-Sicht merge-würdig als Code- und Infrastrukturstand. Der Merge darf aber keinen automatischen Default-Wechsel auf `current_candidate` bedeuten. `belief_ai_v1_4_2` bleibt die stabile Benchmark-Baseline; `current_candidate` bleibt explizit auswählbar und profile-gated.

Dieser Slice ergänzt keine Strategie, keine Consumer-Anbindung und keine Hintdaten. Er sichert die Release-Entscheidung aus `ai-release-default-readiness-review-2026-05-25.md` durch eine kleine Test- und Gate-Dokumentation ab.

## Profilpolicy

| Profil                              | Rolle                           | Policy                                                                                  |
| ----------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------- |
| `belief_ai_v1_4_2`                  | stabile Benchmark-Baseline      | Bleibt Referenz/default für Release-Readiness-Vergleiche.                               |
| `current_candidate`                 | experimenteller Candidate       | Bleibt profile-gated und nur explizit auswählbar. Keine automatische Default-Promotion. |
| `basic_corp_ai` / `basic_runner_ai` | Regression/Smoke/Ablation-light | Nur Diagnose, nicht produktiver Default.                                                |
| `random_legal_bot`                  | Kontrollprofil                  | Nur Benchmark-/Regression-Kontext.                                                      |

Live-/DTO-Pfade ohne explizites Profil nutzen weiterhin difficulty-basierte v0.9-Profile wie `corp-ai-v0.9-normal` und `runner-ai-v0.9-normal`. Benchmarkpfade dürfen `current_candidate` weiterhin als Candidate vergleichen, solange die Baseline explizit oder implizit `belief_ai_v1_4_2` bleibt.

## Default-Prüfung

Geprüfte Pfade:

- `data/ai/ai-profiles-0.9.json`: enthält die v0.9 Live-/Difficulty-Profile, keinen `current_candidate`.
- `data/ai/ai-benchmark-profiles-1.4.3.json`: enthält `belief_ai_v1_4_2` und `current_candidate` als Benchmarkprofile.
- `packages/ai/src/index.ts`:
  - `buildAiDecisionInput` fällt ohne explizites Profil auf `${side}-ai-v0.9-${difficulty}` zurück.
  - `runDoctrineQualityBenchmark`, `runMatchProgressionBenchmark` und `runMatchProgressionBenchmarkSuite` vergleichen standardmäßig `belief_ai_v1_4_2` gegen `current_candidate`.
  - `current_candidate` wird im Simulation-/Benchmarkkontext nur über ControllerMode/Profile-Auswahl aktiv.
- `apps/server/src/multiplayer.ts`: Server-AI-Controller ohne explizites Profil nutzen weiterhin `${side}-server-ai-v0.9-${difficulty}`.

Neuer Test:

- `packages/ai/src/index.test.ts`: `keeps release-default profile policy stable`
  - prüft Live-AIInput-Defaults `corp-ai-v0.9-normal` und `runner-ai-v0.9-normal`;
  - prüft, dass `belief_ai_v1_4_2` und `current_candidate` als Benchmarkprofile vorhanden bleiben;
  - prüft, dass der Match-Progression-Benchmark ohne explizite Baseline/Candidate `belief_ai_v1_4_2` als Baseline und `current_candidate` als Candidate nutzt.

## Must-Pass für Merge

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- `git diff --check`

Bei Hint-/Catalog-Datenänderungen zusätzlich:

- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/catalog exec tsc -p tsconfig.json --noEmit`

8-Slot-Suite-Musts für Merge-Readiness:

- `illegalActions = 0`
- `replayFailures = 0`
- `timeoutRate = 0`
- Cheap-Remote-Safety `0/0`
- `basicCreditTakenWhileBetterAgendaEconomyAvailable = 0`
- `politicalOverthrowSkippedForBasicCredit = 0`
- keine Hidden-Info-/DTO-Verletzung

## Default-Promotion-Gates

`current_candidate` darf erst Default/Baseline werden, wenn ein expliziter Gate-Lauf diese Kriterien erfüllt oder Abweichungen bewusst akzeptiert:

- Gesamt-ActionLimitRate nicht schlechter als Baseline.
- Score+Steal pro Match nicht niedriger als Baseline.
- Nicht mehr als ein materiell schlechterer Holdout.
- Keine katastrophale Einzel-Slot-Regression.
- `runsStartedAgainstKnownUnaffordablePath` nicht schlechter als Baseline.
- Snapshot-Pressure-ActionLimit-Regressionssignal gelöst oder bewusst akzeptiert.
- Local-Pair-2-Warnsignal gelöst oder bewusst akzeptiert.
- Verbesserung über mindestens einen zusätzlichen Seed-Batch stabil.
- Consumer-Slices bleiben guardrail-stabil:
  - Scored-Agenda-Ontology,
  - BreakerProfile/CostProfile,
  - RemoteRole,
  - Tag/Punish.

## Merge-Readiness-Notiz

Der Branch ist auf Basis des aktuellen Reviews als Code-/Infrastructure-Merge-Kandidat geeignet. Ein Merge darf aber nur den Code- und Diagnose-/Gate-Stand integrieren, nicht das Default-Profil auf `current_candidate` umstellen.

Nach Merge soll gelten:

- `belief_ai_v1_4_2` bleibt stabile Vergleichsbasis.
- `current_candidate` bleibt explizit auswählbar.
- Benchmark- und Diagnosepfade dürfen Candidate weiter vergleichen.
- Holdout-Slots bleiben Diagnose, kein Tuning-Ziel.

## Nächste Entwicklungsblöcke

1. Local Pair 2 Terminal-Conversion-Diagnose.
2. Future-run/Future-encounter ICE Consumer.
3. weitere Benchmark-Hint-Ontology-Migration.
4. Corp Doctrine Deepening.
5. später OpponentSignals / Archetype Model.
