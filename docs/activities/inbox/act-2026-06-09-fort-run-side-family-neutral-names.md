---
activityId: act-2026-06-09-fort-run-side-family-neutral-names
status: inbox
kind: cleanup
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
  - act-2026-06-09-generic-trace-payment-pools
resultArtifacts: []
checks: []
---

# Fort-Run-Familien neutral benennen

## Ziel

Allgemeine Fort-/Run-Funktionen sollen nach ihrer Mechanikfamilie benannt werden, nicht nach der ersten Karte, die die Mechanik nutzt. Bereits vorhandene generische CardImplementation-Kinds sollen sich in Runtime-Funktionsnamen, Payloads und Tests widerspiegeln.

## Kontext und Quellen

- Architekturprüfung vom 2026-06-09 fand mehrere Runtime-Funktionen, bei denen der Ability-Kind generisch ist, der Funktionsname aber kartenspezifisch bleibt.
- Beispiele:
  - `rovingSubmarineIdsForServer`, `isRovingSubmarineRunBlocked`, `markRovingSubmarineActivityForServer`, `validateRovingSubmarineRunGate` für `can_run_fort_only_if_last_corp_turn_activity_on_fort`.
  - `parisTracePoolImplementationForCard`, `parisCityGridTracePoolSource`, `spendParisCityGridTracePool` für `corp_trace_bits_during_runs_on_this_fort`.
  - `oliviaSalazarRezSourcesForRunIce` und `derezOliviaSalazarTemporaryIce` für vergünstigtes temporäres Rezzen von ICE auf demselben Fort.
  - `Aardvark`-Interception-Funktionen für `aardvark_worm_lock_and_reaction`, falls später ähnliche Fort-Interception-Karten hinzukommen.

## Scope

- Fort-/Run-Familien mit generischem CardImplementation-Kind sammeln und klassifizieren.
- Namen im allgemeinen Runtime-Code neutralisieren, wo der Mechanismus nicht zwingend karteneinmalig bleiben muss.
- Für jeden neutralisierten Pfad prüfen:
  - Action-Erzeugung,
  - applyAction-Revalidation,
  - Payloads/PublicEvents,
  - Reset-/Cleanup-Punkte,
  - Tests.
- Public-Chronik oder UI dürfen Kartentitel weiter anzeigen, wenn die Quelle sichtbar ist; die interne Funktion und Payload-Schlüssel sollten aber neutral sein, wenn sie Mechanikfamilien darstellen.
- Bei zu breitem Scope mit einer Musterfamilie starten, bevorzugt Roving-artige Run-Gates oder Paris-artige Fort-Trace-Bit-Pools.

## Nicht im Scope

- Keine Änderung an Kartenregeln, Fort-Aktivitätsbedingungen, Countertypen, Rez-Kosten oder Run-Timing.
- Keine Entfernung von Kartennamen aus echten CardImplementation-Dateien, Kartendaten, Quellzitaten oder bewusst sichtbaren Chroniktexten.
- Keine Zusammenlegung von Mechaniken, die nur oberflächlich ähnlich sind, aber unterschiedliche Timingpunkte oder Hidden-Info-Grenzen haben.
- Keine Payload-Migration, wenn dadurch Replays oder UI-Flächen unnötig breit angepasst werden müssten; in diesem Fall zuerst interne Namen neutralisieren und Payload-Migration separat dokumentieren.

## Akzeptanzkriterien

- [ ] Mindestens eine Fort-Run-Familie mit generischem Ability-Kind nutzt im Runtime-Code neutrale Funktionsnamen.
- [ ] Tests oder Smokes zeigen, dass LegalActions und Revalidation vor und nach der Umbenennung fachlich gleich bleiben.
- [ ] Sichtbare Kartentitel bleiben dort erhalten, wo Spieler die Quelle erkennen sollen.
- [ ] Keine verdeckten Korp-Kartennamen gelangen neu in Runner-/Spectator-/Public-Kontexte.
- [ ] Die Umbenennung lässt sich über `rg` nachvollziehen: allgemeine Runtime-Pfade enthalten weniger erste-Karten-Namen für die migrierte Familie.

## Umsetzungshinweise

- Einstiegspunkte:
  - `packages/engine/src/game/run/fort-run-side-families.ts`
  - `packages/engine/src/game/board/board-state-action-execution.ts`
  - `packages/engine/src/game/install/install-card.ts`
  - `packages/engine/src/game/run/run-rez-window.ts`
  - `packages/engine/src/game/rez/rez-card.ts`
  - `packages/engine/src/game/run/run-end-cleanup.ts`
  - `packages/engine/src/ability-engine/definition-types.ts`
- Beispielnamen:
  - `activityGatedFortRunSourceIds`,
  - `isActivityGatedFortRunBlocked`,
  - `markFortActivityForRunGate`,
  - `fortTraceBitPoolSource`,
  - `sameFortTemporaryRezSourceIds`.

## Ergebnisnotiz

Noch offen.
