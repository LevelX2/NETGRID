---
activityId: act-2026-05-24-proteus-phase-3a-variable-ice-foundation
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 3a
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 3a: Variable ICE Foundation

## Ziel

Den bestehenden ID-spezifischen Digiconda-/Food-Fight-Harness in eine generische CardImplementation-kompatible `variableRez`-/`variableIceState`-Familie überführen.

## Zielkarten

- `onr_proteus_020_digiconda` Digiconda
- `onr_proteus_022_food-fight` Food Fight

## Scope

- Eigene CardImplementation-Dateien für beide Karten.
- Generische variable Rez-Familien für X-Stärke und bezahlte ETR-Subroutinen.
- Keine Proteus-ID-/Kartennamen-Branches in nachgelagerten Engine-/UI-/Catalog-/KI-Pfaden.
- LegalAction-/`applyAction`-Revalidierung für variable Zusatzkosten, Kosten, Ziel, Side und StateVersion.
- Effektive Stärke/Subroutinen in PlayerViews, PublicEvents, Replay und StateHash.

## Nicht im Scope

- Keine Homing-Missile-Trace-Folgeeffekte.
- Keine weiteren variablen/subtypwechselnden ICE.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Digiconda und Food Fight haben eigene CardImplementation-Dateien.
- [ ] Der alte ID-spezifische Harness ist durch generische CardImplementation-Bausteine ersetzt.
- [ ] Variable Werte werden aus frischen LegalActions revalidiert und StateHash-stabil gespeichert.
- [ ] Encounter, Break-LegalActions, PlayerViews, PublicEvents und Replay nutzen dieselben effektiven Werte.
- [ ] PublicPayloads enthalten öffentliche variable Rez-Werte, aber keine verdeckten ICE-Informationen.

## Ergebnisnotiz

Noch offen.
