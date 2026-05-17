---
activityId: act-2026-05-17-docs-derived-v1-0-small-release-rollup-proposal
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
  - docs/derived/V1_0_SMALL_RELEASE_ROLLUP_PROPOSAL.md
checks:
  - "rg --files docs/derived | rg 'V1_0_[1-4]|OPPONENT_ACTION_PRESENTATION|PRIVATE_MATCH_LIFECYCLE|MATCHSTART|JOIN_DECK'"
  - "Select-String headings/status scan for V1.0.2 and V1.0.4 source artifacts"
  - "Test-Path checks for absent V1_0_4_TEST_MATRIX.md and MATCH_LIFECYCLE_1_0_4_SPEC.md"
  - "PowerShell reference check: all referenced existing docs/derived markdown paths exist"
  - "rg -n 'V1_9|V1\\.9|1\\.9' docs/derived/V1_0_SMALL_RELEASE_ROLLUP_PROPOSAL.md: no matches"
  - "git diff --check: pass"
---

# Kleine V1.0.x-Releasefamilien als Rollup vorschlagen

## Ziel

Für höchstens zwei kleine V1.0.x-Releasefamilien soll ein Rollup-Vorschlag entstehen, ohne die breite V1.0-Historie umzubauen.

## Kontext und Quellen

- `docs/derived/V1_0_1_JOIN_DECK_HANDSHAKE_PLAN.md`
- `docs/derived/V1_0_2_*`
- `docs/derived/V1_0_3_*`
- `docs/derived/V1_0_4_*`

## Scope

- Eine kleine, abgeschlossene V1.0.x-Familie auswählen; optional eine zweite zum Vergleich.
- Artefakte nach Plan, Requirements, Testmatrix, Requirements Review, Implementation Review und Final Review klassifizieren.
- Linkbruchrisiken und mögliche Zielstruktur benennen.

## Nicht im Scope

- Kein Move von Dateien.
- Keine V1.9-Originalset-Completion-Historie.
- Keine inhaltliche Glättung alter WIP- oder Blocker-Spuren.

## Akzeptanzkriterien

- [x] Ein begrenzter V1.0.x-Rollup-Vorschlag liegt unter `docs/derived/`.
- [x] Implementation und Final Reviews bleiben als Audit-Trail vorgesehen.
- [x] Detailpläne und erledigte Requirements sind als Verdichtungs- oder Archivkandidaten klassifiziert.
- [x] `git diff --check` ist ausgeführt.

## Umsetzungshinweise

Nicht mit V1.0.5+ starten, wenn dadurch viele UX-/Karten-Nachrelease-Artefakte in denselben Schnitt geraten.

## Ergebnisnotiz

Erstellt wurde `docs/derived/V1_0_SMALL_RELEASE_ROLLUP_PROPOSAL.md`. Der Vorschlag begrenzt den Rollup-Schnitt auf V1.0.2 als formal vollständige Gegner-Aktionsdarstellungsfamilie und V1.0.4 als Private-Match-Lifecycle-Familie. V1.0.1 und V1.0.3 bleiben bewusst außerhalb des eigentlichen Rollups, weil sie asymmetrische Brücken-/Einzelartefakte sind und ein gemeinsamer Schnitt historische Struktur rekonstruieren würde.

Implementation Reviews und Final Reviews bleiben ausdrücklich führende Audit-Trail-Artefakte. Detailpläne und erledigte Requirements sind als Verdichtungs- oder Archivkandidaten klassifiziert. Linkbruchrisiken sind benannt; die Empfehlung lautet additive Rollup-Dateien ohne Moves.

Checks: Quellen- und Statusscan für V1.0.1 bis V1.0.4 ausgeführt. Referenzcheck bestätigt, dass die im Vorschlag als bestehende Quellen genannten `docs/derived`-Markdown-Pfade existieren. Der No-V1.9-Scan hatte keine Treffer. `git diff --check` ist bestanden.
