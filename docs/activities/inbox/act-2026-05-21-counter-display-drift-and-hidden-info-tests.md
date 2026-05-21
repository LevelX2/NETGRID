---
activityId: act-2026-05-21-counter-display-drift-and-hidden-info-tests
status: inbox
kind: fix
area: test
priority: high
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-web-render-counter-displays
resultArtifacts: []
checks: []
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

- [ ] Alle bekannten Legacy-Badge-Familien sind durch CounterDisplay-Tests abgedeckt oder bewusst ausgenommen.
- [ ] Verdeckte Korp-Karten leaken keine CounterDisplay-Labels, Definition-IDs oder sonstige nicht erlaubte Counterdetails.
- [ ] CounterDisplay-IDs und Sortierung sind stabil.
- [ ] Doppelte Displays für dieselbe fachliche Counterfamilie werden verhindert.
- [ ] StateHash bleibt durch Projection unverändert.
- [ ] Checks: passende Engine-/Web-/Server-Tests je berührtem Bereich.

## Umsetzungshinweise

- Negative Tests sind wichtiger als Snapshot-Breite.
- Testausnahmen müssen fachlich begründet und klein gehalten werden.

## Ergebnisnotiz

Noch offen.
