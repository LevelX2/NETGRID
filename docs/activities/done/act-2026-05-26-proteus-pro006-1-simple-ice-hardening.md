---
activityId: act-2026-05-26-proteus-pro006-1-simple-ice-hardening
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
releaseTarget: Proteus PRO006-1
proReferences:
  - PRO006-1
  - PRO006
blockedBy: []
resultArtifacts:
  - packages/engine/src/ability-engine/definition-types.ts
  - packages/engine/src/ability-engine/printed-subroutine-implementations.ts
  - packages/engine/src/ability-engine/printed-subroutine-implementations.test.ts
  - packages/engine/src/index.test.ts
  - docs/releases/proteus/proteus-activity-status-2026-05-26.md
checks:
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/ability-engine/printed-subroutine-implementations.test.ts"
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t \"Proteus PRO006\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t \"reconciles Proteus\""
  - "corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts"
  - "corepack pnpm --filter @netgrid/engine typecheck"
  - "git diff --check"
---

# Proteus PRO006-1: Simple-ICE-Härtung

## Ziel

Die bereits umgesetzte PRO006-Implementierung gezielt über Typ- und Regressionstests härten, ohne neue Proteus-Karten umzusetzen und ohne PRO025-Mechaniken vorzuziehen.

## Ergebnisnotiz

Abgeschlossen am 2026-05-26.

Der deklarative Printed-Subroutine-Typ für `end_the_run_unless_runner_pays` erlaubt jetzt Kartentexte mit variablem Betrag. Ein fokussierter Mapping-Test prüft, dass ein deklarativer Eintrag mit `amount: 2` als Engine-Subroutine mit `amount: 2` ankommt.

`Colonel Failure` behält die PRO006-Semantik: `trash_program` bleibt ein automatischer Printed-Subroutine-Effekt ohne Zielwahlfenster. Ergänzte Regressionen decken Fälle mit einem und null installierten Runner-Programmen ab, prüfen fehlende Doppel-Trash-Ziele, Hidden-Info-sichere PublicPayloads sowie Replay-/StateHash-Determinismus.

Dieses Paket implementiert keine neue Proteus-Karte. Die Implementierungszählung bleibt 62 von 154 Proteus-Karten; 92 CardImplementation-Dateien fehlen weiterhin. PRO025 bleibt offen/blockiert: `Chihuahua`, `Coyote`, `Iceberg` und `Washed-Up Solo Construct` wurden nicht umgesetzt oder freigegeben. Payment- und Zielwahlvarianten gehören zu PRO025.
