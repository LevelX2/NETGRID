# Corp Board Triage 2026-06-29

Status: abgeschlossen

## Ziel

Die Corp-KI erhält einen kleinen zentralen Board-Triage-Schnitt vor der finalen Action-Wertung. Die Triage erzeugt genau eine primäre Lageklasse und unterdrückt bei hoher oder kritischer Lage Action-Familien, die am Hauptziel vorbeispielen.

## Scope

- Nur AI-Runtime, nur bestehende LegalActions.
- Keine Engine-, Regel-, PlayerView- oder Hidden-Info-Änderung.
- Keine große Semantikmigration und kein Parallel-Planner.
- Keine langen Reports.

## Paketfolge

1. Triage-Modul und Integration in `semantic-runtime-corp-score`.
2. Fokussierte Regressionen für Score-now, unsichere Remote, Funding, Central-Druck und Rez-Reihenfolge.
3. Typecheck, relevante Tests, kurzer Abschluss, Commit und lokaler Merge nach `main`.

## Checks

- Fokussierte Vitest-Tests für geänderte Runtime-Module.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Ergebnis

Die Triage ist als AI-interner LegalActions-only-Schnitt in `semantic-runtime-corp-score` integriert. Sie erzeugt eine primäre Lageklasse, gibt side-safe Evidence aus und setzt bei hoher oder kritischer Lage einen starken Mismatch-Penalty gegen Aktionen, die Score-now, Remote-Schutz/Funding, akuten Central-Schutz oder Economy-Recovery unterlaufen.

Fokussierte Runtime-Tests, relevante Index-Regressionsfälle, Typecheck und `git diff --check` sind grün. Der vollständige `@netgrid/ai`-Testlauf bleibt bei bekannten Runner-/Boundary-/Shadow-Baseline-Fails rot, ohne neue Corp-Triage-Regressionen.
