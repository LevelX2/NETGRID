---
activityId: act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
status: in-progress
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 2a
blockedBy:
  - act-2026-05-24-proteus-phase-2-bad-publicity-cards
resultArtifacts: []
checks: []
---

# Proteus Phase 2a: Bad-Publicity Foundation

## Ziel

Bad Publicity als generischen CardImplementation-/Engine-Effekt vorbereiten, ohne Proteus-Karten zu promoten.

## Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Phase 2a.
- `docs/releases/proteus/bad-publicity-loss-gate-contract.md`.
- `docs/activities/done/act-2026-05-17-proteus-bad-publicity-loss-gate.md`.
- `docs/activities/done/act-2026-05-17-proteus-bad-publicity-engine-harness.md`.

## Scope

- Generischer `add_bad_publicity`-Effekt oder gleichwertiger CardImplementation-Baustein.
- PublicPayload mit Vorher/Nachher-Zähler und source-redigierbarer Projektion.
- Game-End-Prüfung nach Effektsequenzen weiter Engine-autoritativ.
- Tests für Effektanwendung, PublicPayload/PlayerView, Replay/StateHash und bestehendes `bad_publicity_7`-Gate.

## Nicht im Scope

- Keine Kartenpromotion.
- Keine Decklegalität, Formatlegalität oder AI-Hints.
- Keine UI-Regelautorität.

## Akzeptanzkriterien

- [ ] Bad Publicity kann durch CardImplementation-Effekte kartenunabhängig erhöht werden.
- [ ] `bad_publicity_7` bleibt Engine-autoritativ.
- [ ] PublicPayload enthält nur öffentliche BP-Zähler/Source-Metadaten.
- [ ] Replay und StateHash sind stabil.
- [ ] Keine Proteus-ID-Branches in Runtime, UI, Catalog oder KI.

## Ergebnisnotiz

Noch offen.
