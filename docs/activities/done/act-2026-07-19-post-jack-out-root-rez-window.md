---
activityId: act-2026-07-19-post-jack-out-root-rez-window
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-19
startedAt: 2026-07-19
completedAt: 2026-07-19
branch: codex/post-jack-out-root-rez-window
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/game/run/run-movement.ts
  - packages/engine/src/game/run/run-rez-window.ts
  - packages/engine/src/game/run/run-flow-hosts.ts
  - packages/engine/src/game/legal-actions.ts
  - packages/engine/src/index-tests/mechanics/run-access-multiaccess.test.ts
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md
checks:
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm test:contracts
  - corepack pnpm typecheck
  - git diff --check
---

# Root-Rezfenster nach der Jack-out-Entscheidung öffnen

## Ziel

Die Movement-Sequenz eines Runs bildet die verbindliche Reihenfolge korrekt ab:
Der Runner entscheidet zuerst über das normale Jack-out, bewegt sich bei
„Weiter“ nach innen und erst danach erhält die Korp das Rezfenster für
Nicht-ICE. Nach dem letzten ICE kann die Korp dadurch einen Ambush-Node vor dem
Serverzugriff rezzen, ohne dem Runner anschließend erneut ein normales
Jack-out anzubieten.

## Kontext und Quellen

- Playtest-Fund vom 2026-07-19: Rezzt die menschliche Korp einen Ambush im
  derzeit angebotenen Movement-Fenster, kann der Runner danach auschecken.
  Wartet die Korp bis nach der Jack-out-Entscheidung, erscheint kein weiteres
  Rezfenster. Damit ist der regelkonforme Ambush-Ablauf aktuell nicht spielbar.
- Verbindliche Regelreferenz:
  `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`,
  Abschnitte 6.6.3 bis 6.6.6 sowie die detaillierte Run-Struktur 6.9.4b bis
  6.9.4h. Dort liegt die normale Jack-out-Entscheidung in 6.9.4c, die Bewegung
  in 6.9.4d und das Nicht-ICE-Rezfenster erst danach in 6.9.4e.
- Der aktuelle Stand in
  `packages/engine/src/game/run/run-rez-window.ts` öffnet das
  Root-Rezfenster ausschließlich am Timingpunkt `run.jack_out_window`.
- Der Regressionstest
  `packages/engine/src/index-tests/mechanics/run-access-multiaccess.test.ts`
  („blocks Runner movement while Corp has a root rez decision during a run“)
  schreibt derzeit die falsche Reihenfolge fest: erst Root-Rez/Pass, danach
  erneut Runner-Aktionen `jack_out` und `continue_run`.
- Follow-up zu
  `docs/activities/done/act-2026-05-22-human-corp-run-rez-window-root-cards.md`:
  Das damalige Paket machte die Entscheidung zwar blockierend, ordnete sie
  aber vor statt nach der Jack-out-Entscheidung ein.
- `docs/reviews/engine/node-access-rez-contract-final-review-2026-07-15.md`
  bestätigt, dass installierte Standard-Ambush-Nodes für ihren Zugriffseffekt
  gerezzt sein müssen. Das korrekte späte Rezfenster ist daher spielrelevant.

## Scope

- Den Movement-Ablauf so schneiden, dass das normale Runner-Jack-out und das
  anschließende Korp-Rezfenster für Assets und Upgrades zwei eindeutig
  geordnete Zustände sind.
- Das Root-Rezfenster nach der Runner-Entscheidung „Weiter“ und nach der
  Positionsbewegung öffnen, sowohl zwischen ICE-Positionen als auch nach dem
  letzten ICE vor dem Serveransatz.
- Im post-Jack-out Root-Rezfenster die menschliche Korp blockierend rezzen oder
  mit `Nichts rezzen / Weiter` passen lassen.
- Nach Abschluss dieses Fensters ohne neues ICE regulär in Approach Ice oder,
  nach dem letzten ICE, in Serveransatz, Success und Access weitergehen.
- LegalActions, PlayerViews, PublicEvents, Replay und StateHash für die neue
  Reihenfolge regressionssicher prüfen.
- Die bisherige Regression aus `run-access-multiaccess.test.ts` auf die
  korrekte Regelreihenfolge umstellen und mindestens einen echten
  Ambush-Node-Zugriff abdecken.

