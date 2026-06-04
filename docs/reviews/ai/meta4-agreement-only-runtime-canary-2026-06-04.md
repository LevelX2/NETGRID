# META 4 Agreement-only Runtime Canary

Stand: 2026-06-04
Status: complete

## Ziel

META 4 definiert einen Agreement-only Canary: Semantic darf nur bestätigen, wenn `semanticActionId == legacyActionId` gilt und alle Gates bestanden sind. Verhalten bleibt identisch.

## Ergebnis

Der Canary-Harness prüft sieben Pflichtfälle:

- Default config führt Legacy aus.
- Same action wird nur als Confirmation gezählt.
- Semantic differs führt Legacy aus.
- Semantic not in LegalActions führt Legacy aus.
- Hidden-info blocked führt Legacy aus.
- Rollback true führt Legacy aus.
- Missing trace führt Legacy aus.

Da eine Same-Action-Confirmation dieselbe `actionId` wie Legacy nutzt, bleibt `behaviorDeltaCount = 0`.

## Quality Gates

| Gate | Ergebnis |
| --- | --- |
| `behaviorDeltaCount` | 0 |
| `actualDecisionOverrideCount` | 0 |
| Semantic differing action never executes | pass |
| `engineRejectCount` | 0 |
| `hiddenInfoViolationCount` | 0 |
| `traceCompleteRate` | 100 % |
| Rollback tested | pass |
| Default config Legacy-only | pass |

## Verifikation

```text
node scripts/check-meta4-agreement-only-runtime-canary.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Nächster Schritt

META 5 darf test/internal-only Scoped Override modellieren. Produktive Flags bleiben aus und unsafe divergences blockieren.
