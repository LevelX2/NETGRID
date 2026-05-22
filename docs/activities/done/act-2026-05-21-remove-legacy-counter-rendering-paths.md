---
activityId: act-2026-05-21-remove-legacy-counter-rendering-paths
status: done
kind: cleanup
area: web
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-counter-display-public-view-contract
  - act-2026-05-21-counter-display-shared-engine-projection-foundation
  - act-2026-05-21-counter-display-stored-credits-and-agenda-pools
  - act-2026-05-21-counter-display-special-and-recurring-counters
  - act-2026-05-21-web-render-counter-displays
  - act-2026-05-21-counter-display-drift-and-hidden-info-tests
resultArtifacts:
  - apps/web/app/action-board-ui.ts
  - apps/web/app/page.tsx
  - apps/web/app/action-board-ui.test.ts
checks:
  - corepack pnpm --filter @netgrid/web test -- action-board-ui.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Legacy-Counter-Renderingpfade entfernen

## Ziel

Nach erfolgreicher CounterDisplay-Migration sollen die alten Web-seitigen Counter-Hardcodings entfernt oder auf reine Debug-/Legacy-Daten begrenzt werden, damit die UI nicht wieder aus rohen `counters` rät.

## Kontext und Quellen

- Dieses Cleanup ist bewusst nachgelagert und hängt von allen CounterDisplay-Vorarbeiten ab.
- Zu entfernende oder umzubauen prüfende Stellen:
  - `STORED_CREDIT_COUNTER_SOURCES` in `apps/web/app/action-board-ui.ts`
  - `armoredFridgeAblativeCounterBadge` in `apps/web/app/action-board-ui.ts`
  - `storedCreditAmount`, `storedCreditSourceLabel`, `recurringCreditAmount`, `shellCounterAmount`, `dataRavenCounterAmount`, `counterAmount` in `apps/web/app/page.tsx`, soweit sie Rendering-Semantik aus rohen Countern ableiten.
  - `scoredAgendaCreditCounterSource` in `apps/web/app/score-area-ui.ts`, soweit es nur Counter-Display-Semantik liefert.

## Scope

- Alte Board-Rendering-Fallbacks auf rohe `counters` entfernen oder testbar deaktivieren.
- Tests aktualisieren, sodass fehlende CounterDisplays sichtbar fehlschlagen statt durch Karten-ID-Sonderlogik kaschiert zu werden.
- Falls einzelne rohe `counters` weiter in Debug-/Detailtexten gebraucht werden, klar vom Board-Rendering trennen.
- Dokumentieren, welche Altpfade entfernt wurden und welche bewusst erhalten bleiben.

## Nicht im Scope

- Nicht beginnen, bevor alle `blockedBy`-Pakete abgeschlossen sind.
- Keine neue CounterDisplay-Familie in diesem Cleanup nachziehen; fehlende Familien als neues Inbox-Paket schneiden.
- Keine Änderung an Engine-Regeln, LegalActions, StateHash oder Hidden-Info-Projection.
- Keine pauschale UI-Neugestaltung.

## Akzeptanzkriterien

- [ ] Board-Counter-Badges werden nicht mehr aus Web-seitigen Karten-ID-zu-Countertyp-Tabellen abgeleitet.
- [ ] Rendering aus rohen `counters` ist entfernt, deaktiviert oder als Nicht-Board-Debugpfad klar begrenzt.
- [ ] Drift-Tests aus `act-2026-05-21-counter-display-drift-and-hidden-info-tests` bleiben grün.
- [ ] Keine Hidden-Info-Regression bei verdeckten Korp-Karten.
- [ ] Checks: passende Web-Tests und Typecheck.

## Umsetzungshinweise

- Dieses Paket ist absichtlich `priority: normal`, obwohl der Gesamtbereich wichtig ist, weil es erst nach den High-Priority-Migrationspaketen sinnvoll ist.
- Wenn beim Entfernen eine fehlende CounterDisplay-Familie auffällt, nicht ad hoc im Web hartcodieren, sondern ein kleines Folgepaket für die Projection anlegen.

## Ergebnisnotiz

Erledigt. Die Web-Helfer für gespeicherte Credits und Ablative-Badges lesen keine Karten-ID-zu-Countertyp-Tabelle und keine rohen `counters` mehr; sie liefern sichtbare Werte nur noch aus `counterDisplays`. Die Tests sichern zusätzlich, dass Broker- und Armored-Fridge-Rohcounter ohne CounterDisplay keine Badge-Werte mehr erzeugen.

Der verbliebene Score-Area-Pfad für Bonus-Agenda-Punkte aus `counters.agenda` wurde aus dem sichtbaren Rendering entfernt. Damit bleiben Board- und Score-Card-Badges auf die Engine-Projektion begrenzt; falls Bonus-Agenda-Counter wieder sichtbar werden sollen, braucht das ein eigenes Engine-CounterDisplay-Paket statt Web-Hardcoding.

Fokussierter Web-Test, Web-Typecheck und `git diff --check` waren grün.
