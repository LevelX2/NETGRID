---
activityId: act-2026-05-24-proteus-phase-5b-runner-protection-programs
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
releaseTarget: Proteus Phase 5b
blockedBy: []
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/programs/enterprise-inc-shields.ts
  - packages/engine/src/card-implementations/proteus/runner/programs/skullcap.ts
  - packages/engine/src/card-implementations/registry.ts
  - packages/engine/src/card-implementations/coverage.ts
  - packages/engine/src/card-implementations/definition-descriptors.test.ts
  - packages/engine/src/game/damage/prevention.test.ts
  - data/manifests/proteus-card-support.json
  - docs/releases/proteus/README.md
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts -t \"Proteus Phase 5b\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/game/damage/prevention.test.ts -t \"Proteus Phase 5b\""
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "corepack pnpm --filter @netgrid/shared typecheck"
  - "node -e \"JSON.parse(require('fs').readFileSync('data/manifests/proteus-card-support.json','utf8'))\""
  - "git diff --check"
---

# Proteus Phase 5b: Runner Protection Programs

## Ziel

Die sichtbaren Runner-Protection-Programme als CardImplementation-Dateien mit generischen Damage-Prevention-/Replacement-Fenstern umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `5b Runner Protection Programs`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende Damage-/Prevention-Implementierungen und Tests.

## Zielkarten

- `onr_proteus_086_enterprise-inc-shields` Enterprise, Inc., Shields
- `onr_proteus_096_skullcap` Skullcap

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- Damage-Prevention-/Replacement-Fenster, Source-/Turn-Limits, private Choice und öffentliche Outcome-Projektion.
- LegalAction- und `applyAction`-Revalidierung für Timing, Kosten, Quelle und preventbaren Schaden.

## Nicht im Scope

- Keine Hidden Runner Resources.
- Keine Event-/Run-Karten aus Phase 5c/5d.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Prevention-/Replacement-Choices leaken keine verdeckten Karteninformationen.
- [ ] Wrong-Side-, stale-action-, Kosten-/Timing-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Abgeschlossen am 2026-05-24.

`Enterprise, Inc., Shields` und `Skullcap` wurden als eigene Proteus-CardImplementation-Dateien unter `packages/engine/src/card-implementations/proteus/runner/programs/` umgesetzt. Beide nutzen die vorhandene generische `damagePreventionSources`-Familie:

- `Enterprise, Inc., Shields`: bezahlte öffentliche Prevention-Quellen für bis zu 2 Net Damage oder 1 Brain/Core Damage.
- `Skullcap`: `trash_source`-Prevention für beliebige Net- oder Brain/Core-Damage-Menge.

Registry, Coverage, Descriptor-Test, gezielte Runtime-Tests mit Wrong-Side-/Stale-Revalidierung, Replay-/StateHash-Nachweis und das Proteus-Manifest wurden aktualisiert. Keine Decklegalität, Formatlegalität oder AI-Promotion wurde aktiviert.
