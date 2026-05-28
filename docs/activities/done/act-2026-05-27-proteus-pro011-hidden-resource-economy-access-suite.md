---
activityId: act-2026-05-27-proteus-pro011-hidden-resource-economy-access-suite
status: done
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-27
startedAt: 2026-05-27
completedAt: 2026-05-27
branch: codex/proteus-card-implementation
releaseTarget: Proteus PRO011
proReferences:
  - PRO011
resultArtifacts:
  - packages/engine/src/card-implementations/proteus/runner/resources/airport-locker.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/chiba-bank-account.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/hq-mole.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/liberated-savings-account.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/r-and-d-mole.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/simulacrum.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/swiss-bank-account.ts
  - packages/engine/src/card-implementations/proteus/runner/resources/time-to-collect.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Proteus PRO011: Hidden Resource Economy/Access Suite

## Ergebnis

PRO011 ist umgesetzt.

Umgesetzte Karten:

- `onr_proteus_128_airport-locker` Airport Locker
- `onr_proteus_133_chiba-bank-account` Chiba Bank Account
- `onr_proteus_142_hq-mole` HQ Mole
- `onr_proteus_143_liberated-savings-account` Liberated Savings Account
- `onr_proteus_147_r-and-d-mole` R&D Mole
- `onr_proteus_149_simulacrum` Simulacrum
- `onr_proteus_152_swiss-bank-account` Swiss Bank Account
- `onr_proteus_153_time-to-collect` Time to Collect

Der Proteus-Harness steht danach bei 154 total, 105 implementiert, 49 fehlend und 0 Drift. Die Karten bleiben nicht `deck_legal`, nicht `format_legal` und nicht `ai_supported`.

## Engine-Bausteine

- Generische `tap_source`-Kosten für aktivierte CardImplementation-Fähigkeiten inklusive Hidden-Resource-Reveal und Tap-State.
- Run-/Encounter-Bedingungen für aktuelle ICE, AP-ICE und aktuelle zentrale Run-Server.
- Generische Access-Count-Erhöhung für HQ/R&D vor dem Access-Queue-Aufbau.
- Generisches Passieren der aktuellen Encounter-ICE über die bestehende Run-Fortsetzung.
- Resource-Trash-Prevention für andere installierte Runner-Resources im Korp-Zug.

## Statusreferenz

Die alten Phase-4b- und Phase-4c-Activities bleiben nur Statusreferenzen und werden nicht zusätzlich gezählt. PRO012 bleibt ein separater Hidden-Resource-Prevention-/Sabotage-Scope, soweit er nicht direkt durch `Time to Collect` berührt wurde.
