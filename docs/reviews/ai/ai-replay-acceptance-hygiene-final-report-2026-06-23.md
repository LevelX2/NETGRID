# AI Replay Acceptance Hygiene Final Report

Stand: 2026-06-23

Branch: `codex/ai-replay-acceptance-hygiene`

## Ergebnis

Der Nachlauf korrigiert die erste AI-Replay-Mistake-Iteration fachlich und artefaktseitig.

Der korrekte Status lautet jetzt:

```text
AI Replay Mistake Iteration v1:
Mining und erster Minimalfix implementiert,
aber Repro-Portabilität, echter Holdout, Full-Green-Abnahme
und nächste Fehleriteration offen.
```

## Umgesetzte Korrekturen

- Neues Prozessartefakt: `docs/architecture/ai/ai-replay-acceptance-hygiene-process-2026-06-23.md`.
- Große versionierte Runtime-Exports entfernt:
  - `docs/reviews/ai/ai-replay-decision-cases-2026-06-23.json`
  - `docs/reviews/ai/ai-replay-decision-candidate-clusters-2026-06-23.json`
- Ersatzartefakt: `docs/reviews/ai/ai-replay-decision-safe-summary-2026-06-23.json`.
- Mining-Skripte schreiben vollständige Exports standardmäßig nur noch nach `data/local/ai-replay/<run-id>`.
- Neuer Acceptance-Harness: `packages/ai/src/evaluation/replay-acceptance-harness.ts`.
- Neuer CLI-Report: `scripts/build-ai-replay-acceptance-report.ts`.
- Status korrigiert in:
  - `docs/codex/CODEX_STATUS.md`
  - `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
  - `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`
  - `docs/architecture/ai/ai-replay-mistake-iteration-process-2026-06-23.md`

## Folgepakete

Neu oder aktualisiert:

- `docs/activities/inbox/act-2026-06-23-ai-replay-portable-same-state-fixture.md`
- `docs/activities/inbox/act-2026-06-23-ai-replay-current-holdout-runner.md`
- `docs/activities/inbox/act-2026-06-23-ai-shell-traders-full-test-gate.md`
- `docs/activities/inbox/act-2026-06-23-ai-coverage-direct-action-score-gate.md`
- `docs/activities/inbox/act-2026-06-23-ai-remote-contest-creditbase-holdout.md`

## Sicherheitsgrenzen

- Kein History-Rewrite und kein Force-Push.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash- oder Randomness-Änderung.
- Keine Nutzung von FullState, Hidden Cards, Decklisten oder lokaler Runtime-DB als produktive KI-Wissensquelle.
- Vollständige lokale Analyseexports bleiben nichtversionierte lokale Artefakte.
- Holdout-Pattern-Recurrence wird nicht mehr als echte aktuelle Holdout-Abnahme bezeichnet.

## Verifikation

Bestanden:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/evaluation/replay-acceptance-harness.test.ts src/evaluation/replay-decision-case-extraction.test.ts src/evaluation/replay-decision-case-clustering.test.ts src/runtime/semantic-choice-ranking.test.ts src/semantic-ai-runtime-cutover.test.ts --maxWorkers=1 --testTimeout=30000`
  - 5 Testdateien, 64 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`
  - grün.
- `git diff --check`
  - grün.

Nicht als erledigt behauptet:

- vollständiger `@netgrid/ai test` wegen bekanntem Shell-Traders-Gate.
- echte aktuelle Holdout-Ausführung auf allen 283 Holdout-DecisionPoints.
- repository-seitig portables Original-Same-State-Fixture.

## Abschlussbewertung

Der Nachlauf macht den Stand fachlich ehrlicher und reduziert das Veröffentlichungsrisiko im aktuellen Baum. Er schließt die erste KI-Fehleriteration nicht vollständig ab, sondern trennt sauber zwischen implementiertem Minimalfix, vorhandener Mining-Grundlage und noch offenen Abnahme-Gates.