## Nicht im Scope

- Keine Änderung an Rez-Kosten, Access-Effekten oder der Frage, welche Assets
  und Upgrades grundsätzlich rezbar sind.
- Kein Sonderzweig für eine einzelne Ambush-Karte; die Lösung bleibt ein
  generischer Run-/Root-Rezvertrag.
- Kein Redesign des Action Boards über die für die zwei Fenster nötige klare
  Beschriftung hinaus.
- Kartenfähigkeiten, die ausdrücklich nach dem Rez eines Nodes oder Upgrades
  ein zusätzliches Jack-out erlauben, bleiben als kartenspezifische Ausnahme
  erhalten; sie dürfen nicht mit dem normalen Movement-Jack-out verwechselt
  oder entfernt werden.
- Keine Abschwächung von Hidden-Info-, LegalAction-, Replay- oder
  StateHash-Grenzen.

## Akzeptanzkriterien

- [x] Vor der Runner-Entscheidung „Weiter/Auschecken“ bietet die Engine kein
  Root-Rez als Ersatz für das spätere Nicht-ICE-Rezfenster an.
- [x] Wählt der Runner im Movement „Weiter“, wird danach ein blockierendes
  Korp-Rez-/Pass-Fenster für legal rezbare Nicht-ICE-Karten angeboten.
- [x] Rezzt die Korp nach dem letzten ICE einen Ambush-Node und schließt das
  Root-Rezfenster, kann der Runner nicht noch einmal über das normale
  Movement-Jack-out auschecken; der Run geht in Serveransatz, Success und
  Access über.
- [x] Passt die Korp im post-Jack-out Root-Rezfenster, geht der Run ohne
  zusätzliches Runner-Jack-out regelkonform weiter.
- [x] Zwischen zwei ICE-Positionen folgt nach dem post-Jack-out Root-Rezfenster
  der Approach des nächsten ICE; die vorhandenen ICE-Rezfenster bleiben
  korrekt.
- [x] Ein vorhandener kartenspezifischer Rez-Interrupt kann weiterhin genau
  nach seinem Kartentext ein separates Jack-out eröffnen.
- [x] Runner-PlayerViews verraten weder rezbare verdeckte Root-Karten noch
  Kartennamen; PublicEvents bleiben side-safe.
- [x] Fokussierte Engine-Regressionen sowie Replay- und StateHash-Prüfungen
  sind grün.

## Umsetzungshinweise

- Nicht nur die Sichtbarkeit der Buttons ändern: Die Engine benötigt einen
  eigenen, aus dem Zustand ableitbaren post-Jack-out Movement-Schritt oder
  eine gleichwertige eindeutige Zustandsmarkierung.
- `isCorpRunRootRezWindowOpen`, `corpRunRootRezWindowKey`,
  `passCorpRunRootRezWindow`, Runner-/Korp-LegalActions und die
  Movement-Transition gemeinsam prüfen. Ein bloßes Umbenennen des bestehenden
  `run.jack_out_window` reicht nicht.
- Sicherstellen, dass Rezzen mehrerer Root-Karten im selben Fenster möglich
  bleibt und erst der ausdrückliche Pass die Movement-Sequenz fortsetzt.
- Die bestehende Activity vom 2026-05-22 nicht nachträglich umdeuten; dieses
  Paket ist ihr regelkorrigierendes Follow-up.

## Ergebnisnotiz

Die Run-State-Machine besitzt mit `run.movement_rez_window` nun einen eigenen
post-Jack-out-Timingpunkt. Normale Root-Rez-Aktionen sind aus dem vorherigen
Jack-out-Fenster entfernt; dort verbleiben ausschließlich regel- oder
kartengebundene Fort-Pass-Aktionen. Nach `continue_run` blockiert die Korp mit
Rez- oder expliziter Pass-Entscheidung, danach geht der Run direkt in den
nächsten ICE-Approach oder in den Zugriff.

Die Regression deckt sowohl Pass als auch einen real gerezzten `Setup!`-
Ambush mit anschließendem Zugriff ab. Runner-PlayerView, PublicEvent, Replay
und StateHash bleiben side-safe und deterministisch; der kartenspezifische
Speed-Trap-Rez-Interrupt sowie Pavit-Auswahlfolgen bleiben funktionsfähig.
