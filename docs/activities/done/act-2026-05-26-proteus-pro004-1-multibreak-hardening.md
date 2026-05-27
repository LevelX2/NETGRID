---
activityId: act-2026-05-26-proteus-pro004-1-multibreak-hardening
status: done
kind: test
area: engine
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-26
startedAt: 2026-05-26
completedAt: 2026-05-26
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO004-1
proReferences:
  - PRO004-1
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/run/encounter-actions.ts
  - packages/engine/src/index.ts
  - packages/engine/src/public-context.ts
  - packages/engine/src/test/proteus-card-definitions.ts
  - packages/engine/src/game/run/encounter-actions.test.ts
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/game/run/encounter-actions.test.ts"
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "git diff --check"
---

# Proteus PRO004-1: Multi-Break-Härtung

## Ziel

Die bereits umgesetzten sechs PRO004-Simple-Icebreaker bleiben unverändert. Dieses Nacharbeitspaket härtet den generischen Multi-Break-Pfad, legt einen testnahen Proteus-CardDefinition-Katalog an und dokumentiert den Nachweis, ohne die blockierte Phase-5a-Sammelactivity abzuschließen.

## Ergebnisnotiz

Abgeschlossen am 2026-05-26.

Der Encounter-Action-Pfad wählt bei Multi-Break jetzt die tatsächliche Break-Ability mit `count > 1` statt blind die erste Break-Ability. Der alte Pile-Driver-spezifische Pfad ist intern als generischer Multi-Break-Pfad modelliert; das Kompatibilitätsfeld `pileDriverMultiBreak` bleibt für bestehende PublicContext- und Regressionstests erhalten, zusätzlich wird `multiBreakSubroutines` gesetzt.

`packages/engine/src/test/proteus-card-definitions.ts` stellt echte CardDefinitions aus `data/cards/proteus-cards.json` für Engine-Tests bereit. Der gezielte Encounter-Action-Test nutzt diesen Katalog für die sechs PRO004-Karten und prüft Multi-Break, Subtype-Matcher, Pump-Kosten und Skeleton-Passkeys-`+4`.

Die Phase-5a-Sammelactivity bleibt weiterhin `blocked`, weil PRO012 nicht umgesetzt ist. Dieses Paket implementiert keine neuen Proteus-Karten und aktiviert keine Decklegalität, Formatlegalität oder AI-Unterstützung.
