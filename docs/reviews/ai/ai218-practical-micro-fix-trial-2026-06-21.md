# AI218 Practical Micro-Fix Trial

Datum: 2026-06-21

## Lauf

Baseline:

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai218-practical-micro-baseline-a-d-5seed-2026-06-21.json --max-actions 160 --max-findings 50
```

Apply:

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai218-practical-micro-apply-a-d-5seed-2026-06-21.json --max-actions 160 --max-findings 50 --practical-micro-runtime apply
```

## Ergebnis

| Metrik | Baseline | Apply |
|---|---:|---:|
| Spiele | 20 | 20 |
| Entscheidungen | 2492 | 2492 |
| Action-Limit | 11 | 11 |
| Findings | 836 | 836 |
| Repeated no-progress run | 35 | 35 |
| Unsafe score chosen | 4 | 4 |
| Passive action with scoreline available | 7 | 7 |
| Illegal actions | 0 | 0 |
| Replay failures | 0 | 0 |
| Redaction safe | true | true |
| Practical-micro markierte Aktionen | 0 | 0 |

## Schluss

Der Trial ist sicher, aber wirkungslos. Die Apply-Regeln wurden im A-D-5seed-Lauf nicht aktiv. Damit gibt es keine belastbare praktische Verbesserung und keinen Cutover-Grund.

