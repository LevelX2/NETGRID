# AI-COMPLETE-20 Full Holdout Gate B 2026-06-29

## Lauf

```text
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-ps2-play-strength-gate.ts --out docs/reviews/ai/ai-complete-20-full-holdout-gate-b-2026-06-29.json --pairs a,b,c,d --max-actions 160
```

## Zweiter Abschlussaudit

Dieser Lauf wiederholt das volle A-D-Gate aus `ai-complete-20-full-holdout-gate-2026-06-29.json` in ein eigenes Artefakt.

| Prüfung | Ergebnis |
| --- | --- |
| Spiele gesamt | 75 |
| Entscheidungen gesamt | 9477 |
| IllegalActions | 0 |
| ReplayFailures | 0 |
| Action-Limits | 0 |
| Redaction-Failures | 0 |
| Why-Coverage Missing Signals | 0 |
| Dominance Failures | 0 |
| Max Action-Type Top Share | 0.253 |
| Decision-Evidence identisch mit Audit A | ja |
| Scenario-Aggregate identisch mit Audit A | ja |

## Gate-Entscheidung

| Feld | Wert |
| --- | --- |
| `safetyGreen` | true |
| `practicalMetricBetter` | true |
| `runnerMetricBetter` | true |
| `corpMetricBetter` | true |
| `mergeAllowed` | false |
| `recommendation` | `keep_default_off` |

## Bewertung

AI-COMPLETE-20 ist mit zwei unabhängigen Full-Holdout-Läufen belegt:

- Safety: 0 IllegalActions, 0 ReplayFailures, 0 Action-Limits.
- Hidden-Info/Redaction: alle Leg-Aggregate redaction-safe.
- Action-Type-Dominanz: alle Leg-Berichte `complete`, maximale Top-Share 0.253.
- Erklärbarkeit: alle Why-Coverage-Berichte `complete`, 0 Missing-Signale.
- Praktische Qualität: Candidate Runner verbessert Runner-Steals von 35 auf 54; Candidate Corp verbessert Corp-Scores von 18 auf 23.

Der Default-Cutover bleibt bewusst gesperrt, weil `mergeAllowed=false` und `recommendation=keep_default_off` melden. Das widerspricht AI-COMPLETE-20 nicht: Das Ziel verlangt Safety-/Qualitäts-/Erklärbarkeitsbelege, keinen Default-Cutover.
