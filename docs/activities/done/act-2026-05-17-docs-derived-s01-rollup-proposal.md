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
  - docs/releases/special/s01/README.md
checks:
  - rg -n "docs/derived/S01_|S01_[A-Z_]+\\.md|S01 |Sonderphase 01" .
  - git diff --check
---

# S01 Release-Artefakte als Rollup vorschlagen

## Ziel

Für die abgeschlossene S01-Familie soll ein Rollup-Vorschlag entstehen, ohne bestehende `S01_*`-Artefakte zu bewegen.

## Kontext und Quellen

- `docs/releases/special/s01/detailed-plan.md`
- `docs/releases/special/s01/requirements.md`
- `docs/releases/special/s01/requirements-review.md`
- `docs/releases/special/s01/test-matrix.md`
- `docs/releases/special/s01/audio-spec.md`
- `docs/releases/special/s01/match-series-spec.md`
- `docs/releases/special/s01/result-modal-spec.md`

## Scope

- S01-Artefakte nach Requirements, Specs, Testmatrix, Review und Detailplan klassifizieren.
- `keep-evidence`, `condense-candidate-after-rollup` und `archive-candidate-after-condense` markieren.
- Linkbruchrisiken vor späteren Moves benennen.

## Nicht im Scope

- Keine Datei-Moves.
- Keine Änderung an S01-Inhalten.
- Keine Verbindung mit V1.x- oder V2-Roadmaps.

## Akzeptanzkriterien

- [x] Ein konkreter S01-Rollup-Vorschlag lag ursprünglich unter `docs/derived/`; seit 2026-05-18 ist er als Release-Index nach `docs/releases/special/s01/README.md` migriert.
- [x] Audit-Trail und Gate-Nachweise bleiben auffindbar.
- [x] Linkbruchrisiken sind benannt.
- [x] `git diff --check` ist ausgeführt.

## Umsetzungshinweise

Analog zum Backend-0.5-Muster arbeiten, aber S01 wegen Specs getrennt klassifizieren.

## Ergebnisnotiz

Abgeschlossen. Das ursprüngliche Rollup klassifizierte alle sieben S01-Artefakte und traf `decision-no-move`: Requirements Review, Requirements, Testmatrix und Match-Series-Spec bleiben `keep-evidence`; Result-Modal- und Audio-Spec sind `condense-candidate-after-rollup`; der Detailplan ist `archive-candidate-after-condense`. Harte Linkbruchrisiken vor späteren Moves wurden benannt, insbesondere in KI-Wissen, Log, Codex-Status-Chronik, S01-Detailplan, V1.0.2-Folgeartefakten, Mechanics-Planung und Activity-Audit.

Nachtrag 2026-05-18: Nach der Zielstrukturentscheidung wurde S01 als Sonderrelease nach `docs/releases/special/s01/` migriert. Kanonischer Einstieg ist `docs/releases/special/s01/README.md`; die sieben Einzelartefakte bleiben erhalten.
