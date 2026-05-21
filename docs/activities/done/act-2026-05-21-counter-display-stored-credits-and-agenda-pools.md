---
activityId: act-2026-05-21-counter-display-stored-credits-and-agenda-pools
status: done
kind: fix
area: engine
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-counter-display-shared-engine-projection-foundation
resultArtifacts:
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "Broker load|BBS|Braindance|Detroit Police Contract|runner resources source-bound"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine test
  - git diff --check
---

# CounterDisplay für gespeicherte Credits und Agenda-Pools

## Ziel

Gespeicherte Credits/Bits auf Karten und Score-Area-Credit-Pools sollen als fachliche `counterDisplays` aus der Engine-Projection kommen, statt in der Web-UI über Karten-ID plus `bit`/`power` erraten zu werden.

## Kontext und Quellen

- Broker-Hotfix `af2c8471 fix(web): render broker stored credits` korrigiert nur die Web-Zuordnung von Broker auf `bit`.
- Aktuelle Web-Hardcodings:
  - `STORED_CREDIT_COUNTER_SOURCES` in `apps/web/app/action-board-ui.ts`.
  - `scoredAgendaCreditCounterSource` in `apps/web/app/score-area-ui.ts`.
- Karten mit `add_hosted_credits` liegen u. a. unter:
  - `packages/engine/src/card-implementations/onr-v1/runner/resources/broker.ts`
  - `packages/engine/src/card-implementations/onr-v1/runner/resources/short-term-contract.ts`
  - `packages/engine/src/card-implementations/onr-v1/runner/resources/rigged-investments.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/assets/bbs-whispering-campaign.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/assets/braindance-campaign.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/assets/holovid-campaign.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/assets/rockerboy-promotion.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/agendas/corporate-coup.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/agendas/political-coup.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/agendas/detroit-police-contract.ts`
- Frühere Kontext-Activities:
  - `act-2026-05-17-bbs-whispering-campaign-credit-badge`
  - `act-2026-05-18-braindance-campaign-rez-bits-credit-badge`
  - `act-2026-05-17-corporate-cup-scored-credits-action`
  - `act-2026-05-17-generic-counter-credit-pool-resolver`

## Scope

- Stored-/Hosted-Credit-Counter auf sichtbaren Karten als `displayKind: "stored_credit"` projizieren.
- Score-Area-Credit-Pools als `displayKind: "stored_credit"` oder `displayKind: "agenda_bonus"` fachlich eindeutig projizieren, je nach bestehendem Vertrag.
- Labels und Aria-Labels aus der Engine/Public-View-Projection liefern.
- Hidden-Info-Grenze beachten: unrezzed/verdeckte Korp-Karten dürfen keine Credit-Pool-Displays erhalten.
- Regressionen für Broker, Short-Term Contract, BBS, Braindance und mindestens eine scored Agenda ergänzen.

## Nicht im Scope

- Kein Web-Renderer-Umbau auf `counterDisplays`; dieses Paket darf nur Daten liefern.
- Keine Änderung an gespeicherten Countertypen oder bestehenden Regelkosten.
- Keine neue Kartenpromotion.
- Keine KI-Entscheidungsänderung.

## Akzeptanzkriterien

- [x] Broker zeigt in `PlayerView.counterDisplays` gespeicherte `bit`-Credits als Stored-Credit-Display.
- [x] Alle aktuell bekannten `add_hosted_credits`-Familien sind geprüft und entweder projiziert oder begründet ausgenommen.
- [x] Score-Area-Credit-Pools erhalten fachlich passende CounterDisplays ohne Web-Hardcoding als Quelle.
- [x] Verdeckte Korp-Karten leaken durch CounterDisplays keine Kartendaten oder Counterdetails.
- [x] Bestehende `counters` bleiben für Kompatibilität erhalten.
- [x] Checks: fokussierte Engine-Tests plus passende Typechecks.

## Umsetzungshinweise

- Nicht aus `counterType === "bit"` allein auf Stored Credits schließen; Trace-/Pool-Bits bleiben gesondert.
- Falls ein generisches CardImplementation-Metadatum für hosted credits sinnvoll ist, klein und additiv schneiden.

## Ergebnisnotiz

Umgesetzt. Die Engine projiziert gespeicherte öffentliche Bit-/Hosted-Credit-Pools für die aktuell bekannten Quellen als `counterDisplays` mit `displayKind: "stored_credits"`, stabiler ID `stored_credits`, `counterType: "bit"` und `usageHint: "spendable"`. Abgedeckt sind Broker, Short-Term Contract, Rigged Investments, BBS Whispering Campaign, Braindance Campaign, Holovid Campaign, Rockerboy Promotion sowie die Score-Area-Pools Corporate Coup, Detroit Police Contract und Political Coup. Verdeckte Korp-Karten erhalten weiterhin keine Stored-Credit-Displays; `VisibleCard.counters` bleibt kompatibel erhalten.
