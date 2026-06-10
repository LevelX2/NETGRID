# AI Source Structure Reorg STRUCT-0 Preflight 2026-06-10

## Status

`baseline_checked_with_known_red_tests`

Arbeitsbranch: `codex/ai-source-structure-reorg`

Prozessartefakt: `docs/architecture/ai/ai-source-structure-reorg-automation-process-2026-06-10.md`

## Scope

STRUCT-0 prüft den Ausgangszustand von `@netgrid/ai`, bevor produktive Strukturänderungen an AI-Code beginnen.

Bis zu diesem Preflight wurden keine AI-Code-Dateien verändert. Der einzige Commit vor den Checks war das Prozessartefakt.

## Ausgeführte Checks

```bash
corepack pnpm install
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai test
```

## Ergebnis

`corepack pnpm install` war im neuen Worktree erforderlich, weil dort zunächst keine `node_modules` vorhanden waren und `tsc` dadurch nicht gefunden wurde. Die Installation war lockfile-stabil.

`corepack pnpm --filter @netgrid/ai typecheck` ist grün.

`corepack pnpm --filter @netgrid/ai test` ist rot mit 7 Fehlern in `packages/ai/src/index.test.ts` bei 50 bestandenen Testdateien und 1018 bestandenen Tests.

Fehlende Tests:

- `V1.4.1 plan-based Runner AI > trashes a relevant affordable remote economy asset after access`
- `V1.4.1 plan-based Runner AI > trashes an affordable scoring-protection upgrade after remote access`
- `V1.4.1 plan-based Runner AI > declines a low-value remote trash when credits are better preserved`
- `V1.4.1 plan-based Runner AI > runs King of the Road side-safe smokes with legal Runner plans`
- `uses Semantic Runtime actual actions in DecisionDebug instead of legacy plan winners`
- `runs V0.8 starter decks through side-safe AI smokes`
- `adds side-safe evidence and quality metrics to V0.8 simulations`

## Einordnung

Diese roten Tests sind als Ausgangsabweichung klassifiziert, nicht als Regression der Strukturarbeit:

- Vor dem Testlauf lag keine produktive Codeänderung im AI-Paket vor.
- Der Typecheck ist grün.
- Die Fehler liegen gesammelt in `index.test.ts`, das laut Review ausdrücklich als zu großer Legacy-/Runtime-/Simulation-Sammeltest gilt.

## Fortsetzungsregel

Die weiteren Pakete laufen mit den im Prozessartefakt definierten fokussierten Checks. Falls ein fokussierter Paketcheck rot wird, wird er paketlokal behandelt und nicht auf diese Baseline-Abweichung geschoben.

Der vollständige `@netgrid/ai`-Testlauf bleibt bis zur späteren Paketarbeit beziehungsweise bis STRUCT-7 als bekannte rote Baseline dokumentiert.
