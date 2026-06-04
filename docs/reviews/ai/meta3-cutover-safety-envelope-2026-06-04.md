# META 3 Cutover Safety Envelope

Stand: 2026-06-04
Status: complete

## Ziel

META 3 bereitet Cutover technisch als Sicherheitsvertrag vor, führt ihn aber nicht aus.

## Ergebnis

Definiert wurden:

- Cutover-Gate:
  - `cutoverDesignAllowed = true`
  - `cutoverExecutionAllowed = false`
  - `productiveCutoverAllowed = false`
- `SemanticAiControlFlags` mit default-off Shadow, Cutover, Agreement-only und Scoped Override.
- `semanticAiRollbackForceLegacy = true` als Default.
- Rollback-Trigger für illegale Semantic-IDs, Hidden-Info, Engine Reject, Non-Determinism, Missing Trace, Runtime Mutation, Public Payload Delta und Cost-/Timing-Gaps.
- Scope Matrix für Agreement-only, testinterne Overrides und blockierte Scopes.
- Adaptervertrag: Semantic darf nur `actionId` aus Engine-`LegalActions` referenzieren; `actualActionId` bleibt in META 3 immer `legacyActionId`.
- Developer-only Trace/Audit Contract.

## Quality Gates

| Gate | Ergebnis |
| --- | --- |
| Produktive Flags default off | pass |
| RollbackForceLegacy default true | pass |
| Adapter erzeugt keine Actions | pass |
| Trace developer-only | pass |
| `cutoverExecutionAllowed` | false |
| `actualDecision` | Legacy |
| Public Payload Delta | 0 |
| Illegal semantic decisions | 0 |
| Hidden-info violations | 0 |
| Engine rejects | 0 |

## Verifikation

```text
node scripts/check-meta3-cutover-safety-envelope.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Nächster Schritt

META 4 darf den Agreement-only Runtime Canary modellieren. Verhalten bleibt identisch, weil nur gleiche Legacy-/Semantic-Action-IDs bestätigt werden dürfen.
