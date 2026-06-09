---
activityId: act-2026-06-09-restricted-action-grants-neutral-model
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
  - act-2026-06-08-ai-run-action-projection
resultArtifacts: []
checks: []
---

# Eingeschränkte Zusatzaktionen neutral modellieren

## Ziel

Sehr ähnliche Zusatzaktions-Mechaniken sollen nicht je Karte eigene State- und Resolver-Namen tragen. Für Run-only-Aktionen, Bonus-Runs und begrenzte Install-Aktionspakete soll ein kleines neutrales Modell entstehen, das Quelle, Aktionstyp, Anzahl, Kostenprofil und Cleanup-Timing parametrisiert.

## Kontext und Quellen

- Architekturprüfung vom 2026-06-09 nach dem Wilson-Fix.
- Wilson wurde weitgehend auf `runOnlyAction` und `runActionSpendingCap` neutralisiert, aber in `packages/engine/src/game/turn/runner-main-actions.ts` steht noch das allgemeine Action-Label `Wilson-Run auf ...`.
- `packages/shared/src/index.ts` enthält weiterhin mehrere kartenspezifische Action-Grant-Flags:
  - `allNighterBonusRunPending`
  - `bodyweightDataCrecheExtraRunPending`
  - `valuPakProgramInstallActionsRemaining`
  - `valuPakTemporaryProgramInstallCredits`
  - `edgerunnerTempsInstallActionsRemaining`
  - `runOnlyActionUsedSourceIdsThisTurn`
- `packages/engine/src/game/card-implementation/install-rez-runtime-deps.ts` setzt für Valu-Pak ein eigenes Programminstall-Bundle mit genau 5 Aktionen und 1 temporärem Credit.

## Scope

- Die bestehenden Zusatzaktionspfade vergleichen:
  - Wilson-artige Run-only-Aktion mit Spending-Cap,
  - All-Nighter-/Bodyweight-Bonus-Run ohne Click,
  - Valu-Pak-Programminstall-Aktionspaket,
  - Edgerunner-Temps-Installaktionen.
- Ein neutrales Modell oder Helper-Profil schneiden, zum Beispiel `restrictedActionGrant`, mit Parametern:
  - `sourceCardInstanceId` und `sourceDefinitionId`,
  - `actionType` oder erlaubte `LegalAction.type`,
  - `remainingActions`,
  - `bonusClickMode` oder Kostenprofil,
  - optionale temporäre Credits,
  - optionaler Spending-Cap,
  - Reset-/Cleanup-Timing.
- Das `Wilson-Run`-Label im allgemeinen Action-Aufbau neutralisieren oder aus der Quelle ableiten, ohne die Chronik absichtlich schlechter zu machen.
- KI-Verhalten beibehalten: Run-only-Aktionen müssen weiterhin als `start_run` mit Spend-Limit bewertbar bleiben.

## Nicht im Scope

- Keine Änderung an Kartenregeln, Kosten, Aktionsanzahl oder Spending-Cap.
- Keine neue allgemeine Action-DSL, wenn ein kleiner Helper ausreicht.
- Keine Änderung an LegalAction-Disziplin: UI, KI und Spieler dürfen weiterhin nur Engine-LegalActions einreichen.
- Keine Änderung an `applyAction`-Revalidierung, Replay, StateHash oder Hidden-Info-Grenzen.
- Keine pauschale Umbenennung sichtbarer Chronik-Kartentexte, wenn sie bewusst die Quelle benennen.

## Akzeptanzkriterien

- [ ] Das allgemeine Run-only-Action-Label ist nicht mehr fest `Wilson-Run`, sondern neutral oder quellenbasiert.
- [ ] Mindestens zwei Zusatzaktionspfade nutzen denselben neutralen Helper oder dasselbe State-Profil, sofern ihre Semantik identisch genug ist.
- [ ] Valu-Pak-/Edgerunner-/Bonus-Run-Resetlogik bleibt deterministisch und fokussiert getestet.
- [ ] Die Runner-KI erkennt Run-only-Aktionen weiterhin als serverbezogene Runs mit `runSpendingCap`.
- [ ] Keine neue Möglichkeit entsteht, Zusatzaktionen außerhalb ihrer Einschränkung einzusetzen.
- [ ] Engine- und AI-Regressionen für Run-only-Spending-Cap und relevante Bonusaktionspfade bleiben grün.

## Umsetzungshinweise

- Einstiegspunkte:
  - `packages/shared/src/index.ts`
  - `packages/engine/src/game/turn/runner-main-actions.ts`
  - `packages/engine/src/game/run/start-run-action-execution.ts`
  - `packages/engine/src/game/card-implementation/install-rez-runtime-deps.ts`
  - `packages/engine/src/game/run/run-end-cleanup.ts`
  - `packages/ai/src/runner-run-target-evaluation.ts`
  - `packages/ai/src/index.ts`
- Die vorhandene AI-Auswertung von `runSpendingCap` ist fachlich korrekt und soll nicht durch Label-Änderungen beschädigt werden.
- Bei zu großem Scope zuerst nur Wilson-Label plus ein gemeinsames `restrictedActionGrant`-Profil für Run-only und Bonus-Run schneiden; Valu-Pak/Edgerunner dann als Folgepaket dokumentieren.

## Ergebnisnotiz

Noch offen.
