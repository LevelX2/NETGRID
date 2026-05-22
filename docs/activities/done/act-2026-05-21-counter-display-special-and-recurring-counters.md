---
activityId: act-2026-05-21-counter-display-special-and-recurring-counters
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
  - packages/shared/src/index.ts
  - packages/engine/src/index.ts
  - packages/engine/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "counter display"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine test
  - git diff --check
---

# CounterDisplay für Recurring, Spezialcounter und eingeschränkte Pools

## Ziel

Recurring Credits, Spezialcounter und eingeschränkte Bit-/Counter-Pools sollen fachliche CounterDisplays erhalten, ohne dass `usageHint` oder Displaydaten zu einer zweiten Regel-Engine werden.

## Kontext und Quellen

- `recurring_credit` wird in der Engine für unterschiedliche Ausgabekontexte genutzt: Programminstall, Run-/Icebreaker-Kosten, Trace-Link-Bids, Tag-Entfernung, Access-Trash und Stealth-Verluste.
- Spezialcounter umfassen u. a. Shell, Data Raven, Cerberus, Mastiff, Ablative/Armored Fridge, Virus/Pox, Militech, Mark und Crying.
- Eingeschränkte Pools umfassen u. a. Krumz-/Paris-City-Grid-Trace-Bits und andere Poolpfade.
- Relevante Dateien:
  - `packages/engine/src/index.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/ice/data-raven.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/ice/cerberus.ts`
  - `packages/engine/src/card-implementations/onr-v1/corp/ice/mastiff.ts`
  - `apps/web/app/page.tsx`
  - `apps/web/app/action-board-ui.ts`

## Scope

- `displayKind` und Labels für folgende Familien ergänzen:
  - `recurring_credit`
  - Shell-Counter
  - Data-Raven-/Cerberus-/Mastiff-/Crying-Counter auf der Runner-Identity
  - Ablative Counter für Armored Fridge
  - Virus-Counter auf sichtbaren Karten
  - Pox-Counter auf Servern, falls das Server-View-Modell dafür erweitert wird
  - eingeschränkte Trace-/Link-/Run-/Install-/Trash-Pools als `restricted_pool`, soweit sie sichtbar und relevant sind.
- Optionales `usageHint` nur als Anzeigehinweis setzen, z. B. "nur für Trace-Bids" oder "nur für Programminstall".
- Negative Tests ergänzen, dass `usageHint` keine Legalität ersetzt und UI/Server/KI weiter `LegalActions` und Engine-Validierung folgen.

## Nicht im Scope

- Keine Änderung an tatsächlicher Ausgabelogik, Kostenpipeline, LegalActions oder `applyAction`.
- Kein Web-Rendering-Umbau außer bei Bedarf für Typkompatibilität.
- Keine Vollinventur aller zukünftigen Countertypen, wenn sie nicht aktuell sichtbar verwendet werden.
- Kein Speichern der Displaydaten im `GameState`.

## Akzeptanzkriterien

- [x] Recurring Credits erhalten fachliche CounterDisplays mit passenden Anzeigehinweisen, ohne Regelwirkung.
- [x] Data Raven, Cerberus und Mastiff werden aus den engine-seitigen Countertypen projiziert, nicht aus Web-Karten-ID-Hardcoding.
- [x] Shell- und Ablative-Counter erhalten CounterDisplays.
- [x] Sichtbare Virus-/Pox-Pfade sind geprüft und passend projiziert oder begründet zurückgestellt.
- [x] Eingeschränkte Bit-Pools werden nicht mit generischen Stored Credits verwechselt.
- [x] Hidden-Info-, Replay- und StateHash-Grenzen bleiben unverändert.

## Umsetzungshinweise

- Für Server-Counter wie Pox nur ein kleines additiv typisiertes Server-Displayfeld einführen, falls nötig.
- Displaydaten dürfen eine UX erklären, aber niemals Aktionen freischalten.

## Ergebnisnotiz

Erledigt. Die PlayerView-Projektion erzeugt additive `counterDisplays` für `recurring_credit`, eingeschränkte Bit-Pools (`restricted_pool`), Shell-, Ablative-, Virus-, Data-Raven-, Cerberus-, Mastiff-, Crying-, Militech- und Mark-Counter. Pox wird als optionales Server-`counterDisplays`-Feld projiziert. Stored Credits bleiben separat und werden nicht mit eingeschränkten Bit-Pools vermischt. Der fokussierte Test prüft außerdem, dass View-Erzeugung weder `hashState` noch `LegalActions` verändert.
