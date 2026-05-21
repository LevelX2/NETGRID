---
activityId: act-2026-05-21-counter-display-special-and-recurring-counters
status: inbox
kind: fix
area: engine
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-counter-display-shared-engine-projection-foundation
resultArtifacts: []
checks: []
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

- [ ] Recurring Credits erhalten fachliche CounterDisplays mit passenden Anzeigehinweisen, ohne Regelwirkung.
- [ ] Data Raven, Cerberus und Mastiff werden aus den engine-seitigen Countertypen projiziert, nicht aus Web-Karten-ID-Hardcoding.
- [ ] Shell- und Ablative-Counter erhalten CounterDisplays.
- [ ] Sichtbare Virus-/Pox-Pfade sind geprüft und passend projiziert oder begründet zurückgestellt.
- [ ] Eingeschränkte Bit-Pools werden nicht mit generischen Stored Credits verwechselt.
- [ ] Hidden-Info-, Replay- und StateHash-Grenzen bleiben unverändert.

## Umsetzungshinweise

- Für Server-Counter wie Pox nur ein kleines additiv typisiertes Server-Displayfeld einführen, falls nötig.
- Displaydaten dürfen eine UX erklären, aber niemals Aktionen freischalten.

## Ergebnisnotiz

Noch offen.
