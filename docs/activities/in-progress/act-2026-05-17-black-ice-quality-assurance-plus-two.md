---
activityId: act-2026-05-17-black-ice-quality-assurance-plus-two
status: in_progress
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt:
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Black Ice Quality Assurance: Black-ICE-Bonus +2 prüfen

## Ziel

Die gescorte Agenda `Black Ice Quality Assurance` soll nach Nutzerangabe allem Black ICE `+2 Stärke` geben; Berechnung und UI-Chip müssen damit konsistent sein.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: `Cinderella` liegt als geresstes Black ICE aus, zeigt aber nur `+1 Stärke`; erwartet ist `+2`.
- Lokale Kartenanker: `onr_v1_191_black-ice-quality-assurance`, `onr_v1_228_cinderella`.

## Scope

- Lokalen Kartentext/Regelstand gegen Nutzererwartung prüfen.
- Agenda-Modifier-Wert, Black-ICE-Erkennung und Layering prüfen.
- UI-Chip und berechnete Stärke gemeinsam korrigieren.
- Recalculation nach Scoring und bei bereits ausliegendem ICE testen.

## Nicht im Scope

- Keine generelle Modifier-Pipeline neu bauen, sofern ein fokussierter Fix reicht.
- Keine Änderung an Cinderella selbst außer Subtype-/Tag-Erkennung, falls diese Ursache ist.

## Akzeptanzkriterien

- [ ] Gesicherter Regelstand für `Black Ice Quality Assurance` ist geprüft.
- [ ] Falls Nutzererwartung korrekt ist: Black ICE erhält rechnerisch und sichtbar `+2 Stärke`.
- [ ] Bereits ausliegendes geresstes ICE wird nach Scoring neu berechnet.
- [ ] UI-Chip, Kartenstärke und Chronik/Eventdaten widersprechen sich nicht.
- [ ] Regression deckt Cinderella als Black ICE ab.

## Umsetzungshinweise

- Falls lokale Daten absichtlich `+1` modellieren, Regelkonflikt sichtbar dokumentieren und Folgeentscheidung statt stiller Änderung anlegen.

## Ergebnisnotiz

Noch offen.
