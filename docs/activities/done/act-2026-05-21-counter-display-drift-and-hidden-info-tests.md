---
activityId: act-2026-05-21-counter-display-drift-and-hidden-info-tests
status: done
kind: fix
area: test
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-21
completedAt: 2026-05-21
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-web-render-counter-displays
resultArtifacts:
  - packages/engine/src/index.test.ts
  - apps/web/app/action-board-ui.ts
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "counter display"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm --filter @netgrid/web test
  - git diff --check
---

# CounterDisplay-Drift- und Hidden-Info-Tests

## Ziel

Die Übergangsphase zwischen rohen `counters` und `counterDisplays` soll durch Tests abgesichert werden, damit alte Web-Helfer und neue Engine-Displaydaten nicht auseinanderlaufen und keine Hidden-Info-Leaks entstehen.

## Kontext und Quellen

- Die Migration lässt `VisibleCard.counters` zunächst kompatibel bestehen.
- Risiko: Web-Rendering fällt still auf alte Counter-Hardcodings zurück, während `counterDisplays` fehlen oder falsch sind.
- Risiko: CounterDisplays leaken bei verdeckten Korp-Karten Labels, Definitionen oder Counterdetails.
- Relevante Testbereiche:
  - `packages/engine/src/index.test.ts`
  - `apps/web/app/action-board-ui.test.ts`
  - `apps/web/app/*.test.ts`
  - Server-/Multiplayer-Payload-Tests bei Bedarf.

## Scope

- Legacy-Badge-Inventur testbar machen:
  - Jeder bisherige Legacy-Badge-Fall hat ein passendes `counterDisplay`.
  - Oder er steht in einer bewusst begründeten Ausnahmeliste.
- Stabile Sortierung und stabile `id`s für CounterDisplays testen.
- Duplikatvermeidung pro fachlicher Counterfamilie testen.
- Negative Hidden-Info-Tests für verdeckte Korp-Root-Karten ergänzen.
- StateHash-/Replay-Stabilität für reine Display-Projection nachweisen.
- Web-Test ergänzen, dass Board-Rendering nicht mehr still aus rohen `counters` neue Badges ableitet, sobald CounterDisplays fehlen.

## Nicht im Scope

- Keine neue Counter-Projection-Familie implementieren, außer kleine Testfixtures verlangen minimale Ergänzungen.
- Kein Cleanup alter Helfer; das Folgepaket erledigt Entfernung.
- Keine Änderung an Regeln, LegalActions oder Kosten.

## Akzeptanzkriterien

- [x] Alle bekannten Legacy-Badge-Familien sind durch CounterDisplay-Tests abgedeckt oder bewusst ausgenommen.
- [x] Verdeckte Korp-Karten leaken keine CounterDisplay-Labels, Definition-IDs oder sonstige nicht erlaubte Counterdetails.
- [x] CounterDisplay-IDs und Sortierung sind stabil.
- [x] Doppelte Displays für dieselbe fachliche Counterfamilie werden verhindert.
- [x] StateHash bleibt durch Projection unverändert.
- [x] Checks: passende Engine-/Web-/Server-Tests je berührtem Bereich.

## Umsetzungshinweise

- Negative Tests sind wichtiger als Snapshot-Breite.
- Testausnahmen müssen fachlich begründet und klein gehalten werden.

## Ergebnisnotiz

Erledigt. Die Engine-Tests prüfen stabile CounterDisplay-IDs/-Sortierung, Duplikatfreiheit, Hidden-Info-Grenzen über verdeckte Korp-Karten sowie unveränderte `hashState`-/LegalActions-Ergebnisse durch View-Projektion. Im Web ist die Render-Auswahl als testbarer Helper abgesichert: rohe `counters` erzeugen ohne `counterDisplays` keine Board-Badges mehr; Advancement-Displays werden für das bestehende Advancement-Gem-Rendering ausgefiltert.
