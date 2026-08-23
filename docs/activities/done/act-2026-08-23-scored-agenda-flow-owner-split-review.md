---
activityId: act-2026-08-23-scored-agenda-flow-owner-split-review
status: done
kind: architecture
area: engine
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-08-23
startedAt: 2026-08-23
completedAt: 2026-08-23
branch: codex/architecture-activities-review
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/corp/scored-agenda-flow.ts
  - packages/engine/src/game/corp/scored-agenda/scored-agenda-direct-effect-registry.ts
  - packages/engine/src/game/corp/scored-agenda/scored-agenda-flow-choice-registry.ts
  - packages/engine/src/game/corp/scored-agenda/scored-agenda-score-time-registry.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/scored-agenda-flow.test.ts
  - corepack pnpm check:engine-source-structure
---

# Scored-Agenda-Flow nach Ownern prüfen

## Ziel

Prüfen, ob Score-Orchestrierung und Registry-/Direkteffekt-Dispatch in
`scored-agenda-flow.ts` getrennt werden sollten.

## Kontext und Quellen

- Regel-Engine-Review Batch 6 vom 2026-08-22.
- Im aktuellen Review wurde kein fachlicher Doppelauszahlungsfehler belegt.
- Aktivierungsauslöser: nächste neue Score-Time-Fortsetzung oder Änderung an
  Registry- und Direkteffekt-Dispatch im selben Paket.

## Scope

- Score-Sequenz, Registry-Dispatch und direkte Effekte abgrenzen.
- Bindung von Source-Agenda, Score Area und Fortsetzung dokumentieren.
- Bei positivem Ergebnis kleine Migrationspakete anlegen.

## Nicht im Scope

- Änderung von Agenda-Punkten, Score-Kosten oder Kartenfähigkeiten.
- Neuer paralleler Score-Controller.

## Akzeptanzkriterien

- [x] Die Score-Orchestrierung bleibt alleiniger Owner der Reihenfolge.
- [x] Source-, Score-Area-, Choice- und Replay-Bindungen bleiben fail-closed.
- [x] Registry- und Direkteffektpfade duplizieren keine Fachentscheidung.

## Ergebnisnotiz

Review vom 2026-08-23: **inzwischen erledigt beziehungsweise gegenstandslos**.
Die angenommene fehlende Owner-Trennung existiert im aktuellen Stand bereits:
`scored-agenda-flow.ts` ist eine 124-zeilige Orchestrierungsfassade, während
Direkteffekte, Score-Time-Dispatch und Choice-Dispatch in getrennten Registries
liegen. Diese Struktur entstand bereits im Juni 2026 und blieb seitdem stabil;
es gibt weder einen Doppelauszahlungsfehler noch eine neue Score-Time-
Fortsetzung nach Anlage der Activity. Der fokussierte Test bestätigt 13
Scored-Agenda-Verträge, das Strukturgate bleibt zyklenfrei. Keine Codeänderung
und keine Folge-Activity erforderlich.
