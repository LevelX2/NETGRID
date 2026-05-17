---
activityId: act-2026-05-17-docs-derived-s01-rollup-proposal
status: inbox
kind: cleanup
area: docs
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
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

- [ ] Ein konkreter S01-Rollup-Vorschlag liegt unter `docs/derived/`.
- [ ] Audit-Trail und Gate-Nachweise bleiben auffindbar.
- [ ] Linkbruchrisiken sind benannt.
- [ ] `git diff --check` ist ausgeführt.

## Umsetzungshinweise

Analog zum Backend-0.5-Muster arbeiten, aber S01 wegen Specs getrennt klassifizieren.

## Ergebnisnotiz

Noch offen.
