---
activityId: act-2026-05-17-docs-derived-s01-rollup-proposal
status: done
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-5
parallelWorker: worker-5
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_S01.md
checks:
  - rg -n "docs/derived/S01_|S01_[A-Z_]+\\.md|S01 |Sonderphase 01" .
  - git diff --check
---

# S01 Release-Artefakte als Rollup vorschlagen

## Ziel

Für die abgeschlossene S01-Familie soll ein Rollup-Vorschlag entstehen, ohne bestehende `S01_*`-Artefakte zu bewegen.

## Kontext und Quellen

- `docs/derived/S01_DETAILED_PLAN.md`
- `docs/derived/S01_REQUIREMENTS.md`
- `docs/derived/S01_REQUIREMENTS_REVIEW.md`
- `docs/derived/S01_TEST_MATRIX.md`
- `docs/derived/S01_AUDIO_SPEC.md`
- `docs/derived/S01_MATCH_SERIES_SPEC.md`
- `docs/derived/S01_RESULT_MODAL_SPEC.md`

## Scope

- S01-Artefakte nach Requirements, Specs, Testmatrix, Review und Detailplan klassifizieren.
- `keep-evidence`, `condense-candidate-after-rollup` und `archive-candidate-after-condense` markieren.
- Linkbruchrisiken vor späteren Moves benennen.

## Nicht im Scope

- Keine Datei-Moves.
- Keine Änderung an S01-Inhalten.
- Keine Verbindung mit V1.x- oder V2-Roadmaps.

## Akzeptanzkriterien

- [x] Ein konkreter S01-Rollup-Vorschlag liegt unter `docs/derived/`.
- [x] Audit-Trail und Gate-Nachweise bleiben auffindbar.
- [x] Linkbruchrisiken sind benannt.
- [x] `git diff --check` ist ausgeführt.

## Umsetzungshinweise

Analog zum Backend-0.5-Muster arbeiten, aber S01 wegen Specs getrennt klassifizieren.

## Ergebnisnotiz

Abgeschlossen. `docs/derived/DOCS_DERIVED_RELEASE_ROLLUP_S01.md` klassifiziert alle sieben S01-Artefakte und trifft ausdrücklich `decision-no-move`: Requirements Review, Requirements, Testmatrix und Match-Series-Spec bleiben `keep-evidence`; Result-Modal- und Audio-Spec sind `condense-candidate-after-rollup`; der Detailplan ist `archive-candidate-after-condense`. Harte Linkbruchrisiken vor späteren Moves sind benannt, insbesondere in KI-Wissen, Log, Codex-Status-Chronik, S01-Detailplan, V1.0.2-Folgeartefakten, Mechanics-Planung und Activity-Audit. Es wurden keine S01-Inhalte geändert und keine Dateien bewegt.
