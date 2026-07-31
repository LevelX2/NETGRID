---
activityId: act-2026-07-31-breach-between-access-timing-contract
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-31
startedAt: 2026-07-31
completedAt: 2026-07-31
branch: codex/activities-worktree-20260731-203648
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/access/access-actions.ts
  - packages/engine/src/game/access/access-actions.test.ts
  - packages/engine/src/game/view/player-view-projection.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/access/access-actions.test.ts src/game/view/player-view-projection.test.ts src/index-tests/mechanics/hidden-zone-identity.test.ts src/index-tests/originalset/agenda-scorearea-recurring.test.ts src/index-tests/proteus/hidden-resource-hardening.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/engine test
  - corepack pnpm format:changed
---

# Timingvertrag zwischen zwei Access-Kandidaten härten

## Ziel

Zwischen dem Abschluss eines Karten-Accesses und der Auswahl des nächsten
Breach-Kandidaten dürfen nur die vom Breach-, Access-, Reaction- und
Choice-Vertrag tatsächlich vorgesehenen Entscheidungen erscheinen. Ein
allgemeines Paid-Ability- oder Korp-Rez-Fenster darf dort nicht künstlich
entstehen.

## Kontext und Quellen

- Nutzerklärung vom 31.07.2026: Der sichtbare Rücksprung auf die
  Run-Aktionsfläche zwischen zwei HQ-Zugriffen wirkt wie ein zusätzliches
  Reaktions- oder Rez-Fenster, obwohl danach lediglich erneut
  `Zugriff auf Karte` gewählt wird.
- Die lokale Comprehensive-Rules-Referenz
  `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`
  führt in Regel 7.5 den Breach als direkte Schleife:
  Kandidat wählen, Karte accessen, zur Kandidatenwahl zurückkehren. Innerhalb
  dieser Schleife ist kein allgemeines Paid-Ability- oder Rez-Fenster
  ausgewiesen.
- Korp-Rezoptionen für Nicht-ICE liegen in den mit `(R)` markierten
  Paid-Ability-Fenstern des Runs vor dem Breach. Der aktuelle Enginepfad
  wechselt beim Breach zu `timingPoint: access.resolve_card` und
  `activeSide: runner`.
- `packages/engine/src/game/access/access-actions.ts` ergänzt im Zustand
  `!run.accessedCardId` bei einem noch offenen Kandidaten derzeit neben
  `access_card` auch
  `runnerDuringRunCardImplementationLegalActions()` und
  `hiddenStackInstallRunActions(run)`.
- Dadurch können allgemeine `during_run`-Fähigkeiten wie
  `Self-Modifying Code` oder die Mystery-Box-Familie zwischen zwei Accesses
  angeboten werden, obwohl zunächst kein entsprechendes Paid-Ability-Fenster
  belegt ist.
- Verwandtes UI-Folgepaket:
  `act-2026-07-31-hq-multiaccess-dialog-clarity`.

## Scope

- Die vollständige Menge der LegalActions im Zwischenzustand nach
  `steal_agenda`, `trash_accessed_card` oder `decline_trash` und vor dem
  nächsten `access_card` gegen CR 7.5/11.5 sowie den aktuellen
  Access-/Reaction-/Choice-Vertrag prüfen.
- Allgemeine Runner-`during_run`- und Hidden-Stack-Install-Actions aus diesem
  Zustand entfernen, sofern keine explizite Regel-, Karten- oder
  Timingquelle genau dort eine Entscheidung erlaubt.
- Bestätigen, dass keine gewöhnliche Korp-`rez_card`-, `decline_rez`- oder
  `corp_during_run`-Action zwischen zwei Access-Kandidaten angeboten wird.
- Legitime Unterbrechungen aus dem gerade abgeschlossenen Access – etwa
  Access-Effekte, Ambushes, Kosten-/Prevention-Choices, Reactions oder
  ausdrücklich an den Breach gebundene Kandidatenentscheidungen – weiterhin
  vollständig auflösen, bevor der nächste Kandidat accesset wird.
