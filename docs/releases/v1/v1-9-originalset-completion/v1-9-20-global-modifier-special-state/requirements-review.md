# V1.9.20 Requirements Review

Status: passed for implementation start
Stand: 2026-05-13

## Entscheidung

V1.9.20 darf in die Implementierung wechseln. Die 26 Zielkarten und die drei primären Resolverfamilien sind aus Matrix und Handoff ausreichend konkret abgeleitet.

## Risiken

- Globale Modifier dürfen keine verdeckten Quellen offenlegen.
- Action-Economy- und Handlimit-Modifier berühren gemeinsame Engine-Basiswerte und brauchen fokussierte Regressionen.
- Persistente Sonderzustände müssen sauber zwischen öffentlicher Quelle, side-privatem Detail und Replay-Zustand trennen.

## Gate

`V1_9_20_requirements_review_passed: true`
`ready_for_V1_9_20_implementation: true`
