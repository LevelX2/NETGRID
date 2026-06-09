---
activityId: act-2026-06-09-neutral-ability-usage-limit-state
status: inbox
kind: architecture
area: engine
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-06-09
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
relatedActivities:
  - act-2026-05-18-runner-ai-resource-economy-plan
resultArtifacts: []
checks: []
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

- [ ] `runnerCardImplementationAbilityLimitHost` nutzt keinen Broker-namentlichen State mehr für generische `once_per_turn_per_source`-Limits.
- [ ] Mindestens zwei bisher getrennte, wirklich gleiche Usage-Flag-Muster sind über dieselbe neutrale Struktur oder denselben Helper angebunden.
- [ ] Turn-/Run-/Trace-Resetpunkte bleiben deterministisch und sind fokussiert getestet.
- [ ] Stale-Action-Revalidation schlägt weiterhin fehl, wenn dieselbe Quelle ihr Limit bereits genutzt hat.
- [ ] Keine verdeckten Kartendaten erscheinen neu in PlayerViews, PublicEvents, KI-Inputs, Logs oder Reconnect-Payloads.
- [ ] `git diff --check`, relevante Engine-Tests und Typecheck laufen grün.

## Umsetzungshinweise

- Einstiegspunkte:
  - `packages/engine/src/ability-engine/card-implementation-ability-limits.ts`
  - `packages/shared/src/index.ts`
  - `packages/engine/src/game/engine-runtime-internal/turn-runtime-resolvers.ts`
  - `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts`
- Vor dem Entfernen einzelner Felder prüfen, ob sie reine Usage-Limits oder zusätzlich fachliche Pending-Folgen tragen. `preyingMantisDamageDueSourceIdsThisTurn` ist zum Beispiel wahrscheinlich kein reines Usage-Limit.
- Wenn eine komplette State-Migration zu groß wird, zuerst nur den CardImplementation-Limit-Adapter neutralisieren und die übrigen Felder als Folgefund dokumentieren.

## Ergebnisnotiz

Noch offen.
