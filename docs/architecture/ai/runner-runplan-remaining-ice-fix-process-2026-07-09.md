# RunnerRunPlan Remaining ICE Fix Process 2026-07-09

## Status

In Umsetzung auf Branch `codex/runner-run-plan-remaining-ice-fix` im Worktree `C:\Projekte\NETGRID_RUN_PLAN_REMAINING_ICE_FIX`.

## Quelle/Vorgabe

Playtest-Befund aus dem aktiven Match `match_f4c099f8b5edb26d`: Im Runner-Zug 14 startete die Runner-KI einen Run auf HQ gegen zwei bekannte gerezzte Code Gates (`Keeper`, `Quandary`). Die Startbewertung sah den Pfad mit `break_cost:6` als erreichbar. Nach dem Brechen von `Keeper` ließ der Runner an `Quandary` dennoch `End the run` auslösen.

## Gesamtziel

Der RunnerRunPlan darf bei aktiver Run-Revalidierung bereits passierte ICE nicht erneut in den bekannten Restpfad einrechnen. Ein bekannter Pfad, der bei Start mit vorhandenen Cash- und sichtbaren beschränkten Breaker-Credits erreichbar ist, muss während der Encounter-Sequenz konsistent weiter quotiert werden.

## Annahmen

- Der konkrete Fehler liegt im aktiven Run-Restpfad, nicht in den Engine-LegalActions.
- `currentRunRemainingIce` beziehungsweise die Verwendung davon darf korrigiert werden, solange keine Hidden-Info ausgeweitet wird.
- Die Regression wird über side-sichere `AiDecisionInput`-/PlayerView-Testdaten gebaut.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln, LegalAction-Erzeugung oder Kartenkosten.
- Keine Änderung an Cloak, Codecracker, Keeper oder Quandary als Einzelfall-Sonderregel.
- Keine Serverstarts und keine Runtime-Datenmutation.

## Controller-Invarianten

- Engine-Korrektheit zuerst.
- KI konsumiert nur PlayerView, LegalActions und side-sichere Debug-/Semantikdaten.
- Keine verdeckten Kartendaten in Tests, Debug oder Dokumentation.
- Nur generische RunnerRunPlan-/Pfadquotenlogik ändern.

## Paketfolge

### Paket 1: Preflight und Prozessartefakt

- Ziel: Arbeitsbranch, Worktree und Prozesskontrakt festhalten.
- Kernartefakte: dieses Dokument.
- Checks: `git diff --check`.
- Done-Gate: Prozess ist committed.
- Commit: `docs(ai): plan runner run remaining ice fix`

### Paket 2: Regression und Fix

- Ziel: Aktiver Run-Restpfad zählt nur aktuelle und noch kommende ICE, nicht bereits passierte ICE.
- Kernartefakte: `packages/ai/src/runtime/current-encounter.ts`, `packages/ai/src/runtime/runner-run-plan-path-quote.ts`, fokussierte Tests.
- Checks: fokussierte Vitest-Regressionen für RunnerRunPlan-Pfadquote und angrenzende bestehende Tests.
- Done-Gate: Test zeigt den Keeper-zu-Quandary-Fall und ist grün.
- Commit: `fix(ai): quote active run remaining ice only`

### Paket 3: Review, Verifikation und Integration

- Ziel: Evidence/Review dokumentieren, finale Checks ausführen und Arbeitsbranch lokal nach `main` mergen.
- Kernartefakte: Review-Report unter `docs/reviews/ai/`, Projektlog falls dauerhafter Vertrag entsteht.
- Checks: relevante fokussierte Tests, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.
- Done-Gate: Worktree sauber, Branch nach `main` gemerged, Hauptworkspace geprüft.
- Commit: `docs(ai): close runner run remaining ice fix`

## Verifikationsregeln

Mindestens ausführen:

- fokussierter Vitest-Test für den neuen Restpfad-Fall;
- angrenzende RunnerRunPlan-/VisibleRunAnalysis-Tests, soweit zeitlich sinnvoll;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

## /Goal

Arbeite diesen Prozess vollständig und sequenziell von Paket 1 bis Paket 3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, die NETGRID-Wissensbasis, den aktiven Agenten und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_RUN_PLAN_REMAINING_ICE_FIX` auf Branch `codex/runner-run-plan-remaining-ice-fix`. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Workaround und dokumentiere den Blocker. Nach Abschluss: final verifizieren, lokal nach `main` mergen, main prüfen und Worktree entfernen.
