# AI156 Semantic Endgame Scorecard v1

Datum: 2026-06-12

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

## Ziel

AI156 ergänzt eine Spielstärke-Scorecard, damit künftige Pakete nicht allein `actionLimitReached` optimieren. Die Scorecard verbindet Safety, Trace-Stabilität, Progress-Konversion, Coverage-/Tempo-Shadow-Signale und den same-state Proof-Stand.

## Safety Summary

| Metrik | x10 |
| --- | ---: |
| IllegalActions | 0 |
| Replay-Failures | 0 |
| Critical Findings | 0 |
| Redaction-safe | 1 |

## Trace-Metriken

| Metrik | x5 | x10 |
| --- | ---: | ---: |
| Spiele | 20 | 40 |
| Entscheidungen | 2492 | 5178 |
| Action-Limits | 11 | 23 |
| Action-Limit-Rate | 55.00% | 57.50% |
| Repeated No-Progress Run | 33 | 56 |
| Unsafe Score Chosen | 4 | 7 |
| Passive Action With Score Line Available | 7 | 14 |
| Average Game Length | 124.6 | 129.45 |
| Runner Steals | 28 | 49 |
| Corp Scores | 13 | 23 |
| Corp Flatlines | 5 | 10 |

## Semantik-Metriken

| Metrik | Wert |
| --- | ---: |
| Stale-No-Progress-Anteil | 32.94% |
| Progress-Conversion-Rate | 53.17% |
| Coverage-Completion-Rate | 66.67% |
| Corp-Tempo-Conversion-Rate | 100.00% |
| Same-State Challenger-Proof-Rate | 0.00% |
| Same-State Match-Rate | 0.00% |

## Interpretation

Safety bleibt grün, aber die same-state Proof-Rate ist 0.00%. Das ist die maßgebliche Grenze für Runtime-Arbeit: Die Shadow-Signale zeigen konkrete Coverage- und Corp-Tempo-Pfade, aber kein produktiver Cutover darf daraus ohne same-state LegalAction-Beweis abgeleitet werden.

## Quellen

- `docs/reviews/ai/ai132-progress-delta-labeler-2026-06-12.json`
- `docs/reviews/ai/ai148-final-a-d-5seed-2026-06-12.json`
- `docs/reviews/ai/ai148-final-a-d-10seed-2026-06-12.json`
- `docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.json`
- `docs/reviews/ai/ai152-runner-coverage-solver-shadow-2026-06-12.md`
- `docs/reviews/ai/ai153-corp-tempo-converter-shadow-2026-06-12.md`

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai156-semantic-endgame-scorecard-v1.ts`
- `git diff --check`
