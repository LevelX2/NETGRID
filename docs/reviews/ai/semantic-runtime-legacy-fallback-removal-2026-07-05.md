# Semantic Runtime Legacy-Fallback-Removal 2026-07-05

## Status

`done`

## Ergebnis

Der normale produktive KI-Pfad nutzt keine stille Legacy-Rettung mehr:

- Server-Preview und `advance_ai` führen keine Ersatzaction mehr aus, wenn `AiDecision.actionId` nicht in den aktuellen Engine-`LegalActions` enthalten ist. Beide stoppen sichtbar mit `ai_decision_action_not_legal`.
- `packages/ai/src/runtime/semantic-runtime.ts` kennt keinen Legacy-Provider und keinen `NETGRID_SEMANTIC_AI_RUNTIME=legacy`-Notaus mehr. Der Runtime-Core bewertet nur vorhandene `LegalActions`.
- `chooseCorpAction` und `chooseRunnerAction` geben im Default keinen Legacy-Provider mehr an die Semantic Runtime weiter.
- Practical Micro darf nur bei explizitem Opt-in einen Legacy-Provider als Vergleichsreferenz erhalten; ohne Opt-in bleibt auch dieser Pfad rein semantisch.
- Der explizite Notaus `NETGRID_SEMANTIC_AI_RUNTIME=legacy` liegt an der Public-/Compatibility-Fassade und ist sichtbar über Evidence `semantic_runtime_force_legacy`.
- `semantic_coverage_fallback` bleibt erlaubt, aber nur als sichtbares Review-Signal auf vorhandene `LegalActions`; es ist kein Legacy-Fallback.

## Architekturgrenze

Verboten im produktiven Normalpfad:

- `runtime/semantic-runtime.ts -> legacy/**`
- `runtime/semantic-runtime-decision-context.ts -> legacy/**`
- Server-Preview oder Server-Ausführung mit einer anderen Action als `decision.actionId`
- stilles Ausführen von `fallback.first_legal_action` als Ersatz für eine unbekannte KI-Action

Erlaubte Legacy-Flächen bleiben eng begrenzt:

- `runtime/ai-action-entrypoints.ts` für den expliziten Legacy-Notaus und opt-in Practical-Micro-Vergleich
- `runtime/ai-action-entrypoints-composition.ts`, `runtime/runner-baseline-support-composition.ts` und `runtime/semantic-runtime-action-exclusion-composition.ts` als aktuelle Kompatibilitätsfassaden
- `legacy/**`, Simulation, Fixtures, Benchmarks und historische öffentliche Baseline-Exports als Vergleichs- oder Regressionsebene

## Zusätzliche Härtung

Beim Entfernen der stillen Legacy-Rettung wurde ein bestehender Semantic-Score-Konflikt sichtbar: Eine normale, contestable HQ-Agenda-Relief-Installation konnte trotz sicherer Economy-Alternative bevorzugt werden. Die HQ-Agenda-Relief-Abschwächung der contestable Remote-Penalty gilt jetzt nur noch bei `near_win`-Steal-Schwere. Normale Steal-Schwere bleibt dadurch ein echter Defer-Fall.

## Guards

- `packages/ai/src/runtime/ai-action-entrypoints.test.ts` prüft, dass Default-`chooseCorpAction` und Default-`chooseRunnerAction` keinen Legacy-Provider an den Semantic-Context geben.
- `packages/ai/src/decision/module-boundaries.test.ts` erlaubt Runtime-Imports aus `legacy/**` nur noch in explizit gelisteten Kompatibilitätsfassaden.
- `apps/server/src/multiplayer.test.ts` prüft, dass Preview und `advance_ai` bei unbekannter KI-Action keine Ersatzaction anzeigen oder ausführen.
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts` hält `semantic_coverage_fallback` als sichtbares Review-Signal und den contestable Remote-Defer-Fall fest.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts --testNamePattern "unknown|substitute|enabled AI decision traces|advance_ai"`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts src/decision/module-boundaries.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/ai-action-entrypoints.test.ts src/decision/module-boundaries.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Nicht geändert

- Keine Engine-Regeln, keine neue LegalAction-Erzeugung.
- Keine `applyAction`-, Replay-, StateHash-, Randomness-, PlayerView- oder Hidden-Info-Vertragsänderung.
- Legacy-Code wurde nicht pauschal gelöscht; er bleibt nur für explizite Compatibility-, Fixture-, Simulation- und Benchmark-Flächen vorhanden.
