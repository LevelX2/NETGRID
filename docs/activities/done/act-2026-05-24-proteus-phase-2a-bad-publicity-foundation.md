---
activityId: act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-24
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 2a
blockedBy:
  - act-2026-05-24-proteus-phase-2-bad-publicity-cards
resultArtifacts:
  - packages/engine/src/ability-engine/definition-types.ts
  - packages/engine/src/ability-engine/effect-interpreter.ts
  - packages/engine/src/public-context.ts
  - packages/shared/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t add_bad_publicity
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t Bad-Publicity
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
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

- [x] Bad Publicity kann durch CardImplementation-Effekte kartenunabhängig erhöht werden.
- [x] `bad_publicity_7` bleibt Engine-autoritativ.
- [x] PublicPayload enthält nur öffentliche BP-Zähler/Source-Metadaten.
- [x] Replay und StateHash sind stabil.
- [x] Keine Proteus-ID-Branches in Runtime, UI, Catalog oder KI.

## Ergebnisnotiz

Erledigt am 2026-05-24. Der CardImplementation-Interpreter unterstützt jetzt den generischen Effekt `add_bad_publicity`. Der Effekt validiert einen positiven öffentlichen Betrag, erhöht ausschließlich den öffentlichen Corp-Bad-Publicity-Zähler und liefert `badPublicityAdded`, `corpBadPublicityBefore`, `corpBadPublicityAfter` sowie `sourceVisibility`/`redactedKind` für redigierbare Quellen.

Die PublicContext-Projektion kopiert die neuen öffentlichen BP-Zähler und entfernt `sourceDefinitionId`/`sourceTitle`, wenn der Effekt `sourceVisibility: "redacted"` setzt. `bad_publicity_7` bleibt unverändert über die bestehende `applyAction`/`checkWinConditions`-Kette Engine-autoritativ; der neue Effekt selbst entscheidet kein Spielende. Der gezielte Test deckt Effektanwendung, redigierte Source-Projektion, Gate-Aufruf und StateHash ab; der bestehende Bad-Publicity-Harness deckt weiterhin PublicEvent, PlayerView, Replay und Priorität des Gates ab.
