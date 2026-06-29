# AI-COMPLETE-18 Why-Coverage Smoke B 2026-06-29

## Scope

- Quelle: `docs/reviews/ai/ai-complete-18-why-coverage-smoke-b-2026-06-29.json`
- Script: `scripts/run-ai-selfplay-trace-matrix.ts`
- Pair: `B`
- Seeds: `ai-complete-18-why-smoke-b-001`
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
| Decisions requiring WhyNot | 3 |
| Decisions missing top-level WhyNot | 0 |
| Decisions missing Runtime WhyNot section | 0 |
| Selected ActionAlternatives missing WhyChosen | 0 |
| Non-selected ActionAlternatives missing WhyNot | 0 |
| Missing coverage signals | 0 |

## Interpretation

Der zweite, unabhaengige Smoke belegt dieselbe Why-Coverage-Eigenschaft fuer ein anderes Deck-Pair: Alle Entscheidungen mit erkennbaren Alternativen besitzen die erwarteten WhyNot-/WhyChosen-Signale, und es gibt keine Missing-Coverage-Signale. Die Lauf-Findings bleiben Spielqualitaets-/Action-Limit-Diagnostik ohne IllegalAction-, Replay- oder Redaction-Befund.

## Verification

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai-complete-18-why-coverage-smoke-b-2026-06-29.json --pairs b --seeds ai-complete-18-why-smoke-b-001 --max-actions 20 --include-action-alternatives --max-alternatives-per-finding 3`
