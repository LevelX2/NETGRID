---
activityId: act-2026-06-09-neutral-ability-usage-limit-state
status: done
kind: architecture
area: engine
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt: 2026-06-09
completedAt: 2026-06-09
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-18-runner-ai-resource-economy-plan
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/ability-engine/card-implementation-ability-limits.ts
  - packages/engine/src/ability-engine/card-implementation-ability-limits.test.ts
  - packages/engine/src/game/state/turn-flags-counters.ts
  - packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts
  - packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts
  - packages/engine/src/game/corp/scored-agenda-abilities.ts
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/ability-engine/card-implementation-ability-limits.test.ts
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/mechanics/trace-tags-resources.test.ts -t Broker
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/runner-events-hardware-programs-resources.test.ts -t Broker
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/releases/card-release-smokes.test.ts -t Disinfectant
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/proteus/action-economy-debt-suite.test.ts -t PDCA
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/trace-prevention-assets.test.ts -t Disinfectant
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/state/turn-flags-counters.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/shared typecheck
  - git diff --check
---

# Ability-Usage-Limits neutral speichern

## Ziel

Kartenspezifische Usage-Flag-Namen für generische Ability-Limits sollen durch eine neutrale, limitbezogene Speicherung ersetzt werden. Die CardImplementation-Funktion darf weiterhin kartenspezifische Quellen haben, aber der allgemeine Runtime-State und der Limit-Adapter sollen nicht nach `Broker`, `Disinfectant`, `PDCA` oder ähnlichen Einzelkarten benannt sein.

## Kontext und Quellen

- Architekturprüfung vom 2026-06-09 zu Kartennamen in allgemeinen Funktionsumsetzungen.
- `packages/engine/src/ability-engine/card-implementation-ability-limits.ts` ist bereits als generischer Ability-Limit-Adapter angelegt, mappt `once_per_turn_per_source` aber noch auf `runnerTurnFlags.brokerActionCardIdsThisTurn`.
- `packages/shared/src/index.ts` enthält mehrere ähnliche Usage-Arrays, unter anderem `brokerActionCardIdsThisTurn`, `startupImmolatorUsedSourceIdsThisTurn`, `preyingMantisUsedSourceIdsThisTurn`, `runOnlyActionUsedSourceIdsThisTurn`, `disinfectantUsedSourceIdsThisTurn` und `pdcaUsedSourceIdsThisTurn`.
- Der Befund ist kein akuter Regelfehler, aber ein Wartbarkeitsrisiko für weitere CardImplementation-Migrationen.

## Scope

- Prüfen, welche Usage-Flags tatsächlich generische Limit-Semantik abbilden:
  - einmal pro Zug und Quelle,
  - einmal pro Run und Quelle,
  - einmal pro Trace und Quelle,
  - source-spezifische End-of-turn-Folgeschäden oder Pending-Folgen.
- Ein neutrales State-Modell einführen oder vorbereiten, zum Beispiel `abilityUsageByScope`, `usedSourceIdsByLimitKey` oder eine ähnlich explizite Struktur.
- `runnerCardImplementationAbilityLimitHost` so anbinden, dass die Persistenz nicht mehr über `brokerActionCardIdsThisTurn` läuft.
- Nur Usage-Felder zusammenlegen, deren Timing, Resetpunkt und Revalidation wirklich identisch sind.
- Bestehende Resets zu Runner-/Corp-Turnstart und Run-Ende an das neutrale Modell anbinden.
- Alte kartenspezifische Felder entfernen oder, falls sie noch für enge Sonderfolgen gebraucht werden, klar als Sonderfall belassen.

## Nicht im Scope

- Keine Regeländerung an `Broker`, `Disinfectant`, `PDCA`, `Startup Immolator`, `Preying Mantis`, Wilson-artigen Run-only-Aktionen oder anderen Karten.
- Keine Änderung daran, welche `LegalActions` erzeugt werden oder welche Kosten gelten.
- Keine Änderung an Hidden-Info-, Replay-, StateHash-, PublicEvent- oder PlayerView-Verträgen außer den nötigen internen State-Feldern.
- Keine Migration aller historischen Longtail-Felder, wenn Timing oder Semantik nicht eindeutig gleich sind.

## Akzeptanzkriterien

- [x] `runnerCardImplementationAbilityLimitHost` nutzt keinen Broker-namentlichen State mehr für generische `once_per_turn_per_source`-Limits.
- [x] Mindestens zwei bisher getrennte, wirklich gleiche Usage-Flag-Muster sind über dieselbe neutrale Struktur oder denselben Helper angebunden.
- [x] Turn-/Run-/Trace-Resetpunkte bleiben deterministisch und sind fokussiert getestet.
- [x] Stale-Action-Revalidation schlägt weiterhin fehl, wenn dieselbe Quelle ihr Limit bereits genutzt hat.
- [x] Keine verdeckten Kartendaten erscheinen neu in PlayerViews, PublicEvents, KI-Inputs, Logs oder Reconnect-Payloads.
- [x] `git diff --check`, relevante Engine-Tests und Typecheck laufen grün.

## Umsetzungshinweise

- Einstiegspunkte:
  - `packages/engine/src/ability-engine/card-implementation-ability-limits.ts`
  - `packages/shared/src/index.ts`
  - `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts`
  - `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts`
- Vor dem Entfernen einzelner Felder prüfen, ob sie reine Usage-Limits oder zusätzlich fachliche Pending-Folgen tragen. `preyingMantisDamageDueSourceIdsThisTurn` ist zum Beispiel wahrscheinlich kein reines Usage-Limit.
- Wenn eine komplette State-Migration zu groß wird, zuerst nur den CardImplementation-Limit-Adapter neutralisieren und die übrigen Felder als Folgefund dokumentieren.

## Ergebnisnotiz

Erledigt. Der generische CardImplementation-Limit-Adapter speichert `once_per_turn_per_source` nicht mehr in `brokerActionCardIdsThisTurn`, sondern in `runnerTurnFlags.abilityUsedSourceIdsByLimitKey` keyed nach Limit-Art und Scope. Run- und Trace-Limits binden an ihre natürlichen Lifecycle-Felder (`successfulRunAbilityUsedSourceIds`, `postBidLinkSourceIds`, `baseLinkSourceId`) an. Gemeinsame `abilityUsage...`-Helper normalisieren und markieren Source-Usage und werden jetzt auch von `Disinfectant` und `PDCA` für Generation, Revalidation und Reset genutzt. Das alte Broker-State-Feld wurde entfernt; Kartenregeln, LegalAction-Disziplin, Replay/StateHash und Hidden-Info-Flächen bleiben unverändert.
