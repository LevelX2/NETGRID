# AI180 Final Opportunity Snapshot Sweep

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI180 schließt AI170 bis AI180 mit finalen x5-/x10-Traces und vollständigen lokalen Gates ab. Da AI177 alle Shadow-Kandidaten blockiert und AI178 No-Go ist, bleibt der Runtime-Pfad unverändert.

## Sweep-Ergebnis

| Sweep | Games | Action Limits | Illegal Actions | Replay Failures | Hidden-Info Marker | Redaction Safe | Avg Length | Corp Scores | Runner Steals | Flatlines |
| --- | ---: | ---: | ---: | ---: | ---: | --- | ---: | ---: | ---: | ---: |
| x5 | 20 | 11 | 0 | 0 | 0 | ja | 124.6 | 13 | 28 | 5 |
| x10 | 40 | 23 | 0 | 0 | 0 | ja | 129.45 | 23 | 49 | 10 |

## Blockabschluss

| Paket | Ergebnis |
| --- | --- |
| AI170 | 17/19 Opportunity-Snapshots verfügbar, 2/2 AI159-TargetContext-missing-Fälle abgedeckt |
| AI171 | 3 redigierte Opportunity-Fixtures |
| AI172 | 6 read-only Goal-Conversion-Contracts, 27 stale Intents klassifiziert |
| AI173 | 13 Runner-Coverage-Fälle, 1 shadow-only Kandidat |
| AI174 | 20 stale Corp-Punish-Fälle klassifiziert |
| AI175 | 17 Corp-/mixed-Fälle, 2 shadow-only Kandidaten |
| AI176 | Scorecard v3 mit Snapshot-, Intent-, Solver- und Cutover-Metriken |
| AI177 | 3 Kandidaten geprüft, 0 Gate-pass |
| AI178 | No-Go, kein Runtime-Cutover |
| AI179 | Catalog-Data-Test stabilisiert, Assertions unverändert |

## Schluss

Der Block beseitigt den AI159-Hauptblocker teilweise: Opportunity-State-Snapshots sind jetzt redaction-sicher verfügbar. Er führt aber bewusst keinen Runtime-Cutover ein, weil die Snapshot-Evidence noch keine stabile same-state `actionId` plus Zielidentität enthält. Der nächste fachlich zulässige Schritt ist eine noch engere Snapshot-Instrumentierung dieser Felder, nicht Scoring oder Heuristik.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai180-final-a-d-5seed-2026-06-13.json --max-actions 160 --max-findings 50`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai180-final-a-d-10seed-2026-06-13.json --seeds ai-v143-tuning-001,ai-v143-tuning-002,ai-v143-tuning-003,ai-v143-tuning-004,ai-v143-tuning-005,ai-v143-tuning-006,ai-v143-tuning-007,ai-v143-tuning-008,ai-v143-tuning-009,ai-v143-tuning-010 --max-actions 160 --max-findings 50`
- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- `git diff --check`
