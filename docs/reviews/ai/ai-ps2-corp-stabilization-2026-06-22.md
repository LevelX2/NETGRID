# AI-PS2 Corp Practical Tactic Stabilization

Datum: 2026-06-22

## Änderung

AI-PS2-2 begrenzt den Corp-Score-Eingriff des Practical-Tactic-Overlays:

- `corp_safe_score` wählt `score_agenda` nur noch bei explizit side-safe
  markiertem Score-Fenster.
- Zulässige Signale sind `safeScoreWindow`, `protectedRemoteReady` oder ein
  klares Safe-/Protected-Score-Label.
- Unmarkierte Score-Fenster bleiben beim Runtime-Referenzpfad.

Damit wird der zu breite Score-Eingriff reduziert, der im verbreiterten
Preflight-Lauf für Candidate-Corp nicht stabil besser war.

## Checks

```text
corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-tactic-overlay.test.ts src/evaluation/practical-tactic-benchmark.test.ts
corepack pnpm --filter @netgrid/ai run typecheck
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-ps2-corp-stabilization-gate-2026-06-22.json --pairs a --seeds ai-v143-tuning-001 --max-actions 80
git diff --check
```

## Ergebnis

| Selector | Trefferquote |
|---|---:|
| Frozen Legacy | 0/40 |
| Practical Tactic Overlay | 40/40 |

Kleiner Gate-Lauf:

| Metrik | Legacy | Candidate Runner | Candidate Corp |
|---|---:|---:|---:|
| Spiele je Leg | 2 | 2 | 2 |
| Action-Limits | 1 | 1 | 2 |
| Runner Steals | 3 | 4 | 3 |
| Corp Scores | 1 | 1 | 0 |
| IllegalActions | 0 | 0 | 0 |
| ReplayFailures | 0 | 0 | 0 |

## Entscheidung

Die Änderung bleibt mergefähig als Stabilisierung des opt-in-Kandidaten. Sie
liefert keine eigenständige Corp-Promotion und rechtfertigt keinen
Default-Cutover.
