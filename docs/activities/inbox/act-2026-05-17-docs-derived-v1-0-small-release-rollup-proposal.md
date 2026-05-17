---
activityId: act-2026-05-17-docs-derived-v1-0-small-release-rollup-proposal
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

- [ ] Ein begrenzter V1.0.x-Rollup-Vorschlag liegt unter `docs/derived/`.
- [ ] Implementation und Final Reviews bleiben als Audit-Trail vorgesehen.
- [ ] Detailpläne und erledigte Requirements sind als Verdichtungs- oder Archivkandidaten klassifiziert.
- [ ] `git diff --check` ist ausgeführt.

## Umsetzungshinweise

Nicht mit V1.0.5+ starten, wenn dadurch viele UX-/Karten-Nachrelease-Artefakte in denselben Schnitt geraten.

## Ergebnisnotiz

Noch offen.
