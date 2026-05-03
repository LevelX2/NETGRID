# AI Soak Test 0.9 Spec

Status: Requirements Freeze
Stand: 2026-05-03

## Ziel

V0.9-Soaks prüfen KI-Qualität und Stabilität über mehrere Seeds, Decks, Matchups und Difficulties. Sie sind Regressionstests, keine Balancing-Garantie.

## Matrix

Pflichtmatrix:

- `demo_runner_008` gegen `demo_corp_008`,
- Difficulties `easy`, `normal`, `hard`,
- mindestens sechs Tuning-Seeds,
- mindestens drei Holdout-Seeds,
- Actionlimit und Turnlimit,
- Replay/StateHash-Prüfung,
- Hidden-Info-Leak-Scan der Summaries.

## Metriken

Summaries enthalten:

- `illegalActions`,
- `fallbackRate`,
- `timeoutRate`,
- `reasonCodeCoverage`,
- `roleCoverage`,
- `actionTypeCoverage`,
- `progressScore`,
- `replayOk`,
- `finalStateHash`,
- `holdout`.

## Gate-Grenzen

- IllegalActions: 0.
- Replay/StateHash-Drift: 0.
- Hidden-Info-Leaks: 0.
- FallbackRate im Standard-Smoke: unter 25 Prozent.
- TimeoutRate im Standard-Smoke: 0.
- Mindestens vier verschiedene Reason-Code-Prefixe in der Standardmatrix.

## Repro

Jeder Fehler muss Seed, Deck IDs, Difficulties, Actionlimit, finalen Hash und letzte side-sichere Actionsequenz enthalten.
