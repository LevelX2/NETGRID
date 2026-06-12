# AI Activation Track Local Audit 2026-06-12

## Status

complete

## Anlass

Der gemeldete Abschluss des AI-Play-Strength-Activation-Tracks ist lokal nach `main` integriert, aber nicht auf GitHub sichtbar. Dieser Audit prüft deshalb den lokalen Stand auf dem neuen Arbeitsbranch `codex/ai-structural-play-strength-consolidation` ohne GitHub-Annahme.

## Git-Stand

- Arbeitsbranch: `codex/ai-structural-play-strength-consolidation`
- Audit-HEAD: `cad5d46b1aa7dc795d67a6748f79124ceb10cd55`
- Basis-`main` beim Worktree-Start: `db6c8afb824b30a00be032f66fc8c6275b477c03`
- Letzter Basiscommit: `db6c8afb test(ai): refresh evidence sweep final trace after main merge`
- Der Worktree war vor diesem Audit sauber.

## Relevante lokale Commits

Die lokale Historie enthält die erwarteten AI-ACT- und Folgeschritte:

```text
8d309329 docs(ai): note activation worktree removal
dd593255 feat(ai): add deck doctrine v2 diagnostics
cc681a27 docs(ai): mark play strength activation complete
aafa281f test(ai): report semantic signal catalog gaps
565aa5a4 Merge branch 'main' into codex/ai-play-strength-activation-track
e6a06335 docs(ai): record play strength activation final green
5b51aa29 docs(ai): record play strength activation track
04bf7e95 tooling: extract source contract comments
a6a65ba1 refactor(ai): extract pure semantic diagnostics helpers
8e500889 feat(ai): add target choice shadow ranking
8c9d092d feat(ai): classify basic action semantics
8c25f28b feat(ai): add local corp score window pilot
1ffe6fb1 feat(ai): project action cost and timing semantics
652e36ec feat(ai): add local runner safe access pilot
```

Zusätzlich liegen spätere lokale Folgecommits bis `db6c8afb` vor. Der unmittelbar letzte Basiscommit vor diesem Prozess ändert nur `docs/reviews/ai/ai122-final-a-d-5seed-2026-06-12.json`.

## Vorhandene AI-ACT-Artefakte

Gefunden:

- `docs/architecture/ai/ai-play-strength-activation-track-automation-process-2026-06-12.md`
- `docs/reviews/ai/ai-play-strength-activation-track-final-report-2026-06-12.md`
- `packages/ai/src/diagnostics/semantic-redaction.ts`
- `packages/ai/src/decision/neutral-goal-synthesis.ts`
- `packages/ai/src/decision/semantic-basic-setup-pilot.ts`
- `packages/ai/src/decision/target-choice-shadow.ts`
- `packages/ai/src/evaluation/real-engine-decision-corpus.ts`
- `packages/ai/src/evaluation/semantic-shadow-league.ts`
- `packages/ai/src/evaluation/play-strength-benchmark.ts`
- `packages/ai/src/evaluation/semantic-shadow-report.ts`

## Pilot-Scopes

Der lokale Stand enthält drei Play-Strength-Pilot-Scopes:

```text
basic_setup
runner_safe_access
corp_score_window
```

`semantic-basic-setup-pilot.ts` enthält noch die konkrete Scope-Logik und exportiert `RUNNER_SAFE_ACCESS_PILOT_MODE` sowie `CORP_SCORE_WINDOW_PILOT_MODE`. Das ist funktional, aber strukturell der Grund für `AI-CONS-3`: weitere Scopes sollen über eine Registry kontrolliert werden statt in einer wachsenden Pilot-Datei zu landen.

## Testabdeckung

Relevante lokale Tests existieren:

- `packages/ai/src/decision/semantic-basic-setup-pilot.test.ts`
- `packages/ai/src/semantic-ai-runtime-cutover.test.ts`
- `packages/ai/src/evaluation/real-engine-decision-corpus.test.ts`
- `packages/ai/src/evaluation/semantic-shadow-league.test.ts`
- `packages/ai/src/decision/target-choice-shadow.test.ts`
- `packages/ai/src/decision/semantic-shadow-calibration.test.ts`
- `packages/ai/src/diagnostics/semantic-redaction.test.ts`
- `packages/ai/src/decision/neutral-goal-synthesis.test.ts`

## Runtime-Anbindung

`packages/ai/src/runtime/semantic-runtime.ts` importiert den Pilot aus `decision/semantic-basic-setup-pilot` und nutzt dessen `selectedAction`/`reasonCode` für Runtime-Entscheidungen. Die Ergebnisanalyse genannte Reason-Konsistenz ist damit lokal nachvollziehbar: die Runtime übernimmt den Grund der tatsächlich ausgewählten Pilot-Choice.

## Offene Hauptworkspace-Änderungen

Der Hauptworkspace `C:\Projekte\NETGRID` war bei Prozessstart nicht sauber. Offene fremde Änderungen:

```text
data/ai/ai-card-hints-active.json
data/ai/ai-card-hints-compiled.json
data/ai/ai-hint-inspector-index.json
data/ai/function-signal-derivation-v1.json
data/ai/tactic-signals-v1.json
docs/reviews/ai/ai022-runner-resources-semantics-review-2026-06-02.md
docs/reviews/ai/ai022-runner-resources-semantics-review-report-2026-06-02.json
scripts/apply-ai022-runner-resources-semantics.mjs
scripts/check-ai022-runner-resources-semantics.mjs
```

Diese Änderungen gehören nicht zu diesem Prozess. Sie werden nicht gestasht, nicht committed, nicht reverted und nicht in Paketcommits aufgenommen. Für alle Folgepakete gilt pfadbezogenes Staging.

## Schlussfolgerungen

- Der lokal gemeldete AI-ACT-Endstand ist im Repository nachvollziehbar.
- Die GitHub-Review-Lücke ist real, aber kein lokaler Implementierungsblocker.
- Der nächste strukturelle Hebel ist die Trennung von Pilot-Scope-Entscheidung, Runtime-Anbindung, Evaluation und Diagnostik.
- Der nächste Sicherheitshebel ist Real-Engine-/LegalAction-nahe Coverage für Pilot-Scopes und TargetChoiceShadow.
- Der nächste Strategiehebel ist eine diagnostische, nicht-autopilotische DeckDoctrine-v2-Zielableitung.

## Verifikation

- `corepack pnpm --filter @netgrid/ai test`: 73 Testdateien, 1174 Tests bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.
