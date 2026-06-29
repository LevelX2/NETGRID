# AI-COMPLETE-18 Why-Coverage Smoke 2026-06-29

## Scope

- Quelle: `docs/reviews/ai/ai-complete-18-why-coverage-smoke-2026-06-29.json`
- Script: `scripts/run-ai-selfplay-trace-matrix.ts`
- Pair: `A`
- Seeds: `ai-complete-18-why-smoke-001`
- Max actions: `20`
- ActionAlternative snapshots: enabled, max `3` per finding
- Runtime effect: none; report-only smoke.

## Result

| Metric | Value |
| --- | ---: |
| Games | 1 |
| Decisions | 20 |
| Illegal actions | 0 |
| Replay failures | 0 |
| Redaction safe | 1 |
| Why-Coverage audit status | `complete` |
| Decisions requiring WhyNot | 2 |
| Decisions missing top-level WhyNot | 0 |
| Decisions missing Runtime WhyNot section | 0 |
| Selected ActionAlternatives missing WhyChosen | 0 |
| Non-selected ActionAlternatives missing WhyNot | 0 |
| Missing coverage signals | 0 |

## Interpretation

Der Smoke belegt fuer ein kleines reales Selfplay-Fenster, dass die neue Why-Coverage-Pipeline Top-Level-WhyNot, Runtime-WhyNot-Sections, ausgewaehlte WhyChosen-Fakten und nicht ausgewaehlte WhyNot-Fakten ohne Missing-Signale transportiert. Die Funde im Lauf bleiben normale Spielqualitaets-/Action-Limit-Diagnostik und sind kein Hidden-Info-, IllegalAction- oder Replay-Befund.

## Verification

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai-complete-18-why-coverage-smoke-2026-06-29.json --pairs a --seeds ai-complete-18-why-smoke-001 --max-actions 20 --include-action-alternatives --max-alternatives-per-finding 3`
