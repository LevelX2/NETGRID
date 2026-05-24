---
activityId: act-2026-05-24-proteus-phase-1c-free-rez-ice-counter-lifecycle
status: inbox
kind: concept
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 1c
blockedBy:
  - act-2026-05-24-proteus-phase-1a-reuse-only-baseline
resultArtifacts: []
checks: []
---

# Proteus Phase 1c: Free Rez and ICE Counter Lifecycle

## Ziel

Die beiden Korp-Operationen `Emergency Rig` und `Rent-to-Own Contract` als gemeinsame Free-Rez-/Named-Counter-Familie planen und später umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/phase-1-slice-handoff-2026-05-24.md`.
- `docs/releases/proteus/release-slicing-plan.md`, Slice 1.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- `data/cards/proteus-cards.json`.
- `packages/engine/src/ability-engine/definition-types.ts`.

## Zielkarten

- `onr_proteus_049_emergency-rig` Emergency Rig
- `onr_proteus_051_rent-to-own-contract` Rent-to-Own Contract

## Benötigte Funktionsbausteine

- Corp-operation target binding für installierte ICE:
  - Ziel ist ein installiertes ICE.
  - Revalidierung prüft Zieltyp, Zone, Controller, Timing und aktuelle Rezzed-/Unrezzed-Lage.
- Free-rez effect:
  - rezzed ein ICE ohne Rez-Kosten.
  - PublicPayload nennt nur öffentliche Zielposition und Rez-Ergebnis.
  - StateHash enthält den Rez-Zustand deterministisch.
- Öffentliche Named Counter auf ICE:
  - `Kludge` für `Emergency Rig`.
  - `Term` für `Rent-to-Own Contract`.
  - Counter sind public, replay- und reconnect-stabil.
- Integer-Choice für `Emergency Rig`:
  - `X` darf nicht 0 sein.
  - Obergrenze und Bezahlbezug sind vor Umsetzung zu klären, falls sie nicht aus lokalen Quellen hervorgehen.
- Start-of-Corp-turn Lifecycle:
  - `Emergency Rig`: einen Kludge-Counter entfernen; ICE trashen, wenn der letzte Counter entfernt wird.
  - `Rent-to-Own Contract`: Term-Counter initial in Höhe der Rez-Kosten; zu Zugbeginn bei mindestens 2 Credits `[2]` verlieren und einen Term-Counter entfernen, sonst einen Term-Counter hinzufügen.
- Cleanup bei Target-Leave-Play, Derez, Trash oder Zonewechsel.

## Nicht im Scope

- Keine Virus-/Antibody-Counter.
- Keine Bad-Publicity-Game-End-Logik.
- Keine Hidden-Zone-Suche.
- Keine variablen ICE-Rez-Familien außerhalb dieser beiden Operationen.
- Keine AI-Hints oder Decklegalität.

## Akzeptanzkriterien

- [ ] Beide Operationen haben per-card CardImplementation-Dateien.
- [ ] Free-Rez, Counteranlage und Start-of-turn-Trigger sind side-sicher.
- [ ] Counter- und Target-Zustände überleben Reconnect und Replay stabil.
- [ ] Illegal/stale target choices werden durch `applyAction` abgelehnt.
- [ ] Hidden-Info-Payloads enthalten keine verdeckten Kartennamen.

## Umsetzungshinweise

- Diese Familie ist ein guter Vorlauf für spätere Proteus-Counter, darf aber keine Virus-/Antibody-Semantik vorwegnehmen.
- Wenn `X` für `Emergency Rig` eine Regellücke bleibt, zuerst eine Regelklärungsnotiz anlegen und die Karte nicht als umgesetzt markieren.

## Ergebnisnotiz

Noch offen.