- Den linearen Normalfall so definieren, dass nach der abgeschlossenen
  Kartenentscheidung ausschließlich die nächste Access-Fortsetzung oder das
  Breach-Ende verbleibt.
- Fokussierte Engine-, PlayerView-, Multiplayer-, Reconnect-, Replay- und
  StateHash-Regressionen für Single- und Multiaccess ergänzen.

## Nicht im Scope

- Keine Entfernung legaler Paid-Ability-Fenster in Initiation, Approach,
  Encounter oder Movement.
- Keine Änderung an ausdrücklich vor dem Breach liegenden Successful-Run-
  Followups, Access-Start-Fenstern oder Root-Rez-Fenstern.
- Keine pauschale Sperre aller Kartenfähigkeiten während eines Runs.
- Keine UI-Implementierung der nahtlosen Dialogfortsetzung; diese bleibt im
  verlinkten UI-Paket.
- Keine Änderung an Access-Anzahl, Kandidatenauswahl, Queue-Reihenfolge,
  Hidden-Info-Projektion oder Kartenkosten.

## Akzeptanzkriterien

- [x] Nach Abschluss eines nichtletzten Accesses enthält der lineare
      Zwischenzustand keine allgemeine `during_run`-, Hidden-Stack-Install-,
      Korp-Rez- oder Korp-During-Run-Action ohne exakte Timinggrundlage.
- [x] `Self-Modifying Code`, Mystery Box und mindestens eine weitere
      `during_run`-Familie besitzen positive Tests in einem echten
      Paid-Ability-Fenster und negative Tests zwischen zwei Accesses.
- [x] Zugriffseffekte, Ambush-/Prevention-Choices und regelkonforme Reactions
      werden vollständig aufgelöst und nicht von einer automatischen
      Fortsetzung übersprungen.
- [x] Der normale Multiaccess-Fall liefert nach aktualisierter StateVersion
      genau die nächste `access_card`-LegalAction; nach dem letzten Kandidaten
      wird der Breach deterministisch beendet.
- [x] Falsche Side, stale `actionId`/`stateVersion` und eine nicht zur
      aktuellen Queue-Position gehörende Access-Action werden weiterhin von
      `applyAction` abgelehnt.
- [x] Künftige HQ-/R&D-Kandidaten bleiben bis zu ihrem tatsächlichen Access
      in PlayerViews, PublicEvents, Reconnect und Chronik verborgen.
- [x] Replay und StateHash bleiben für Single-, Multiaccess- und
      unterbrochene Access-Fälle deterministisch.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Ausgangspunkte sind
  `packages/engine/src/game/access/access-actions.ts`,
  `packages/engine/src/game/access/access-breach-lifecycle.ts`,
  `packages/engine/src/game/run/card-implementation-run-actions.ts` und
  `packages/engine/src/game/run/encounter-actions.ts`.
- Nicht allein den UI-Rücksprung entfernen. Zuerst muss die Engine
  autoritativ bestimmen, ob im Zwischenzustand überhaupt mehr als eine
  legale Fortsetzung existiert.
- Falls eine Karte tatsächlich ein eigenes Zwischen-Access-Fenster benötigt,
  dieses eng als explizites Timing beziehungsweise Choice modellieren statt
  alle `during_run`-Fähigkeiten global freizuschalten.

## Ergebnisnotiz

Die Engine erkennt den Zustand zwischen zwei Breach-Kandidaten nun explizit
an der fortgeschrittenen Queue. Dort wird ausschließlich die nächste
`access_card`-LegalAction erzeugt; Successful-Run-, allgemeine `during_run`-
und Hidden-Stack-Actions werden nicht erneut abgefragt. Korp-Aktionen bleiben
am Timingpunkt `access.resolve_card` leer. Pending Choices und Reactions
werden weiterhin vor diesem Builder aufgelöst. Positive Paid-Window-Tests für
Self-Modifying Code, Mystery Box und Airport Locker bleiben grün; der neue
Multiaccess-Test deckt die negative Zwischenphase, Hidden Info, falsche Side,
stale StateVersion, Replay und StateHash ab.
