# AI Play-Strength Decision Spine Preflight 2026-06-11

## Status

`passed`

Paket: `AI-PLAY-0`

Branch: `codex/ai-play-strength-decision-spine`

Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_DECISION_SPINE`

## Ausgangsstand

Start-Commit nach Prozessartefakt:

```text
920d8292 docs(ai): define play strength decision spine process
```

Basis von `main`:

```text
ca40ebe0 Hide Forged Activation Orders without unrezzed ICE
```

Der erste Testaufruf im neuen Worktree scheiterte nicht fachlich, sondern wegen fehlendem `node_modules`. `corepack pnpm install` wurde im Worktree ausgeführt; danach war der Preflight grün.

## Checks

Grün:

```bash
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Ergebnis:

- `@netgrid/ai test`: 55 Testdateien, 1057 Tests bestanden.
- `@netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.

## Strukturinventar

`packages/ai/src/index.ts` hat aktuell 35311 Zeilen.

Relevante Restblöcke in `index.ts`:

- `chooseAiAction` und Runtime-Verdrahtung um Zeile 3282.
- `semanticRuntimeDecisionDebug` um Zeile 3748.
- `simulateAiGame`, `simulateAiSoak`, Benchmark- und Reporting-Helfer ab etwa Zeile 10942.
- `decisionFromChoices` um Zeile 12886.
- `scoreActions` um Zeile 14738.

Relevante bestehende AI-Bausteine für den Decision-Spine:

- `ActionSemanticCandidate`: `packages/ai/src/action-semantic-candidate.ts`
- Action-Coverage und Invarianten: `packages/ai/src/actions/action-semantic-coverage.ts`, `packages/ai/src/actions/action-semantic-invariants.ts`
- Runtime-Ranking: `packages/ai/src/runtime/semantic-choice-ranking.ts`
- Runtime-Orchestrierung: `packages/ai/src/runtime/semantic-runtime.ts`
- Runner-Ziele und Run-Bewertung: `packages/ai/src/runner-tactical-goals.ts`, `packages/ai/src/runner-run-target-evaluation.ts`
- TacticalPlans: `packages/ai/src/tactical-plans.ts`
- bestehende TacticalGoal-Diagnostik: `packages/ai/src/action-doctrine-goal-diagnostics.ts`

## Schluss

AI-PLAY-1 kann auf einem grünen, sauberen Stand beginnen. Der Prozess bleibt innerhalb der harten Leitplanken: keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
