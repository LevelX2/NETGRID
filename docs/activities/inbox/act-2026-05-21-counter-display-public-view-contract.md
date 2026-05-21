---
activityId: act-2026-05-21-counter-display-public-view-contract
status: inbox
kind: architecture
area: shared
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# CounterDisplay-PublicView-Vertrag schärfen

## Ziel

Ein enger Architekturvertrag für `counterDisplays` soll festlegen, dass Counter-Anzeige-Semantik aus der Engine-/Public-View-Projection kommt, ohne eine zweite Regelautorität oder einen neuen Hidden-Info-Pfad zu erzeugen.

## Kontext und Quellen

- Broker-Regression: Engine legt gespeicherte Credits als öffentliche `bit`-Counter auf Broker; Web-UI suchte zuvor kartenhartcodiert nach `power`.
- Aktueller Befund: `VisibleCard.counters` liefert rohe technische `CounterType`-Werte, während die Web-UI in `apps/web/app/action-board-ui.ts`, `apps/web/app/page.tsx` und `apps/web/app/score-area-ui.ts` über Karten-ID plus Countertyp Anzeige-Semantik errät.
- Relevante Dateien:
  - `packages/shared/src/index.ts`
  - `packages/engine/src/index.ts`
  - `packages/engine/src/state-hash.ts`
  - `apps/web/app/action-board-ui.ts`
  - `apps/web/app/page.tsx`
  - `apps/web/app/score-area-ui.ts`

## Scope

- Minimalen `CounterDisplay`-Vertrag dokumentieren:
  - `id`
  - `amount`
  - `displayKind`
  - `label`
  - `ariaLabel`
  - optional `counterType`
  - optional `usageHint` als reiner Anzeigehinweis.
- Festlegen, dass `counterDisplays` nur im viewer-spezifischen `PlayerView`/Public-View-Projektor entstehen und nicht im `GameState` gespeichert werden.
- Festlegen, dass die Projection vollständig entscheidet, welche CounterDisplays vorhanden sind; kein `visibility`-Feld an die UI geben.
- Festlegen, dass `usageHint` keine Legalität begründet und niemals von UI, Server oder KI als Regelentscheidung genutzt werden darf.
- Hidden-Info-, Replay- und StateHash-Grenzen als harte Anforderungen aufnehmen.

## Nicht im Scope

- Keine Codeänderung.
- Keine Migration einzelner Counterfamilien.
- Kein Web-Renderer-Umbau.
- Keine Änderung an bestehenden Countertypen oder GameState-Feldern.

## Akzeptanzkriterien

- [ ] Der Zielvertrag ist in dieser Activity oder einem verlinkten Architekturartefakt eindeutig formuliert.
- [ ] Der Vertrag schließt `visibility` im UI-Payload für den ersten Schnitt aus.
- [ ] Der Vertrag benennt `usageHint` ausdrücklich als Anzeigehinweis, nicht als Regelquelle.
- [ ] Der Vertrag legt fest, dass `counterDisplays` nicht in `GameState` gespeichert werden und `hashState` nicht beeinflussen dürfen.
- [ ] Der Vertrag nennt verdeckte Korp-Karten als negative Hidden-Info-Referenz: keine Identität, keine Labels, keine sonstigen Counterdetails außer erlaubten öffentlichen Advancement-Countern.

## Umsetzungshinweise

- Dieses Paket soll die Folgepakete fachlich führen, aber keine Implementierung vorwegnehmen.
- Bei Konflikt mit bestehenden UI-Helfern gilt: erst Vertrag schärfen, dann in Folgepaketen migrieren.

## Ergebnisnotiz

Noch offen.
